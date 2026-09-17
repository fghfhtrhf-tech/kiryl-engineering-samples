import { verifySortedHmac } from "../webhooks/hmac.js";
import { computeDepositBonus, isBonusEffective, stablecoinToUsd, type ActiveBonus } from "./bonuses.js";

export type DepositStatus = "waiting" | "confirming" | "finished" | "failed" | "expired";

export type Deposit = {
  paymentId: string;
  userId: string;
  status: DepositStatus;
  amountUsd: number;
  credited: boolean;
};

export type WalletUser = {
  id: string;
  balance: number;
  bonusBalance: number;
  bonusDepositsUsed: number;
  activeBonus: ActiveBonus | null;
  depositWagerRemaining: number;
};

export type CreditResult = {
  deposit: Deposit;
  credited: boolean;
  bonusApplied: boolean;
  bonusAmount: number;
};

export class WalletLedger {
  readonly users = new Map<string, WalletUser>();
  readonly deposits = new Map<string, Deposit>();

  upsertUser(id: string): WalletUser {
    const existing = this.users.get(id);
    if (existing) return existing;
    const user: WalletUser = {
      id,
      balance: 0,
      bonusBalance: 0,
      bonusDepositsUsed: 0,
      activeBonus: null,
      depositWagerRemaining: 0
    };
    this.users.set(id, user);
    return user;
  }

  openDeposit(userId: string, paymentId: string, amountUsd: number): Deposit {
    const deposit: Deposit = { paymentId, userId, status: "waiting", amountUsd, credited: false };
    this.deposits.set(paymentId, deposit);
    return deposit;
  }

  handleSignedIpn(
    body: {
      paymentId: string;
      status: DepositStatus;
      actuallyPaid?: number;
      currency?: string;
      userId?: string;
    },
    signature: string,
    secret: string
  ): CreditResult {
    if (!verifySortedHmac(body, signature, secret)) throw new Error("invalid_signature");

    let deposit = this.deposits.get(body.paymentId);
    if (!deposit) {
      if (!body.userId) throw new Error("deposit_not_found");
      deposit = this.openDeposit(body.userId, body.paymentId, body.actuallyPaid ?? 0);
    }

    const previous = deposit.status;
    deposit.status = body.status;

    if (body.status !== "finished" || previous === "finished" || deposit.credited) {
      return { deposit, credited: false, bonusApplied: false, bonusAmount: 0 };
    }

    const amountUsd = stablecoinToUsd(body.actuallyPaid ?? deposit.amountUsd, body.currency ?? "usdt");
    if (amountUsd <= 0) throw new Error("invalid_amount");

    const user = this.upsertUser(deposit.userId);
    const bonus = computeDepositBonus(amountUsd, user.bonusDepositsUsed, user.activeBonus);

    user.balance += amountUsd;
    user.depositWagerRemaining += amountUsd;

    if (bonus.applied) {
      user.bonusBalance += bonus.amount;
      user.bonusDepositsUsed += 1;
      user.activeBonus = {
        amount: bonus.amount,
        wagerRemaining: bonus.amount * 40,
        maxWithdraw: bonus.amount
      };
    }

    deposit.credited = true;
    deposit.amountUsd = amountUsd;
    return { deposit, credited: true, bonusApplied: bonus.applied, bonusAmount: bonus.amount };
  }

  canWithdraw(userId: string, amount: number): { ok: true } | { ok: false; reason: string } {
    const user = this.users.get(userId);
    if (!user) return { ok: false, reason: "user_not_found" };
    if (isBonusEffective(user.activeBonus)) return { ok: false, reason: "active_bonus" };
    if (user.depositWagerRemaining > 0) return { ok: false, reason: "deposit_wager" };
    if (user.balance < amount) return { ok: false, reason: "insufficient_funds" };
    return { ok: true };
  }

  withdraw(userId: string, amount: number): WalletUser {
    const gate = this.canWithdraw(userId, amount);
    if (!gate.ok) throw new Error(gate.reason);
    const user = this.users.get(userId)!;
    user.balance -= amount;
    return user;
  }
}
