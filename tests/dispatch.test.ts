import assert from "node:assert/strict";
import { test } from "node:test";
import { estimatePrice } from "../src/dispatch/pricing.js";
import { OrderBook } from "../src/dispatch/orders.js";
import { maybeIgnoreLowball, recalculateRating } from "../src/dispatch/rating.js";
import { PRIORITY_CONFIG, recalculatePriority } from "../src/dispatch/priority.js";
import { LiveNetwork } from "../src/dispatch/live.js";
import { MemoryRateLimiter, RateLimitExceeded } from "../src/dispatch/rateLimit.js";
import { issueToken, verifyToken } from "../src/dispatch/tokens.js";
import { MatchingService } from "../src/dispatch/matching.js";
import { dispatcherBoard, staleOrders } from "../src/dispatch/dispatcher.js";
import { DriverRegistry } from "../src/dispatch/drivers.js";
import { PassengerBook } from "../src/dispatch/passengers.js";
import { CompanyCatalog } from "../src/dispatch/companies.js";
import { PLAN_LIMITS, withinDriverLimit } from "../src/dispatch/subscriptions.js";
import { issueInvoice, tenantRevenue } from "../src/dispatch/invoices.js";
import { boundingBox, haversineKm, inCircle, inPolygon } from "../src/dispatch/geo.js";
import { decodeFakePolyline, encodeFakePolyline, estimateLeg } from "../src/dispatch/maps.js";
import { onOrderAccepted, onOrderSkipped } from "../src/dispatch/gamification.js";
import { PoolRouter } from "../src/tenancy/pools.js";
import type { Driver } from "../src/dispatch/radiusSearch.js";

test("pricing grows with distance and out-of-city multiplier", () => {
  const short = estimatePrice({ lat: 53.9, lng: 27.56 }, { lat: 53.91, lng: 27.57 }, "econom");
  const long = estimatePrice({ lat: 53.9, lng: 27.56 }, { lat: 54.4, lng: 28.5 }, "econom");
  assert.ok(long.estimatedPrice > short.estimatedPrice);
  assert.equal(long.isOutOfCity, true);
});

test("order book rejects illegal transitions", () => {
  const book = new OrderBook();
  const order = book.create({
    tenantId: "t1",
    passengerId: "p1",
    pickup: { lat: 53.9, lng: 27.56, address: "A" },
    dropoff: { lat: 53.91, lng: 27.57, address: "B" },
    tariff: "econom",
    estimatedPrice: 8
  });
  assert.throws(() => book.transition(order.id, "completed"));
  book.transition(order.id, "searching");
  book.assign(order.id, "d1");
  assert.equal(book.activeForDriver("d1")?.id, order.id);
});

test("rating window hides low sample and pending lowballs", () => {
  assert.equal(maybeIgnoreLowball(2, 4.9), "PENDING");
  const few = Array.from({ length: 5 }, (_, i) => ({
    id: `r${i}`,
    driverId: "d1",
    orderId: `o${i}`,
    score: 5,
    status: "VALID" as const
  }));
  assert.equal(recalculateRating(few), null);
  const many = Array.from({ length: 12 }, (_, i) => ({
    id: `r${i}`,
    driverId: "d1",
    orderId: `o${i}`,
    score: i < 2 ? 4 : 5,
    status: "VALID" as const
  }));
  const rating = recalculateRating(many);
  assert.ok(rating && rating > 4.5);
});

test("priority caps and skip penalty", () => {
  const high = recalculatePriority({
    rating: 4.96,
    level: "PLATINUM",
    hasBranding: true,
    hasChildSeat: true,
    carYear: 2024,
    acceptedOrders: 40,
    skippedOrders: 0
  });
  assert.equal(high.priority, 89);
  assert.ok(high.priority <= PRIORITY_CONFIG.maxPriority);
  const skipped = recalculatePriority({
    rating: 4.2,
    acceptedOrders: 0,
    skippedOrders: 10
  });
  assert.ok(skipped.priority < 10);
});

test("live network fans out location only to the passenger", () => {
  const live = new LiveNetwork();
  live.driverOnline("d1", "t1", "s1");
  live.connect({ id: "p1", role: "passenger", tenantId: "t1", socketId: "s2" });
  live.updateLocation("d1", { lat: 53.9, lng: 27.56 }, "p1");
  live.updateLocation("d1", { lat: 53.91, lng: 27.57 }, "p2");
  assert.equal(live.log.filter((row) => row.event === "driver-location-update").length, 1);
});

test("rate limiter blocks after points", () => {
  const limiter = new MemoryRateLimiter(2, 60, 30);
  limiter.consume("k");
  limiter.consume("k");
  assert.throws(() => limiter.consume("k"), RateLimitExceeded);
});

test("access tokens are hmac-bound to tenant", () => {
  const token = issueToken({ userId: "1", tenantId: "t1", role: "member" }, "secret-secret-secret");
  const claims = verifyToken(token, "secret-secret-secret");
  assert.equal(claims.tenantId, "t1");
  assert.throws(() => verifyToken(token, "other-secret-other"));
});

test("matching offers nearby drivers then accepts one", () => {
  const book = new OrderBook();
  const live = new LiveNetwork();
  const matching = new MatchingService(book, live);
  const drivers: Driver[] = [
    { id: "near", tenantId: "t1", lat: 53.901, lng: 27.561, available: true, priority: 10, rating: 4.8 },
    { id: "far", tenantId: "t1", lat: 54.5, lng: 28.2, available: true, priority: 90, rating: 5 }
  ];
  const result = matching.search(
    {
      tenantId: "t1",
      passengerId: "p1",
      pickup: { lat: 53.9, lng: 27.56, address: "A" },
      dropoff: { lat: 53.92, lng: 27.58, address: "B" },
      tariff: "comfort"
    },
    drivers
  );
  assert.ok(result);
  assert.equal(result.driverIds[0], "near");
  matching.accept(result.orderId, "near", "p1");
  assert.equal(book.get(result.orderId).status, "assigned");
});

test("dispatcher board and stale search", () => {
  const book = new OrderBook();
  const live = new LiveNetwork();
  const order = book.create({
    tenantId: "t1",
    passengerId: "p1",
    pickup: { lat: 53.9, lng: 27.56, address: "A" },
    dropoff: { lat: 53.91, lng: 27.57, address: "B" },
    tariff: "econom",
    estimatedPrice: 7
  });
  book.transition(order.id, "searching");
  order.createdAt = new Date(Date.now() - 120_000);
  assert.equal(staleOrders(book.forTenant("t1"), 60).length, 1);
  assert.equal(dispatcherBoard(book.forTenant("t1"), live).length, 1);
});

test("drivers passengers companies subscriptions invoices", () => {
  const drivers = new DriverRegistry();
  drivers.upsert({
    id: "d1",
    tenantId: "t1",
    fullName: "Alex",
    status: "online",
    hasBranding: true,
    hasChildSeat: false,
    acceptedOrders: 0,
    skippedOrders: 0,
    rating: 4.9,
    priority: 10,
    vehicleYear: 2022
  });
  onOrderSkipped(drivers, "d1");
  onOrderAccepted(drivers, "d1");
  assert.equal(drivers.rows.get("d1")?.status, "busy");

  const passengers = new PassengerBook();
  passengers.upsert({ id: "p1", tenantId: "t1", phone: "+375290000000", blocked: true, trips: 0 });
  assert.equal(passengers.canOrder("p1").ok, false);

  const companies = new CompanyCatalog();
  const company = companies.create("Fleet A", "fleet_a");
  assert.equal(companies.canAcceptTraffic(company.id), true);
  companies.setStatus(company.id, "blocked");
  assert.equal(companies.canAcceptTraffic(company.id), false);
  assert.equal(withinDriverLimit("starter", PLAN_LIMITS.starter.drivers), true);

  const book = new OrderBook();
  const order = book.create({
    tenantId: "t1",
    passengerId: "p1",
    pickup: { lat: 53.9, lng: 27.56, address: "A" },
    dropoff: { lat: 53.91, lng: 27.57, address: "B" },
    tariff: "econom",
    estimatedPrice: 10
  });
  book.transition(order.id, "searching");
  book.assign(order.id, "d1");
  book.transition(order.id, "arrived");
  book.transition(order.id, "in_progress");
  book.transition(order.id, "completed", { finalPrice: 12 });
  const invoice = issueInvoice(order);
  assert.equal(tenantRevenue([invoice], "t1"), 12);
});

test("geo fences and map legs", () => {
  const minsk = { lat: 53.9, lng: 27.56 };
  const nearby = { lat: 53.91, lng: 27.57 };
  assert.ok(haversineKm(minsk, nearby) < 3);
  assert.equal(inCircle(nearby, minsk, 5), true);
  const box = boundingBox(minsk, 2);
  assert.ok(box.min.lat < minsk.lat && box.max.lat > minsk.lat);
  const poly = [
    { lat: 53.8, lng: 27.4 },
    { lat: 53.8, lng: 27.7 },
    { lat: 54.0, lng: 27.7 },
    { lat: 54.0, lng: 27.4 }
  ];
  assert.equal(inPolygon(minsk, poly), true);
  const leg = estimateLeg(minsk, nearby);
  assert.ok(leg.minutes > 0);
  const raw = decodeFakePolyline([minsk, nearby]);
  assert.equal(encodeFakePolyline(raw).length, 2);
});

test("tenant pool router hides inactive companies", () => {
  const router = new PoolRouter({ name: "platform", dsn: "postgres://platform" }, new Map([
    ["t1", { tenantId: "t1", name: "A", dsn: "postgres://a", active: true }]
  ]));
  assert.match(router.tenantDsn("t1"), /postgres:\/\/a/);
  router.deactivate("t1");
  assert.throws(() => router.tenantDsn("t1"));
});
