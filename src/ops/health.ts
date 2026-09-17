export type HealthCheck = { name: string; ok: boolean; detail?: string; ms: number };

export async function ping(
  name: string,
  fn: () => Promise<void>,
  timeoutMs = 800
): Promise<HealthCheck> {
  const started = Date.now();
  try {
    await Promise.race([
      fn(),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs))
    ]);
    return { name, ok: true, ms: Date.now() - started };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : "failed",
      ms: Date.now() - started
    };
  }
}

export function overall(checks: HealthCheck[]): { ok: boolean; checks: HealthCheck[] } {
  return { ok: checks.every((row) => row.ok), checks };
}
