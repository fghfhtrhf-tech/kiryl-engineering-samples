import type { TripOrder } from "./orders.js";
import type { LiveNetwork } from "./live.js";

export type BoardRow = {
  orderId: string;
  status: TripOrder["status"];
  driverId?: string;
  passengerId: string;
  pickup: string;
  ageSec: number;
  liveDriver?: { lat: number; lng: number };
};

export function dispatcherBoard(orders: TripOrder[], live: LiveNetwork, now = Date.now()): BoardRow[] {
  return orders
    .filter((order) => !["completed", "cancelled"].includes(order.status))
    .map((order) => ({
      orderId: order.id,
      status: order.status,
      driverId: order.driverId,
      passengerId: order.passengerId,
      pickup: order.pickup.address,
      ageSec: Math.floor((now - order.createdAt.getTime()) / 1000),
      liveDriver: order.driverId ? live.locations.get(order.driverId) : undefined
    }))
    .sort((a, b) => a.ageSec - b.ageSec);
}

export function staleOrders(orders: TripOrder[], maxSearchSec: number, now = Date.now()): TripOrder[] {
  return orders.filter(
    (order) => order.status === "searching" && now - order.createdAt.getTime() > maxSearchSec * 1000
  );
}
