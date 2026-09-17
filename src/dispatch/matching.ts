import { assignOrder, type Driver, type Order } from "./radiusSearch.js";
import { LiveNetwork } from "./live.js";
import { OrderBook } from "./orders.js";
import { estimatePrice, type Tariff } from "./pricing.js";

export type MatchRequest = {
  tenantId: string;
  passengerId: string;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  tariff: Tariff;
};

export type MatchResult = {
  orderId: string;
  radiusKm: number;
  driverIds: string[];
  estimatedPrice: number;
};

export class MatchingService {
  constructor(
    readonly book: OrderBook,
    readonly live: LiveNetwork
  ) {}

  search(req: MatchRequest, drivers: Driver[]): MatchResult | null {
    const price = estimatePrice(req.pickup, req.dropoff, req.tariff);
    const order = this.book.create({
      tenantId: req.tenantId,
      passengerId: req.passengerId,
      pickup: req.pickup,
      dropoff: req.dropoff,
      tariff: req.tariff,
      estimatedPrice: price.estimatedPrice
    });
    this.book.transition(order.id, "searching");

    const searchOrder: Order = {
      id: order.id,
      tenantId: req.tenantId,
      pickupLat: req.pickup.lat,
      pickupLng: req.pickup.lng
    };
    const hit = assignOrder(searchOrder, drivers, { startKm: 2, maxKm: 12, stepKm: 2, notify: 3 });
    if (!hit) {
      this.book.transition(order.id, "cancelled");
      return null;
    }
    this.live.broadcastOffer(hit.driverIds, order.id);
    return { orderId: order.id, radiusKm: hit.radiusKm, driverIds: hit.driverIds, estimatedPrice: price.estimatedPrice };
  }

  accept(orderId: string, driverId: string, passengerId: string) {
    const active = this.book.activeForDriver(driverId);
    if (active) throw new Error("driver_busy");
    this.book.assign(orderId, driverId);
    this.live.acceptOrder(orderId, driverId, passengerId);
  }
}
