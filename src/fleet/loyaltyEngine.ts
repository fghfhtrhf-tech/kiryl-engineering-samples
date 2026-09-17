import { periodKeyMonth } from "./cashWindows.js";
import { Ledger } from "../loyalty/ledger.js";

export type LoyaltyLevel = "base" | "pro" | "top";

export type LoyaltyThresholds = {
  pro: number;
  top: number;
  referralFirst: number;
};

export const DEFAULT_THRESHOLDS: LoyaltyThresholds = {
  pro: 1500,
  top: 4000,
  referralFirst: 200
};

export function loyaltyLevelFromCash(cashMonth: number, thresholds = DEFAULT_THRESHOLDS): LoyaltyLevel {
  if (cashMonth >= thresholds.top) return "top";
  if (cashMonth >= thresholds.pro) return "pro";
  return "base";
}

export function workRuleForLevel(level: LoyaltyLevel): string {
  if (level === "top") return "rule.top";
  if (level === "pro") return "rule.pro";
  return "rule.base";
}

export type CourierAccount = {
  id: string;
  referredBy: string | null;
  cashMonth: number;
  loyaltyLevel: LoyaltyLevel;
  workRuleId: string;
};

export type LoyaltyApplyResult = {
  account: CourierAccount;
  levelChanged: boolean;
  referralEnqueued: boolean;
};

export function applyLoyaltyRules(
  account: CourierAccount,
  ledger: Ledger,
  now = new Date(),
  thresholds = DEFAULT_THRESHOLDS
): LoyaltyApplyResult {
  const nextLevel = loyaltyLevelFromCash(account.cashMonth, thresholds);
  const levelChanged = nextLevel !== account.loyaltyLevel;
  if (levelChanged) {
    account.loyaltyLevel = nextLevel;
    account.workRuleId = workRuleForLevel(nextLevel);
  }

  let referralEnqueued = false;
  if (account.referredBy && account.cashMonth >= thresholds.referralFirst) {
    referralEnqueued = ledger.enqueue(
      "referral_first",
      account.referredBy,
      `${account.id}:${periodKeyMonth(now)}`,
      30
    );
  }

  return { account, levelChanged, referralEnqueued };
}
