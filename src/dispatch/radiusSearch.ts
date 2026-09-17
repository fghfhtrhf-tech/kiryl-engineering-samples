export type Driver = {
  id: string;
  tenantId: string;
  lat: number;
  lng: number;
  available: boolean;
  priority: number;
  rating: number;
};

export type Order = {
  id: string;
  tenantId: string;
  pickupLat: number;
  pickupLng: number;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function rankDrivers(order: Order, drivers: Driver[]): Driver[] {
  return drivers
    .filter((driver) => driver.available && driver.tenantId === order.tenantId)
    .map((driver) => ({
      driver,
      distance: haversineKm(order.pickupLat, order.pickupLng, driver.lat, driver.lng)
    }))
    .sort((a, b) => {
      if (Math.abs(a.distance - b.distance) > 0.5) return a.distance - b.distance;
      if (a.driver.priority !== b.driver.priority) return b.driver.priority - a.driver.priority;
      return b.driver.rating - a.driver.rating;
    })
    .map((row) => row.driver);
}

export function assignOrder(
  order: Order,
  drivers: Driver[],
  options: { startKm?: number; maxKm?: number; stepKm?: number; notify?: number } = {}
): { driverIds: string[]; radiusKm: number } | null {
  const startKm = options.startKm ?? 2;
  const maxKm = options.maxKm ?? 20;
  const stepKm = options.stepKm ?? 3;
  const notify = options.notify ?? 3;

  for (let radius = startKm; radius <= maxKm; radius += stepKm) {
    const nearby = rankDrivers(order, drivers).filter((driver) => {
      const km = haversineKm(order.pickupLat, order.pickupLng, driver.lat, driver.lng);
      return km <= radius;
    });
    if (nearby.length) {
      return { driverIds: nearby.slice(0, notify).map((driver) => driver.id), radiusKm: radius };
    }
  }
  return null;
}
