import type { LoyaltyLevel } from "./loyaltyEngine.js";

export type WorkRule = {
  id: string;
  name: string;
  commissionPct: number;
  priorityBias: number;
  cashLimit: number | null;
};

export const WORK_RULES: Record<LoyaltyLevel, WorkRule> = {
  base: { id: "rule.base", name: "Base", commissionPct: 18, priorityBias: 0, cashLimit: 400 },
  pro: { id: "rule.pro", name: "Pro", commissionPct: 14, priorityBias: 8, cashLimit: 900 },
  top: { id: "rule.top", name: "Top", commissionPct: 10, priorityBias: 18, cashLimit: null }
};

export function ruleForLevel(level: LoyaltyLevel): WorkRule {
  return WORK_RULES[level];
}

export function canTakeCashOrder(level: LoyaltyLevel, cashToday: number, orderCash: number): boolean {
  const rule = WORK_RULES[level];
  if (rule.cashLimit == null) return true;
  return cashToday + orderCash <= rule.cashLimit;
}

export function netAfterCommission(gross: number, level: LoyaltyLevel): number {
  return Number((gross * (1 - WORK_RULES[level].commissionPct / 100)).toFixed(2));
}
