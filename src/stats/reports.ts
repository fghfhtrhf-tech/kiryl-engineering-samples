import { kpis } from "./kpis.js";
import { bucketHour, fillGaps, movingAverage } from "./timeseries.js";

export type DailyReport = {
  day: string;
  visits: number;
  starts: number;
  created: number;
  errors: number;
  payouts: number;
  visitToStart: number;
  startToCreated: number;
  errorRate: number;
  hourly: number[];
};

export function dailyReport(
  day: string,
  events: Array<{ at: Date; event: string; value?: number }>
): DailyReport {
  const visits = events.filter((row) => row.event === "visit").length;
  const starts = events.filter((row) => row.event === "start").length;
  const created = events.filter((row) => row.event === "created").length;
  const errors = events.filter((row) => row.event === "error").length;
  const payouts = events
    .filter((row) => row.event === "payout")
    .reduce((sum, row) => sum + (row.value ?? 0), 0);
  const metrics = kpis({ visits, starts, created, errors, payouts });
  const hours = bucketHour(events.filter((row) => row.event === "visit").map((row) => ({ at: row.at, value: 1 })));
  const from = new Date(`${day}T00:00:00.000Z`);
  const to = new Date(`${day}T23:00:00.000Z`);
  const filled = fillGaps(hours, from, to);
  return {
    day,
    visits,
    starts,
    created,
    errors,
    payouts,
    ...metrics,
    hourly: movingAverage(
      filled.map((row) => row.value),
      3
    )
  };
}
