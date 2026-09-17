/** Europe/Minsk cash windows used when syncing courier earnings. */

const MINSK_OFFSET_MS = 3 * 60 * 60 * 1000;

export function toMinsk(date: Date): Date {
  return new Date(date.getTime() + MINSK_OFFSET_MS);
}

export function startOfDayMinsk(date: Date): Date {
  const local = toMinsk(date);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - MINSK_OFFSET_MS);
}

export function startOfMonthMinsk(date: Date): Date {
  const local = toMinsk(date);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - MINSK_OFFSET_MS);
}

export function daysAgoMinsk(date: Date, days: number): Date {
  return new Date(startOfDayMinsk(date).getTime() - days * 24 * 60 * 60 * 1000);
}

export function periodKeyMonth(date: Date): string {
  const local = toMinsk(date);
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${local.getUTCFullYear()}-${month}`;
}

export function periodKeyDay(date: Date): string {
  const local = toMinsk(date);
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return `${local.getUTCFullYear()}-${month}-${day}`;
}

export function netFromTransactions(
  txs: Array<{ amount: number; at: Date; kind: "earn" | "fee" | "bonus" }>,
  from: Date,
  to: Date
): number {
  return txs
    .filter((tx) => tx.at >= from && tx.at <= to)
    .reduce((sum, tx) => sum + (tx.kind === "fee" ? -tx.amount : tx.amount), 0);
}
