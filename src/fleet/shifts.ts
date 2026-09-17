export type Shift = {
  id: string;
  courierId: string;
  startedAt: Date;
  endedAt?: Date;
  onlineSeconds: number;
};

let seq = 1;

export class ShiftBoard {
  readonly rows = new Map<string, Shift>();

  start(courierId: string, now = new Date()): Shift {
    const open = this.openFor(courierId);
    if (open) throw new Error("shift_open");
    const shift: Shift = { id: `sh_${seq++}`, courierId, startedAt: now, onlineSeconds: 0 };
    this.rows.set(shift.id, shift);
    return shift;
  }

  heartbeat(courierId: string, deltaSec: number, now = new Date()): Shift {
    const open = this.openFor(courierId);
    if (!open) return this.start(courierId, now);
    open.onlineSeconds += Math.max(0, deltaSec);
    return open;
  }

  end(courierId: string, now = new Date()): Shift {
    const open = this.openFor(courierId);
    if (!open) throw new Error("no_shift");
    open.endedAt = now;
    const spanned = Math.floor((now.getTime() - open.startedAt.getTime()) / 1000);
    open.onlineSeconds = Math.max(open.onlineSeconds, spanned);
    return open;
  }

  openFor(courierId: string): Shift | undefined {
    return [...this.rows.values()].find((row) => row.courierId === courierId && !row.endedAt);
  }

  hoursInRange(courierId: string, from: Date, to: Date): number {
    return (
      [...this.rows.values()]
        .filter((row) => row.courierId === courierId)
        .reduce((sum, row) => {
          const start = row.startedAt < from ? from : row.startedAt;
          const end = (row.endedAt ?? to) > to ? to : (row.endedAt ?? to);
          return sum + Math.max(0, end.getTime() - start.getTime());
        }, 0) / 3_600_000
    );
  }
}
