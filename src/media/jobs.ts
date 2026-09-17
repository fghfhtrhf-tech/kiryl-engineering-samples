import type { Probe } from "./probe.js";

export type TranscodeStatus = "queued" | "running" | "ready" | "failed";

export type TranscodeJob = {
  id: string;
  objectKey: string;
  status: TranscodeStatus;
  probe?: Probe;
  outputs: string[];
  error?: string;
};

let seq = 1;

export class TranscodeQueue {
  readonly rows = new Map<string, TranscodeJob>();

  enqueue(objectKey: string): TranscodeJob {
    const job: TranscodeJob = { id: `tx_${seq++}`, objectKey, status: "queued", outputs: [] };
    this.rows.set(job.id, job);
    return job;
  }

  start(id: string, probe: Probe): TranscodeJob {
    const job = this.must(id);
    job.status = "running";
    job.probe = probe;
    return job;
  }

  finish(id: string, outputs: string[]): TranscodeJob {
    const job = this.must(id);
    if (job.status !== "running") throw new Error("not_running");
    job.status = "ready";
    job.outputs = outputs;
    return job;
  }

  fail(id: string, error: string): TranscodeJob {
    const job = this.must(id);
    job.status = "failed";
    job.error = error;
    return job;
  }

  private must(id: string): TranscodeJob {
    const row = this.rows.get(id);
    if (!row) throw new Error("job_not_found");
    return row;
  }
}
