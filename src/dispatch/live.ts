type Role = "driver" | "passenger" | "dispatcher";

export type LiveClient = {
  id: string;
  role: Role;
  tenantId: string;
  socketId: string;
};

export type LiveEvent = { to: string; event: string; payload: unknown };

export class LiveNetwork {
  readonly drivers = new Map<string, LiveClient>();
  readonly passengers = new Map<string, LiveClient>();
  readonly locations = new Map<string, { lat: number; lng: number; heading?: number; speed?: number }>();
  readonly log: LiveEvent[] = [];

  connect(client: LiveClient) {
    if (client.role === "driver") this.drivers.set(client.id, client);
    if (client.role === "passenger") this.passengers.set(client.id, client);
  }

  disconnect(id: string) {
    this.drivers.delete(id);
    this.passengers.delete(id);
  }

  private emit(to: string, event: string, payload: unknown) {
    this.log.push({ to, event, payload });
  }

  driverOnline(driverId: string, tenantId: string, socketId: string) {
    this.connect({ id: driverId, role: "driver", tenantId, socketId });
    this.emit(driverId, "driver-status-updated", { status: "online" });
  }

  updateLocation(
    driverId: string,
    coords: { lat: number; lng: number; heading?: number; speed?: number },
    passengerId?: string
  ) {
    this.locations.set(driverId, coords);
    if (passengerId && this.passengers.has(passengerId)) {
      this.emit(passengerId, "driver-location-update", { driverId, ...coords, timestamp: Date.now() });
    }
  }

  acceptOrder(orderId: string, driverId: string, passengerId: string) {
    this.emit(driverId, "order-accepted", { orderId });
    this.emit(passengerId, "driver-assigned", { orderId, driverId });
  }

  broadcastOffer(driverIds: string[], orderId: string) {
    for (const driverId of driverIds) this.emit(driverId, "incoming-order", { orderId });
  }
}
