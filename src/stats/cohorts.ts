export type Cohort = { started: Date; size: number; retained: number[] };

export function retain(cohort: Cohort, period: number): number {
  if (period < 0 || period >= cohort.retained.length) return 0;
  if (!cohort.size) return 0;
  return Number((cohort.retained[period] / cohort.size).toFixed(4));
}

export function averageRetention(cohorts: Cohort[], period: number): number {
  const live = cohorts.filter((row) => row.retained.length > period && row.size > 0);
  if (!live.length) return 0;
  return Number(
    (live.reduce((sum, row) => sum + row.retained[period] / row.size, 0) / live.length).toFixed(4)
  );
}
