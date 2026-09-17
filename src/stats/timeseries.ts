export type Point = { at: Date; value: number };

export function bucketHour(points: Point[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const point of points) {
    const key = point.at.toISOString().slice(0, 13);
    out.set(key, (out.get(key) ?? 0) + point.value);
  }
  return out;
}

export function movingAverage(values: number[], window: number): number[] {
  if (window <= 0) throw new Error("window");
  return values.map((_, index) => {
    const slice = values.slice(Math.max(0, index - window + 1), index + 1);
    return Number((slice.reduce((sum, n) => sum + n, 0) / slice.length).toFixed(4));
  });
}

export function fillGaps(hours: Map<string, number>, from: Date, to: Date): Point[] {
  const out: Point[] = [];
  for (let t = from.getTime(); t <= to.getTime(); t += 3_600_000) {
    const at = new Date(t);
    const key = at.toISOString().slice(0, 13);
    out.push({ at, value: hours.get(key) ?? 0 });
  }
  return out;
}
