import type { GeoPoint } from './geocode';

// Free public OSRM demo server (no API key, no billing). It has no SLA or
// rate-limit guarantees, so callers should treat a failure as "no route
// available" and fall back to a straight line, not as a hard error.
export async function getDrivingRoute(origin: GeoPoint, destination: GeoPoint): Promise<GeoPoint[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    const coordinates = data?.routes?.[0]?.geometry?.coordinates;
    if (data?.code !== 'Ok' || !Array.isArray(coordinates)) {
      return null;
    }

    return coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
  } catch (error) {
    console.error('Routing error:', error);
    return null;
  }
}
