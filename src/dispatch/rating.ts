export const RATING_WINDOW = 150;
export const MIN_RATINGS_FOR_DISPLAY = 10;

export function ratingWeight(indexFromNewest: number): number {
  return RATING_WINDOW - indexFromNewest;
}

export type RatingEvent = {
  id: string;
  driverId: string;
  orderId: string;
  score: number;
  status: "PENDING" | "VALID" | "IGNORED";
};

export function recalculateRating(events: RatingEvent[]): number | null {
  const valid = events.filter((event) => event.status === "VALID").slice(0, RATING_WINDOW);
  if (valid.length < MIN_RATINGS_FOR_DISPLAY) return null;
  let weightedSum = 0;
  let totalWeight = 0;
  valid.forEach((event, indexFromNewest) => {
    const weight = ratingWeight(indexFromNewest);
    weightedSum += event.score * weight;
    totalWeight += weight;
  });
  return Number((weightedSum / totalWeight).toFixed(2));
}

export function ratingHistogram(events: RatingEvent[]): Record<number, number> {
  const out: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const event of events.filter((row) => row.status === "VALID")) {
    out[event.score] = (out[event.score] ?? 0) + 1;
  }
  return out;
}

export function maybeIgnoreLowball(score: number, currentRating: number | null): "VALID" | "PENDING" {
  if (currentRating && currentRating > 4.7 && score <= 3) return "PENDING";
  return "VALID";
}
