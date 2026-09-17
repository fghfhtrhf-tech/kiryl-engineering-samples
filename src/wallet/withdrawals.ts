import type { WalletLedger } from "./ledger.js";

export type WithdrawalStatus = "requested" | "approved" | "rejected" | "paid";

export type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  status: WithdrawalStatus;
  note?: string;
  createdAt: Date;
};

let seq = 1;

export class WithdrawalQueue {
  readonly rows = new Map<string, Withdrawal>();

  request(ledger: WalletLedger, userId: string, amount: number): Withdrawal {
    const gate = ledger.canWithdraw(userId, amount);
    if (!gate.ok) throw new Error(gate.reason);
    const row: Withdrawal = {
      id: `wd_${seq++}`,
      userId,
      amount,
      status: "requested",
      createdAt: new Date()
    };
    this.rows.set(row.id, row);
    return row;
  }

  approve(id: string): Withdrawal {
    const row = this.must(id);
    if (row.status !== "requested") throw new Error("illegal_status");
    row.status = "approved";
    return row;
  }

  reject(id: string, note: string): Withdrawal {
    const row = this.must(id);
    if (row.status === "paid") throw new Error("already_paid");
    row.status = "rejected";
    row.note = note;
    return row;
  }

  pay(ledger: WalletLedger, id: string): Withdrawal {
    const row = this.must(id);
    if (row.status !== "approved") throw new Error("not_approved");
    ledger.withdraw(row.userId, row.amount);
    row.status = "paid";
    return row;
  }

  pending(): Withdrawal[] {
    return [...this.rows.values()].filter((row) => row.status === "requested" || row.status === "approved");
  }

  private must(id: string): Withdrawal {
    const row = this.rows.get(id);
    if (!row) throw new Error("withdrawal_not_found");
    return row;
  }
}
