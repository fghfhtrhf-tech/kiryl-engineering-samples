import { recalculatePriority } from "./priority.js";
import type { DriverRegistry } from "./drivers.js";

export function onOrderAccepted(registry: DriverRegistry, driverId: string) {
  registry.recordAccept(driverId);
  const driver = registry.rows.get(driverId);
  if (!driver) return;
  driver.priority = recalculatePriority({
    rating: driver.rating,
    hasBranding: driver.hasBranding,
    hasChildSeat: driver.hasChildSeat,
    carYear: driver.vehicleYear,
    acceptedOrders: driver.acceptedOrders,
    skippedOrders: driver.skippedOrders
  }).priority;
}

export function onOrderSkipped(registry: DriverRegistry, driverId: string) {
  registry.recordSkip(driverId);
  const driver = registry.rows.get(driverId);
  if (!driver) return;
  driver.priority = recalculatePriority({
    rating: driver.rating,
    hasBranding: driver.hasBranding,
    hasChildSeat: driver.hasChildSeat,
    carYear: driver.vehicleYear,
    acceptedOrders: driver.acceptedOrders,
    skippedOrders: driver.skippedOrders
  }).priority;
}
