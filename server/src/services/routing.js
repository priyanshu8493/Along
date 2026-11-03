import { OSRM_URL, APP_UA } from '../config.js';
import { haversine, straightLine } from './geo.js';

const ROAD_FACTOR = 1.28; // rough straight-line -> road distance conversion

/**
 * Fetches a driving route. Falls back to a straight-line estimate when the
 * public routing service is unreachable, so the demo never hard-fails.
 */
export async function getRoute(origin, destination) {
  const url =
    `${OSRM_URL}/route/v1/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': APP_UA },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`OSRM responded ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
      throw new Error(data.message || 'No route returned');
    }
    return {
      coordinates: route.geometry.coordinates,
      distanceM: route.distance,
      durationS: route.duration,
      source: 'osrm',
      warning: null,
    };
  } catch (err) {
    const straight = haversine(origin, destination);
    return {
      coordinates: straightLine(origin, destination, 32),
      distanceM: straight * ROAD_FACTOR,
      durationS: (straight * ROAD_FACTOR) / 8.5,
      source: 'estimate',
      warning: `Live routing unavailable (${err.message}); using a straight-line estimate.`,
    };
  }
}
