export type Plan = "starter" | "growth" | "scale";

export const PLAN_LIMITS: Record<Plan, { drivers: number; ordersPerDay: number; monthly: number }> = {
  starter: { drivers: 20, ordersPerDay: 200, monthly: 49 },
  growth: { drivers: 80, ordersPerDay: 1200, monthly: 149 },
  scale: { drivers: 400, ordersPerDay: 8000, monthly: 399 }
};

export type Subscription = {
  companyId: string;
  plan: Plan;
  renewsAt: Date;
  pastDue: boolean;
};

export function withinDriverLimit(plan: Plan, driverCount: number): boolean {
  return driverCount <= PLAN_LIMITS[plan].drivers;
}

export function withinOrderLimit(plan: Plan, ordersToday: number): boolean {
  return ordersToday <= PLAN_LIMITS[plan].ordersPerDay;
}

export function renew(sub: Subscription, now = new Date()): Subscription {
  if (sub.pastDue) throw new Error("past_due");
  const renewsAt = new Date(now);
  renewsAt.setUTCMonth(renewsAt.getUTCMonth() + 1);
  return { ...sub, renewsAt, pastDue: false };
}
