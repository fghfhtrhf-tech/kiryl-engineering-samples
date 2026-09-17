export type OrderStatus =
  | "created"
  | "searching"
  | "assigned"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TripOrder = {
  id: string;
  tenantId: string;
  passengerId: string;
  driverId?: string;
  status: OrderStatus;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  tariff: string;
  estimatedPrice: number;
  finalPrice?: number;
  createdAt: Date;
  updatedAt: Date;
};

const FLOW: Record<OrderStatus, OrderStatus[]> = {
  created: ["searching", "cancelled"],
  searching: ["assigned", "cancelled"],
  assigned: ["arrived", "cancelled"],
  arrived: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

let seq = 1;

export class OrderBook {
  readonly rows = new Map<string, TripOrder>();

  create(input: Omit<TripOrder, "id" | "status" | "createdAt" | "updatedAt" | "driverId">): TripOrder {
    const now = new Date();
    const order: TripOrder = {
      ...input,
      id: `ord_${seq++}`,
      status: "created",
      createdAt: now,
      updatedAt: now
    };
    this.rows.set(order.id, order);
    return order;
  }

  get(id: string): TripOrder {
    const row = this.rows.get(id);
    if (!row) throw new Error("order_not_found");
    return row;
  }

  transition(id: string, status: OrderStatus, extra: Partial<TripOrder> = {}): TripOrder {
    const order = this.get(id);
    if (!FLOW[order.status].includes(status)) {
      throw new Error(`illegal_transition:${order.status}->${status}`);
    }
    Object.assign(order, extra, { status, updatedAt: new Date() });
    return order;
  }

  assign(id: string, driverId: string): TripOrder {
    return this.transition(id, "assigned", { driverId });
  }

  activeForDriver(driverId: string): TripOrder | undefined {
    return [...this.rows.values()].find(
      (row) => row.driverId === driverId && !["completed", "cancelled"].includes(row.status)
    );
  }

  forTenant(tenantId: string): TripOrder[] {
    return [...this.rows.values()].filter((row) => row.tenantId === tenantId);
  }
}
