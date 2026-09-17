import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { JobQueue, exponentialBackoff } from "../src/jobs/queue.js";
import { Ledger } from "../src/loyalty/ledger.js";
import { normalizePhone, registrationSchema } from "../src/onboarding/schema.js";
import { onboardApplicant } from "../src/onboarding/workflow.js";
import type { PartnerClient } from "../src/onboarding/partner.js";
import { TenantRouter, tenantGuard, TenantError } from "../src/tenancy/router.js";
import { assignOrder } from "../src/dispatch/radiusSearch.js";
import { signSortedHmac, verifySortedHmac } from "../src/webhooks/hmac.js";
import { applySignedPayment, PaymentStore } from "../src/webhooks/payments.js";
import { validateWebAppInitData } from "../src/auth/webappHmac.js";
import { SseHub } from "../src/sse/hub.js";
import { allRouteSlugs, composeRoute, demoCatalog } from "../src/seo/compose.js";
import { Cache, MemoryStore } from "../src/cache/degrade.js";
import { RealtimeBus, userRoom } from "../src/realtime/bus.js";

test("jobs retry then dead-letter", async () => {
  let hits = 0;
  const queue = new JobQueue(async () => {
    hits += 1;
    throw new Error("partner timeout");
  }, async () => undefined);
  queue.enqueue("onboard", { id: 1 }, { attempts: 3, backoffMs: 1 });
  await queue.drain();
  assert.equal(hits, 3);
  assert.equal(queue.deadLetter.length, 1);
  assert.equal(exponentialBackoff(3, 2000), 8000);
});

test("loyalty ledger is insert-once", () => {
  const ledger = new Ledger();
  assert.equal(ledger.enqueue("referral", "d1", "2026-09", 50), true);
  assert.equal(ledger.enqueue("referral", "d1", "2026-09", 50), false);
  assert.equal(ledger.pending().length, 1);
});

test("onboarding validates and talks to partner API", async () => {
  const parsed = registrationSchema.parse({
    track: "vehicle",
    firstName: "Alex",
    lastName: "Koval",
    phone: "375291112233",
    birthDate: "1994-02-02",
    plate: "ab 1234-5",
    year: 2020
  });
  assert.equal(parsed.track, "vehicle");
  assert.equal(normalizePhone("80291112233"), "+375291112233");

  const partner: PartnerClient = {
    async createWalkingProfile() {
      return { id: "drv-w", vehicleId: null };
    },
    async createVehicle() {
      return { id: "veh-1" };
    },
    async createDriverProfile() {
      return { id: "drv-1", vehicleId: "veh-1" };
    },
    async bindVehicle() {}
  };

  const result = await onboardApplicant(
    {
      track: "vehicle",
      firstName: "Alex",
      lastName: "Koval",
      phone: "+375291112233",
      birthDate: "1994-02-02",
      plate: "AB12345",
      year: 2020
    },
    partner,
    async () => "app-1"
  );
  assert.equal(result.partnerDriverId, "drv-1");
  assert.equal(result.partnerVehicleId, "veh-1");
});

test("tenant guard blocks cross-tenant access", () => {
  const router = new TenantRouter({ name: "platform" }, new Map([["t1", { name: "fleet-a" }]]));
  assert.equal(router.store("t1").name, "fleet-a");
  assert.equal(tenantGuard({ userId: "1", tenantId: "t1", role: "member" }, "t1"), "t1");
  assert.throws(
    () => tenantGuard({ userId: "1", tenantId: "t1", role: "member" }, "t2"),
    TenantError
  );
  assert.equal(tenantGuard({ userId: "0", tenantId: "t0", role: "platform_admin" }, "t1"), "t1");
});

test("dispatch expands radius and ranks nearby drivers", () => {
  const order = { id: "o1", tenantId: "t1", pickupLat: 53.9, pickupLng: 27.56 };
  const drivers = [
    { id: "far", tenantId: "t1", lat: 54.2, lng: 27.9, available: true, priority: 10, rating: 5 },
    { id: "near", tenantId: "t1", lat: 53.91, lng: 27.57, available: true, priority: 1, rating: 4.2 },
    { id: "other", tenantId: "t2", lat: 53.9, lng: 27.56, available: true, priority: 99, rating: 5 }
  ];
  const result = assignOrder(order, drivers, { startKm: 2, maxKm: 8, stepKm: 2, notify: 1 });
  assert.ok(result);
  assert.equal(result.driverIds[0], "near");
});

test("signed payments reject bad signatures and ignore duplicates", () => {
  const secret = "ipn-secret";
  const body = { paymentId: "pay_1", status: "confirmed" as const, amount: 40 };
  const signature = signSortedHmac(body, secret);
  assert.equal(verifySortedHmac(body, signature, secret), true);
  const store = new PaymentStore();
  assert.equal(applySignedPayment(body, signature, secret, store).ok, true);
  const second = applySignedPayment(body, signature, secret, store);
  assert.equal(second.ok, true);
  if (second.ok) assert.equal(second.duplicate, true);
  assert.equal(applySignedPayment(body, "00", secret, store).ok, false);
});

test("webapp hmac validates init data", () => {
  const token = "bot-token";
  const params = new URLSearchParams({
    auth_date: "1700000000",
    query_id: "AA",
    user: "{\"id\":1}"
  });
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  assert.equal(validateWebAppInitData(params.toString(), token), true);
  assert.equal(validateWebAppInitData(params.toString(), "wrong"), false);
});

test("SSE hub fans out and sets proxy-safe headers", () => {
  const hub = new SseHub();
  const chunks: string[] = [];
  const off = hub.subscribe((chunk) => chunks.push(chunk));
  hub.publish("message", { id: 7 });
  off();
  hub.publish("message", { id: 8 });
  assert.equal(chunks.length, 1);
  assert.match(chunks[0], /event: message/);
  assert.equal(hub.headers()["X-Accel-Buffering"], "no");
});

test("programmatic routes exceed 190 slugs", () => {
  const { cities, intents } = demoCatalog();
  const slugs = allRouteSlugs(cities, intents);
  assert.ok(slugs.length > 190);
  const page = composeRoute("city-2-courier", cities, intents);
  assert.equal(page?.title, "Courier in City 2");
});

test("cache degrades when store is down", async () => {
  const live = new Cache(new MemoryStore());
  await live.set("k", "v");
  assert.equal(await live.get("k"), "v");
  const down = new Cache({
    async get() {
      throw new Error("redis down");
    },
    async set() {
      throw new Error("redis down");
    },
    async del() {
      throw new Error("redis down");
    }
  });
  assert.equal(await down.get("k"), null);
});

test("realtime rooms isolate tenants", () => {
  const bus = new RealtimeBus();
  const seen: string[] = [];
  bus.join(userRoom("42"), (event) => seen.push(event));
  bus.emit(userRoom("99"), "balance", { n: 1 });
  bus.emit(userRoom("42"), "balance", { n: 2 });
  assert.deepEqual(seen, ["balance"]);
});
