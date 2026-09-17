import type { TripOrder } from "./orders.js";

export type Invoice = {
  id: string;
  tenantId: string;
  orderId: string;
  amount: number;
  tax: number;
  total: number;
  issuedAt: Date;
};

const TAX_RATE = 0.2;
let seq = 1;

export function issueInvoice(order: TripOrder): Invoice {
  if (order.status !== "completed") throw new Error("order_not_completed");
  const amount = order.finalPrice ?? order.estimatedPrice;
  const tax = Number((amount * TAX_RATE).toFixed(2));
  return {
    id: `inv_${seq++}`,
    tenantId: order.tenantId,
    orderId: order.id,
    amount,
    tax,
    total: Number((amount + tax).toFixed(2)),
    issuedAt: new Date()
  };
}

export function tenantRevenue(invoices: Invoice[], tenantId: string): number {
  return invoices.filter((row) => row.tenantId === tenantId).reduce((sum, row) => sum + row.amount, 0);
}
