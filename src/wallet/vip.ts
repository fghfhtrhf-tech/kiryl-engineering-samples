export type VipLevel = "none" | "bronze" | "silver" | "gold" | "platinum";

export const VIP_THRESHOLDS: Array<{ level: VipLevel; turnover: number; cashbackPct: number }> = [
  { level: "platinum", turnover: 50_000, cashbackPct: 8 },
  { level: "gold", turnover: 15_000, cashbackPct: 5 },
  { level: "silver", turnover: 5_000, cashbackPct: 3 },
  { level: "bronze", turnover: 1_000, cashbackPct: 1 },
  { level: "none", turnover: 0, cashbackPct: 0 }
];

export function vipFromTurnover(turnover: number): (typeof VIP_THRESHOLDS)[number] {
  return VIP_THRESHOLDS.find((row) => turnover >= row.turnover) ?? VIP_THRESHOLDS[VIP_THRESHOLDS.length - 1];
}

export function cashbackDue(turnover: number, alreadyPaid: number): number {
  const { cashbackPct } = vipFromTurnover(turnover);
  const due = Number(((turnover * cashbackPct) / 100).toFixed(2));
  return Math.max(0, Number((due - alreadyPaid).toFixed(2)));
}
