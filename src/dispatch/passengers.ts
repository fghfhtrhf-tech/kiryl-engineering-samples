export type Passenger = {
  id: string;
  tenantId: string;
  phone: string;
  blocked: boolean;
  trips: number;
};

export class PassengerBook {
  readonly rows = new Map<string, Passenger>();

  upsert(row: Passenger): Passenger {
    this.rows.set(row.id, row);
    return row;
  }

  canOrder(id: string): { ok: true } | { ok: false; reason: string } {
    const row = this.rows.get(id);
    if (!row) return { ok: false, reason: "unknown_passenger" };
    if (row.blocked) return { ok: false, reason: "blocked" };
    return { ok: true };
  }

  completeTrip(id: string) {
    const row = this.rows.get(id);
    if (row) row.trips += 1;
  }
}
