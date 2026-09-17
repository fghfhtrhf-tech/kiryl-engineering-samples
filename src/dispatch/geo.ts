export type LatLng = { lat: number; lng: number };

const EARTH_KM = 6371;

function toRad(n: number): number {
  return (n * Math.PI) / 180;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function destinationPoint(start: LatLng, bearingDeg: number, distanceKm: number): LatLng {
  const brng = toRad(bearingDeg);
  const lat1 = toRad(start.lat);
  const lng1 = toRad(start.lng);
  const ang = distanceKm / EARTH_KM;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(ang) + Math.cos(lat1) * Math.sin(ang) * Math.cos(brng));
  const lng2 =
    lng1 +
    Math.atan2(Math.sin(brng) * Math.sin(ang) * Math.cos(lat1), Math.cos(ang) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

export function boundingBox(center: LatLng, radiusKm: number): { min: LatLng; max: LatLng } {
  const north = destinationPoint(center, 0, radiusKm);
  const south = destinationPoint(center, 180, radiusKm);
  const east = destinationPoint(center, 90, radiusKm);
  const west = destinationPoint(center, 270, radiusKm);
  return {
    min: { lat: Math.min(south.lat, north.lat), lng: Math.min(west.lng, east.lng) },
    max: { lat: Math.max(south.lat, north.lat), lng: Math.max(west.lng, east.lng) }
  };
}

export function inCircle(point: LatLng, center: LatLng, radiusKm: number): boolean {
  return haversineKm(point, center) <= radiusKm;
}

export function inPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polylineLengthKm(points: LatLng[]): number {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += haversineKm(points[i - 1], points[i]);
  return Number(km.toFixed(3));
}
