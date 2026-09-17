import { BONUS_WAGER_MULTIPLIER, applyWager, isBonusEffective, type ActiveBonus } from "./bonuses.js";
import type { WalletUser } from "./ledger.js";

export type Bet = { userId: string; amount: number; win: number };

export function applyBet(user: WalletUser, bet: Bet): WalletUser {
  if (bet.amount <= 0) throw new Error("invalid_bet");
  const spendBonus = Math.min(user.bonusBalance, bet.amount);
  const spendReal = bet.amount - spendBonus;
  if (user.balance < spendReal) throw new Error("insufficient_funds");

  user.bonusBalance -= spendBonus;
  user.balance -= spendReal;

  if (user.activeBonus && spendBonus > 0) {
    user.activeBonus = applyWager(user.activeBonus, spendBonus);
    if (!isBonusEffective(user.activeBonus)) user.activeBonus = null;
  }

  if (spendReal > 0) {
    user.depositWagerRemaining = Math.max(0, user.depositWagerRemaining - spendReal);
  }

  if (bet.win > 0) {
    if (spendBonus > 0 && spendReal === 0) user.bonusBalance += bet.win;
    else user.balance += bet.win;
  }
  return user;
}

export function requiredWager(bonusAmount: number): number {
  return bonusAmount * BONUS_WAGER_MULTIPLIER;
}

export function bonusClearable(bonus: ActiveBonus | null): boolean {
  return !isBonusEffective(bonus);
}
