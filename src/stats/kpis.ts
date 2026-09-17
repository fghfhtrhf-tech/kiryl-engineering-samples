export type FunnelCounts = Record<string, number>;

export function conversionRate(counts: FunnelCounts, from: string, to: string): number {
  const start = counts[from] ?? 0;
  if (!start) return 0;
  return Number(((counts[to] ?? 0) / start).toFixed(4));
}

export function dropOff(counts: FunnelCounts, steps: string[]): Array<{ from: string; to: string; lost: number }> {
  const out: Array<{ from: string; to: string; lost: number }> = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i];
    const to = steps[i + 1];
    out.push({ from, to, lost: Math.max(0, (counts[from] ?? 0) - (counts[to] ?? 0)) });
  }
  return out;
}

export function kpis(input: {
  visits: number;
  starts: number;
  created: number;
  errors: number;
  payouts: number;
}): {
  visitToStart: number;
  startToCreated: number;
  errorRate: number;
  payoutPerCreated: number;
} {
  return {
    visitToStart: conversionRate({ visit: input.visits, start: input.starts }, "visit", "start"),
    startToCreated: conversionRate({ start: input.starts, created: input.created }, "start", "created"),
    errorRate: input.starts ? Number((input.errors / input.starts).toFixed(4)) : 0,
    payoutPerCreated: input.created ? Number((input.payouts / input.created).toFixed(2)) : 0
  };
}
