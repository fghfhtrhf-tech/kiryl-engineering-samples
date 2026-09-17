import { makeIdempotencyKey } from "../loyalty/ledger.js";

export type PayoutStatus = "queued" | "held" | "paid" | "rejected";

export type Payout = {
  id: string;
  courierId: string;
  amount: number;
  periodKey: string;
  status: PayoutStatus;
  reason?: string;
  idempotencyKey: string;
  createdAt: Date;
  paidAt?: Date;
};

export const MIN_PAYOUT = 20;
export const MAX_PAYOUT_BATCH = 200;

let seq = 1;

export class PayoutBook {
  readonly rows = new Map<string, Payout>();
  readonly frozen = new Set<string>();

  freeze(courierId: string) {
    this.frozen.add(courierId);
  }

  unfreeze(courierId: string) {
    this.frozen.delete(courierId);
  }

  enqueue(courierId: string, amount: number, periodKey: string): Payout {
    const idempotencyKey = makeIdempotencyKey(["payout", courierId, periodKey]);
    const existing = [...this.rows.values()].find((row) => row.idempotencyKey === idempotencyKey);
    if (existing) return existing;
    if (amount < MIN_PAYOUT) {
      throw new Error("below_minimum");
    }
    const payout: Payout = {
      id: `po_${seq++}`,
      courierId,
      amount: Number(amount.toFixed(2)),
      periodKey,
      status: this.frozen.has(courierId) ? "held" : "queued",
      reason: this.frozen.has(courierId) ? "account_frozen" : undefined,
      idempotencyKey,
      createdAt: new Date()
    };
    this.rows.set(payout.id, payout);
    return payout;
  }

  markPaid(id: string, now = new Date()): Payout {
    const row = this.must(id);
    if (row.status !== "queued") throw new Error(`illegal_payout:${row.status}`);
    row.status = "paid";
    row.paidAt = now;
    return row;
  }

  reject(id: string, reason: string): Payout {
    const row = this.must(id);
    if (row.status === "paid") throw new Error("already_paid");
    row.status = "rejected";
    row.reason = reason;
    return row;
  }

  releaseHeld(courierId: string): Payout[] {
    this.unfreeze(courierId);
    const released: Payout[] = [];
    for (const row of this.rows.values()) {
      if (row.courierId === courierId && row.status === "held") {
        row.status = "queued";
        row.reason = undefined;
        released.push(row);
      }
    }
    return released;
  }

  nextBatch(limit = 50): Payout[] {
    return [...this.rows.values()]
      .filter((row) => row.status === "queued")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, Math.min(limit, MAX_PAYOUT_BATCH));
  }

  outstanding(courierId: string): number {
    return [...this.rows.values()]
      .filter((row) => row.courierId === courierId && (row.status === "queued" || row.status === "held"))
      .reduce((sum, row) => sum + row.amount, 0);
  }

  private must(id: string): Payout {
    const row = this.rows.get(id);
    if (!row) throw new Error("payout_not_found");
    return row;
  }
}
