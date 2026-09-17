export type FunnelEvent = {
  id: number;
  source: "bot" | "web" | "miniapp";
  event: string;
  applicantKey?: string;
  sessionId?: string;
  path?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  durationMs?: number;
  at: Date;
};

export class Funnel {
  private nextId = 1;
  readonly events: FunnelEvent[] = [];

  track(event: Omit<FunnelEvent, "id" | "at"> & { at?: Date }): FunnelEvent {
    const row: FunnelEvent = {
      id: this.nextId++,
      at: event.at ?? new Date(),
      source: event.source,
      event: event.event,
      applicantKey: event.applicantKey,
      sessionId: event.sessionId,
      path: event.path,
      utmSource: event.utmSource,
      utmMedium: event.utmMedium,
      utmCampaign: event.utmCampaign,
      durationMs: event.durationMs
    };
    this.events.push(row);
    return row;
  }

  counts(from: Date, to: Date): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of this.events) {
      if (row.at < from || row.at > to) continue;
      out[row.event] = (out[row.event] ?? 0) + 1;
    }
    return out;
  }

  conversion(fromEvent: string, toEvent: string, from: Date, to: Date): number {
    const started = new Set(
      this.events.filter((row) => row.event === fromEvent && row.at >= from && row.at <= to).map((row) => row.sessionId)
    );
    if (!started.size) return 0;
    let converted = 0;
    for (const sessionId of started) {
      if (
        this.events.some(
          (row) => row.sessionId === sessionId && row.event === toEvent && row.at >= from && row.at <= to
        )
      ) {
        converted += 1;
      }
    }
    return converted / started.size;
  }
}
