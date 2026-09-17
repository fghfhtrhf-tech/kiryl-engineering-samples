export type JobHandler<T> = (payload: T, attempt: number) => Promise<void>;

export type JobOptions = {
  attempts: number;
  backoffMs: number;
};

export function exponentialBackoff(attempt: number, baseMs: number): number {
  return baseMs * 2 ** Math.max(0, attempt - 1);
}

type StoredJob<T> = {
  name: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  backoffMs: number;
};

/** In-memory stand-in for a BullMQ worker: bounded retries, exponential backoff, fail after N. */
export class JobQueue<T> {
  private readonly jobs: StoredJob<T>[] = [];
  private readonly dead: StoredJob<T>[] = [];

  constructor(
    private readonly handler: JobHandler<T>,
    private readonly sleeper: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
  ) {}

  enqueue(name: string, payload: T, options: JobOptions = { attempts: 3, backoffMs: 25 }): void {
    this.jobs.push({
      name,
      payload,
      attempts: 0,
      maxAttempts: options.attempts,
      backoffMs: options.backoffMs
    });
  }

  get deadLetter() {
    return this.dead.slice();
  }

  async drain(): Promise<void> {
    while (this.jobs.length) {
      const job = this.jobs.shift()!;
      job.attempts += 1;
      try {
        await this.handler(job.payload, job.attempts);
      } catch {
        if (job.attempts < job.maxAttempts) {
          await this.sleeper(exponentialBackoff(job.attempts, job.backoffMs));
          this.jobs.push(job);
        } else {
          this.dead.push(job);
        }
      }
    }
  }
}
