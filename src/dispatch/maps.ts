import { haversineKm, type LatLng } from "./geo.js";

export type RouteLeg = { from: LatLng; to: LatLng; km: number; minutes: number };

export function estimateLeg(from: LatLng, to: LatLng, kmh = 28): RouteLeg {
  const km = haversineKm(from, to);
  return { from, to, km: Number(km.toFixed(3)), minutes: Number(((km / kmh) * 60).toFixed(1)) };
}

export function decodeFakePolyline(points: LatLng[]): string {
  return points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
}

export function encodeFakePolyline(raw: string): LatLng[] {
  return raw.split("|").map((part) => {
    const [lat, lng] = part.split(",").map(Number);
    return { lat, lng };
  });
}
