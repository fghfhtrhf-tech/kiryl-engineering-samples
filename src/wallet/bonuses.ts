export const DEPOSIT_BONUSES = [
  { depositNum: 1, percent: 100, maxBonus: 700 },
  { depositNum: 2, percent: 120, maxBonus: 840 },
  { depositNum: 3, percent: 130, maxBonus: 910 },
  { depositNum: 4, percent: 150, maxBonus: 1050 }
];

export const MIN_DEPOSIT_FOR_BONUS = 10;
export const BONUS_WAGER_MULTIPLIER = 40;

export type ActiveBonus = {
  amount: number;
  wagerRemaining: number;
  maxWithdraw: number;
};

export function isBonusEffective(bonus: ActiveBonus | null): boolean {
  return Boolean(bonus && bonus.wagerRemaining > 0);
}

export function computeDepositBonus(
  amountUsd: number,
  bonusDepositsUsed: number,
  existing: ActiveBonus | null
): { applied: boolean; amount: number; percent: number; depositNum: number } {
  if (isBonusEffective(existing)) return { applied: false, amount: 0, percent: 0, depositNum: 0 };
  if (bonusDepositsUsed >= 4) return { applied: false, amount: 0, percent: 0, depositNum: 0 };
  const depositNum = bonusDepositsUsed + 1;
  const cfg = DEPOSIT_BONUSES.find((row) => row.depositNum === depositNum);
  if (!cfg || amountUsd < MIN_DEPOSIT_FOR_BONUS) {
    return { applied: false, amount: 0, percent: 0, depositNum };
  }
  const amount = Math.min(amountUsd * (cfg.percent / 100), cfg.maxBonus);
  return { applied: true, amount, percent: cfg.percent, depositNum };
}

export function stablecoinToUsd(amount: number, currency: string): number {
  const stables = new Set(["usdt", "usdc", "usdttrc20", "usdterc20", "usdtbsc"]);
  if (stables.has(currency.toLowerCase())) return amount;
  return amount;
}

export function applyWager(bonus: ActiveBonus, betAmount: number): ActiveBonus {
  return { ...bonus, wagerRemaining: Math.max(0, bonus.wagerRemaining - betAmount) };
}
