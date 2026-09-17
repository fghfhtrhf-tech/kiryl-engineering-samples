import { verifySortedHmac } from "./hmac.js";

export type PaymentRecord = {
  id: string;
  status: "pending" | "confirmed" | "failed";
  amount: number;
};

export class PaymentStore {
  readonly rows = new Map<string, PaymentRecord>();

  get(id: string) {
    return this.rows.get(id);
  }

  put(record: PaymentRecord) {
    this.rows.set(record.id, record);
  }
}

/** Provider callbacks are the source of truth. Browser traffic never credits a balance. */
export function applySignedPayment(
  body: { paymentId: string; status: "confirmed" | "failed"; amount: number },
  signature: string,
  secret: string,
  store: PaymentStore
): { ok: true; duplicate: boolean } | { ok: false; reason: string } {
  if (!verifySortedHmac(body, signature, secret)) {
    return { ok: false, reason: "invalid_signature" };
  }

  const existing = store.get(body.paymentId);
  if (existing) return { ok: true, duplicate: true };

  store.put({
    id: body.paymentId,
    status: body.status,
    amount: body.amount
  });
  return { ok: true, duplicate: false };
}
