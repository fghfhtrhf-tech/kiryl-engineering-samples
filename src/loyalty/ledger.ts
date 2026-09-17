export function makeIdempotencyKey(parts: Array<string | number>): string {
  return parts.map(String).join(":");
}

export type LedgerEvent = {
  key: string;
  kind: string;
  amount: number;
  status: "pending" | "paid";
};

/** Loyalty / bonus ledger: insert-once by idempotency key. */
export class Ledger {
  private readonly events = new Map<string, LedgerEvent>();

  enqueue(kind: string, subjectId: string, periodKey: string, amount: number): boolean {
    const key = makeIdempotencyKey([kind, subjectId, periodKey]);
    if (this.events.has(key)) return false;
    this.events.set(key, { key, kind, amount, status: "pending" });
    return true;
  }

  markPaid(key: string): boolean {
    const event = this.events.get(key);
    if (!event || event.status === "paid") return false;
    event.status = "paid";
    return true;
  }

  pending(): LedgerEvent[] {
    return [...this.events.values()].filter((event) => event.status === "pending");
  }

  get(key: string): LedgerEvent | undefined {
    return this.events.get(key);
  }
}
