import { exponentialBackoff } from "../jobs/queue.js";

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseMs = 25,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (attempt === attempts) break;
      await sleep(exponentialBackoff(attempt, baseMs));
    }
  }
  throw last;
}
