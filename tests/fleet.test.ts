import assert from "node:assert/strict";
import { test } from "node:test";
import { Ledger } from "../src/loyalty/ledger.js";
import { ApplicationStore } from "../src/fleet/applications.js";
import { Funnel } from "../src/fleet/funnel.js";
import { SupportChat, isOperatorText } from "../src/fleet/supportChat.js";
import { SessionStore } from "../src/fleet/sessions.js";
import { catalogSize, resolveBrandModel } from "../src/fleet/vehicleCatalog.js";
import { bulkDropErrors, funnelFromApplications, listApplications } from "../src/fleet/crm.js";
import { PayoutBook } from "../src/fleet/payouts.js";
import { ReferralGraph } from "../src/fleet/referrals.js";
import { cashSyncQueue, syncCourierCash } from "../src/fleet/partnerSync.js";
import { docsReady, missingDocs, validateUpload } from "../src/fleet/documents.js";
import { NotificationOutbox } from "../src/fleet/notifications.js";
import { canTakeCashOrder, netAfterCommission } from "../src/fleet/workRules.js";
import { parseCommand, routeBotUpdate } from "../src/fleet/botRouter.js";
import { AuditLog } from "../src/fleet/audit.js";
import { ShiftBoard } from "../src/fleet/shifts.js";
import { LeadBoard } from "../src/fleet/leads.js";
import { Staff } from "../src/fleet/staff.js";
import { applyLoyaltyRules } from "../src/fleet/loyaltyEngine.js";
import { netFromTransactions, periodKeyMonth, startOfMonthMinsk } from "../src/fleet/cashWindows.js";

test("vehicle catalog resolves aliases and reports size", () => {
  assert.equal(resolveBrandModel("VW", "Polo").ok, true);
  assert.equal(resolveBrandModel("unknown", "x").ok, false);
  const size = catalogSize();
  assert.ok(size.brands >= 25);
  assert.ok(size.models >= 100);
});

test("applications CRM and bulk error drop", () => {
  const store = new ApplicationStore();
  store.create("a1", { firstName: "Alex" });
  const err = store.create("a2", { firstName: "Sam" });
  store.markError(err.id, "partner timeout");
  assert.equal(listApplications(store, { status: "error" }).length, 1);
  assert.equal(funnelFromApplications(store).error, 1);
  assert.equal(bulkDropErrors(store), 1);
  assert.equal(store.rows.size, 1);
});

test("funnel conversion is session scoped", () => {
  const funnel = new Funnel();
  const from = new Date("2026-01-01");
  const to = new Date("2026-12-31");
  funnel.track({ source: "web", event: "visit", sessionId: "s1", at: new Date("2026-02-01") });
  funnel.track({ source: "web", event: "start", sessionId: "s1", at: new Date("2026-02-01") });
  funnel.track({ source: "web", event: "visit", sessionId: "s2", at: new Date("2026-02-01") });
  assert.equal(funnel.conversion("visit", "start", from, to), 0.5);
  assert.equal(funnel.counts(from, to).visit, 2);
});

test("support chat hides menu buttons and fans out", () => {
  assert.equal(isOperatorText("info"), false);
  assert.equal(isOperatorText("Need help with photos"), true);
  const chat = new SupportChat();
  const seen: string[] = [];
  chat.subscribe((event) => seen.push(event.type));
  chat.post("c1", "in", "text", "Need help with photos");
  chat.markRead("c1");
  chat.remove("c1", chat.inbox()[0].last!.id);
  assert.deepEqual(seen, ["message", "read", "delete"]);
});

test("bot sessions expire", () => {
  const sessions = new SessionStore();
  const row = sessions.create("user-1", 10);
  assert.equal(sessions.resolve(row.token, new Date(Date.now() + 20)), null);
});

test("payouts are insert-once and freezeable", () => {
  const book = new PayoutBook();
  book.freeze("d1");
  const first = book.enqueue("d1", 40, "2026-09");
  assert.equal(first.status, "held");
  assert.equal(book.enqueue("d1", 40, "2026-09").id, first.id);
  assert.equal(book.releaseHeld("d1")[0].status, "queued");
  book.markPaid(first.id);
  assert.equal(book.outstanding("d1"), 0);
});

test("referrals unlock first and recurring bonuses", () => {
  const graph = new ReferralGraph();
  graph.link("r1", "n1");
  const ledger = new Ledger();
  const early = graph.applyCash(ledger, "n1", 50, new Date("2026-09-10"));
  assert.equal(early.first, false);
  const unlocked = graph.applyCash(ledger, "n1", 250, new Date("2026-09-10"));
  assert.equal(unlocked.first, true);
  assert.equal(unlocked.recurring, true);
  assert.equal(graph.applyCash(ledger, "n1", 250, new Date("2026-09-10")).first, false);
});

test("partner cash sync uses Minsk month window and loyalty", async () => {
  const now = new Date("2026-09-15T12:00:00Z");
  const account = {
    id: "d1",
    referredBy: "r1",
    cashMonth: 0,
    loyaltyLevel: "base" as const,
    workRuleId: "rule.base"
  };
  const client = {
    async listTransactions() {
      return [
        { amount: 1600, at: new Date("2026-09-02T00:00:00Z"), kind: "earn" as const },
        { amount: 40, at: new Date("2026-09-03T00:00:00Z"), kind: "fee" as const }
      ];
    }
  };
  const ledger = new Ledger();
  const synced = await syncCourierCash(account, client, ledger, now);
  assert.ok(synced.cashMonth > 1500);
  assert.equal(synced.loyalty.account.loyaltyLevel, "pro");
  assert.equal(periodKeyMonth(now), "2026-09");
  assert.ok(startOfMonthMinsk(now) < now);
  assert.equal(
    netFromTransactions(
      [{ amount: 10, at: now, kind: "fee" }],
      new Date("2026-01-01"),
      new Date("2026-12-31")
    ),
    -10
  );
});

test("cash sync queue dead-letters unknown drivers", async () => {
  const queue = cashSyncQueue(
    { async listTransactions() { return []; } },
    new Ledger(),
    new Map()
  );
  queue.enqueue("sync", { driverId: "missing" }, { attempts: 2, backoffMs: 1 });
  await queue.drain();
  assert.equal(queue.deadLetter.length, 1);
});

test("document packs differ for walking vs vehicle", () => {
  const selfie = { kind: "selfie" as const, path: "a.jpg", mime: "image/jpeg", bytes: 1200, width: 800, height: 800 };
  assert.equal(validateUpload({ ...selfie, mime: "application/pdf" }), "unsupported_type");
  assert.deepEqual(missingDocs("walking", [selfie]), ["passport"]);
  assert.equal(docsReady("walking", [selfie, { ...selfie, kind: "passport" }]), true);
  assert.ok(missingDocs("vehicle", [selfie]).includes("license_front"));
});

test("notification outbox retries failed sends", async () => {
  const box = new NotificationOutbox();
  box.enqueue("telegram", "1", "welcome", { name: "Alex" });
  let fail = true;
  const first = await box.flush(async () => {
    if (fail) throw new Error("down");
  });
  assert.equal(first.failed, 1);
  fail = false;
  const second = await box.flush(async () => undefined);
  assert.equal(second.sent, 1);
});

test("work rules gate cash and commission", () => {
  assert.equal(canTakeCashOrder("base", 390, 20), false);
  assert.equal(canTakeCashOrder("top", 9000, 20), true);
  assert.equal(netAfterCommission(100, "pro"), 86);
});

test("bot router parses commands and forwards support text", () => {
  assert.deepEqual(parseCommand("/start@bot hello"), { command: "start", args: "hello" });
  const start = routeBotUpdate({ kind: "command", chatId: "1", from: "u", command: "start", args: "" });
  assert.match(start.text, /Mini App/);
  const support = routeBotUpdate({ kind: "text", chatId: "1", from: "u", text: "photos failed" });
  assert.match(support.text, /support/i);
});

test("audit, shifts, leads, staff", () => {
  const audit = new AuditLog();
  audit.record({ id: "op1", role: "operator" }, "status", "application", "app_1", "pending", "created");
  assert.equal(audit.forEntity("application", "app_1").length, 1);

  const shifts = new ShiftBoard();
  const from = new Date("2026-09-01T00:00:00Z");
  shifts.start("d1", from);
  shifts.heartbeat("d1", 600, new Date("2026-09-01T00:10:00Z"));
  shifts.end("d1", new Date("2026-09-01T02:00:00Z"));
  assert.ok(shifts.hoursInRange("d1", from, new Date("2026-09-01T03:00:00Z")) >= 2);

  const leads = new LeadBoard();
  const lead = leads.capture("telegram", "+375290000000");
  leads.attachApplicant(lead.id, "a1");
  assert.equal(leads.bySource().telegram, 1);

  const staff = new Staff();
  staff.add({ id: "e1", name: "Ops", role: "support", active: true });
  assert.throws(() => staff.assert("e1", "payouts"));
  staff.assert("e1", "chat");
});

test("loyalty engine does not downgrade silently", () => {
  const ledger = new Ledger();
  const account = {
    id: "d1",
    referredBy: null,
    cashMonth: 4000,
    loyaltyLevel: "pro" as const,
    workRuleId: "rule.pro"
  };
  const result = applyLoyaltyRules(account, ledger, new Date("2026-09-10"));
  assert.equal(result.levelChanged, true);
  assert.equal(result.account.loyaltyLevel, "top");
});
