import { JobQueue } from "../jobs/queue.js";
import { daysAgoMinsk, netFromTransactions, startOfDayMinsk, startOfMonthMinsk } from "./cashWindows.js";
import { applyLoyaltyRules, type CourierAccount } from "./loyaltyEngine.js";
import { Ledger } from "../loyalty/ledger.js";

export type PartnerTx = { amount: number; at: Date; kind: "earn" | "fee" | "bonus" };

export type PartnerCashClient = {
  listTransactions(driverId: string, from: Date, to: Date): Promise<PartnerTx[]>;
};

export type SyncedCash = {
  driverId: string;
  cashToday: number;
  cash6d: number;
  cashMonth: number;
  loyalty: ReturnType<typeof applyLoyaltyRules>;
};

export async function syncCourierCash(
  account: CourierAccount,
  client: PartnerCashClient,
  ledger: Ledger,
  now = new Date()
): Promise<SyncedCash> {
  const from = startOfMonthMinsk(now);
  const txs = await client.listTransactions(account.id, from, now);
  const cashToday = netFromTransactions(txs, startOfDayMinsk(now), now);
  const cash6d = netFromTransactions(txs, daysAgoMinsk(now, 6), now);
  const cashMonth = netFromTransactions(txs, from, now);
  account.cashMonth = cashMonth;
  const loyalty = applyLoyaltyRules(account, ledger, now);
  return { driverId: account.id, cashToday, cash6d, cashMonth, loyalty };
}

export function cashSyncQueue(
  client: PartnerCashClient,
  ledger: Ledger,
  accounts: Map<string, CourierAccount>
): JobQueue<{ driverId: string }> {
  return new JobQueue(async (payload) => {
    const account = accounts.get(payload.driverId);
    if (!account) throw new Error("unknown_driver");
    await syncCourierCash(account, client, ledger);
  });
}
