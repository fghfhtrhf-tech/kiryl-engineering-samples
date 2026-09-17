export type DriverStatus = "offline" | "online" | "busy" | "blocked";

export type DriverProfile = {
  id: string;
  tenantId: string;
  fullName: string;
  status: DriverStatus;
  vehicleYear?: number;
  hasBranding: boolean;
  hasChildSeat: boolean;
  acceptedOrders: number;
  skippedOrders: number;
  rating: number | null;
  priority: number;
};

export class DriverRegistry {
  readonly rows = new Map<string, DriverProfile>();

  upsert(profile: DriverProfile): DriverProfile {
    this.rows.set(profile.id, profile);
    return profile;
  }

  setStatus(id: string, status: DriverStatus): DriverProfile {
    const row = this.must(id);
    if (row.status === "blocked" && status !== "blocked") throw new Error("blocked");
    row.status = status;
    return row;
  }

  recordAccept(id: string) {
    const row = this.must(id);
    row.acceptedOrders += 1;
    row.status = "busy";
  }

  recordSkip(id: string) {
    const row = this.must(id);
    row.skippedOrders += 1;
  }

  available(tenantId: string): DriverProfile[] {
    return [...this.rows.values()].filter((row) => row.tenantId === tenantId && row.status === "online");
  }

  private must(id: string): DriverProfile {
    const row = this.rows.get(id);
    if (!row) throw new Error("driver_not_found");
    return row;
  }
}
