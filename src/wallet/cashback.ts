import { cashbackDue, vipFromTurnover } from "./vip.js";
import type { WalletLedger } from "./ledger.js";

export type CashbackPeriod = {
  userId: string;
  turnover: number;
  paid: number;
};

export function settleCashback(ledger: WalletLedger, period: CashbackPeriod): number {
  const amount = cashbackDue(period.turnover, period.paid);
  if (amount <= 0) return 0;
  const user = ledger.upsertUser(period.userId);
  user.balance += amount;
  period.paid += amount;
  return amount;
}

export function vipLabel(turnover: number): string {
  return vipFromTurnover(turnover).level;
}
