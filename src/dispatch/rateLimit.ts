export class RateLimitExceeded extends Error {
  constructor(
    readonly retryAfterSec: number,
    readonly limit: number
  ) {
    super("rate_limited");
  }
}

type Bucket = { remaining: number; resetAt: number };

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    readonly points: number,
    readonly durationSec: number,
    readonly blockSec: number
  ) {}

  consume(key: string, now = Date.now()): { remaining: number; resetAt: number } {
    const bucket = this.buckets.get(key);
    if (bucket && now < bucket.resetAt && bucket.remaining <= 0) {
      throw new RateLimitExceeded(Math.ceil((bucket.resetAt - now) / 1000), this.points);
    }
    if (!bucket || now >= bucket.resetAt) {
      const fresh = { remaining: this.points - 1, resetAt: now + this.durationSec * 1000 };
      this.buckets.set(key, fresh);
      return fresh;
    }
    bucket.remaining -= 1;
    if (bucket.remaining < 0) {
      bucket.resetAt = now + this.blockSec * 1000;
      throw new RateLimitExceeded(this.blockSec, this.points);
    }
    return bucket;
  }
}

export const limiters = {
  general: new MemoryRateLimiter(100, 900, 900),
  auth: new MemoryRateLimiter(5, 900, 1800),
  register: new MemoryRateLimiter(3, 3600, 3600),
  search: new MemoryRateLimiter(60, 300, 300)
};
