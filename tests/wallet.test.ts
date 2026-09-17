import assert from "node:assert/strict";
import { test } from "node:test";
import { signSortedHmac } from "../src/webhooks/hmac.js";
import { computeDepositBonus, isBonusEffective } from "../src/wallet/bonuses.js";
import { WalletLedger } from "../src/wallet/ledger.js";
import { applyBet } from "../src/wallet/wager.js";
import { WithdrawalQueue } from "../src/wallet/withdrawals.js";
import { cashbackDue, vipFromTurnover } from "../src/wallet/vip.js";
import { settleCashback } from "../src/wallet/cashback.js";
import { WalletSessionStore } from "../src/wallet/sessions.js";
import { WalletReferralBook } from "../src/wallet/referrals.js";
import { flagRoundTrip, flagVelocity, flagWithdrawGtDeposit } from "../src/wallet/aml.js";
import { issueProviderToken, verifyProviderToken } from "../src/wallet/provider.js";
import { pickLocale } from "../src/wallet/i18n.js";
import { cashierRoom, userRoom } from "../src/wallet/rooms.js";

const secret = "ipn-secret-ipn-secret";

function credit(ledger: WalletLedger, userId: string, paymentId: string, amount: number) {
  const body = {
    paymentId,
    status: "finished" as const,
    actuallyPaid: amount,
    currency: "usdt",
    userId
  };
  return ledger.handleSignedIpn(body, signSortedHmac(body, secret), secret);
}

test("deposit bonus ladder then blocks a second bonus until wagered", () => {
  assert.equal(computeDepositBonus(10, 0, null).percent, 100);
  assert.equal(computeDepositBonus(10, 3, null).percent, 150);
  const ledger = new WalletLedger();
  const first = credit(ledger, "u1", "p1", 20);
  assert.equal(first.bonusApplied, true);
  const second = credit(ledger, "u1", "p2", 20);
  assert.equal(second.bonusApplied, false);
  const user = ledger.users.get("u1")!;
  assert.equal(isBonusEffective(user.activeBonus), true);
  assert.equal(ledger.canWithdraw("u1", 1).ok, false);
});

test("duplicate finished IPN does not double credit", () => {
  const ledger = new WalletLedger();
  credit(ledger, "u1", "p1", 15);
  const again = credit(ledger, "u1", "p1", 15);
  assert.equal(again.credited, false);
  assert.equal(ledger.users.get("u1")!.balance, 15);
});

test("wager clears bonus then deposit wager then withdraw", () => {
  const ledger = new WalletLedger();
  credit(ledger, "u1", "p1", 10);
  const user = ledger.users.get("u1")!;
  assert.ok(user.activeBonus);
  applyBet(user, { userId: "u1", amount: user.activeBonus.amount, win: 0 });
  user.activeBonus = { amount: 10, wagerRemaining: 0, maxWithdraw: 10 };
  applyBet(user, { userId: "u1", amount: 1, win: 0 });
  user.activeBonus = null;
  user.depositWagerRemaining = 0;
  const queue = new WithdrawalQueue();
  const wd = queue.request(ledger, "u1", 5);
  queue.approve(wd.id);
  queue.pay(ledger, wd.id);
  assert.equal(ledger.users.get("u1")!.balance, 4);
});

test("vip cashback and referrals", () => {
  assert.equal(vipFromTurnover(20_000).level, "gold");
  assert.ok(cashbackDue(20_000, 0) > 0);
  const ledger = new WalletLedger();
  const paid = settleCashback(ledger, { userId: "u1", turnover: 1000, paid: 0 });
  assert.ok(paid > 0);
  const refs = new WalletReferralBook();
  refs.issue("owner", "JOIN");
  assert.equal(refs.redeem("join", "new"), "owner");
  assert.equal(refs.reward("owner", 50), 5);
});

test("volume flags and provider tokens", () => {
  assert.equal(flagVelocity("u1", 4000), null);
  assert.ok(flagVelocity("u1", 6000));
  assert.ok(flagWithdrawGtDeposit("u1", 10, 50));
  assert.ok(
    flagRoundTrip("u1", new Date("2026-09-01T00:00:00Z"), new Date("2026-09-01T00:10:00Z"), 300)
  );
  const session = issueProviderToken("u1", "game-1", "USD", "prov-secret-prov");
  assert.equal(verifyProviderToken(session.token, "prov-secret-prov").gameId, "game-1");
});

test("wallet sessions locales and rooms", () => {
  const sessions = new WalletSessionStore();
  const row = sessions.create("u1", "ru", 10);
  assert.equal(sessions.resolve(row.id, new Date(Date.now() + 20)), null);
  assert.equal(pickLocale("ru-RU,ru;q=0.9"), "ru");
  assert.equal(pickLocale("xx"), "en");
  assert.equal(userRoom("7"), "user:7");
  assert.equal(cashierRoom(), "cashier");
});
