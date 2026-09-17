export type Tariff = "econom" | "comfort" | "business";

export type LatLng = { lat: number; lng: number };

const TARIFFS: Record<Tariff, { base: number; perKm: number; perMinWait: number; outOfCity: number }> = {
  econom: { base: 3.5, perKm: 0.55, perMinWait: 0.12, outOfCity: 1.15 },
  comfort: { base: 5, perKm: 0.8, perMinWait: 0.18, outOfCity: 1.2 },
  business: { base: 8, perKm: 1.2, perMinWait: 0.3, outOfCity: 1.25 }
};

function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export type PriceBreakdown = {
  estimatedPrice: number;
  distanceKm: number;
  durationMin: number;
  waitingCost: number;
  isOutOfCity: boolean;
  tariff: Tariff;
  parts: { base: number; distance: number; waiting: number };
};

export function estimatePrice(
  pickup: LatLng,
  dropoff: LatLng,
  tariff: Tariff = "econom",
  waitingMinutes = 0,
  cityRadiusKm = 18
): PriceBreakdown {
  const cfg = TARIFFS[tariff];
  const distanceKm = haversineKm(pickup, dropoff);
  const durationMin = Math.max(4, distanceKm * 2.4);
  const isOutOfCity = distanceKm > cityRadiusKm;
  const distanceCost = distanceKm * cfg.perKm * (isOutOfCity ? cfg.outOfCity : 1);
  const waitingCost = waitingMinutes * cfg.perMinWait;
  const estimatedPrice = Number((cfg.base + distanceCost + waitingCost).toFixed(2));
  return {
    estimatedPrice,
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMin: Number(durationMin.toFixed(1)),
    waitingCost: Number(waitingCost.toFixed(2)),
    isOutOfCity,
    tariff,
    parts: { base: cfg.base, distance: Number(distanceCost.toFixed(2)), waiting: Number(waitingCost.toFixed(2)) }
  };
}
