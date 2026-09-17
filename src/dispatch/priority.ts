export const PRIORITY_CONFIG = {
  ratingEffects: [
    { min: 4.95, delta: 8 },
    { min: 4.9, delta: 5 },
    { min: 4.85, delta: 3 },
    { min: 4.6, delta: 0 },
    { min: 4.5, delta: -6 },
    { min: 0, delta: -10 }
  ],
  levelBonus: { BRONZE: 0, SILVER: 3, GOLD: 8, PLATINUM: 15 } as Record<string, number>,
  brandingBonus: 18,
  childSeatBonus: 6,
  carYearRules: [
    { minYear: 2023, bonus: 12 },
    { minYear: 2020, bonus: 8 },
    { minYear: 2015, bonus: 4 },
    { minYear: 0, bonus: 0 }
  ],
  acceptedOrdersThresholds: [
    { count: 30, bonus: 30 },
    { count: 20, bonus: 20 },
    { count: 10, bonus: 10 },
    { count: 0, bonus: 0 }
  ],
  skipPenaltyPerOrder: 4,
  maxPriority: 93
};

export function ratingPriorityBonus(rating: number | null): number {
  const effects = PRIORITY_CONFIG.ratingEffects;
  if (rating == null) return effects[effects.length - 1].delta;
  for (const rule of effects) if (rating >= rule.min) return rule.delta;
  return 0;
}

export function carYearBonus(year?: number): number {
  if (!year) return 0;
  for (const rule of PRIORITY_CONFIG.carYearRules) if (year >= rule.minYear) return rule.bonus;
  return 0;
}

export function acceptedOrdersBonus(count: number): number {
  for (const rule of PRIORITY_CONFIG.acceptedOrdersThresholds) if (count >= rule.count) return rule.bonus;
  return 0;
}

export type PriorityInput = {
  rating: number | null;
  level?: string;
  hasBranding?: boolean;
  hasChildSeat?: boolean;
  carYear?: number;
  acceptedOrders: number;
  skippedOrders: number;
};

export type PriorityResult = {
  priority: number;
  breakdown: Record<string, number>;
};

export function recalculatePriority(input: PriorityInput): PriorityResult {
  const breakdown: Record<string, number> = {
    rating: ratingPriorityBonus(input.rating),
    level: PRIORITY_CONFIG.levelBonus[input.level ?? "BRONZE"] ?? 0,
    branding: input.hasBranding ? PRIORITY_CONFIG.brandingBonus : 0,
    childSeat: input.hasChildSeat ? PRIORITY_CONFIG.childSeatBonus : 0,
    carYear: carYearBonus(input.carYear),
    acceptedOrders: acceptedOrdersBonus(input.acceptedOrders),
    skippedOrders: -(input.skippedOrders * PRIORITY_CONFIG.skipPenaltyPerOrder)
  };
  let priority = Object.values(breakdown).reduce((sum, n) => sum + n, 0);
  if (priority < 0) priority = 0;
  if (priority > PRIORITY_CONFIG.maxPriority) priority = PRIORITY_CONFIG.maxPriority;
  return { priority, breakdown };
}
