const EARTH_RADIUS_M = 6371008.8;
const DEG_TO_RAD = Math.PI / 180;

export function haversine(a, b) {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** GeoJSON position [lng, lat] -> { lat, lng } */
export const toPoint = (coord) => ({ lat: coord[1], lng: coord[0] });

export function cumulativeDistances(coords) {
  const cum = new Array(coords.length);
  cum[0] = 0;
  for (let i = 1; i < coords.length; i++) {
    cum[i] = cum[i - 1] + haversine(toPoint(coords[i - 1]), toPoint(coords[i]));
  }
  return cum;
}

export function polylineLength(coords) {
  if (!coords || coords.length < 2) return 0;
  const cum = cumulativeDistances(coords);
  return cum[cum.length - 1];
}

/**
 * Projects a point onto a polyline using a local equirectangular approximation.
 * Returns the perpendicular offset (m), the distance along the line (m), and
 * which segment produced the closest hit.
 */
export function projectPoint(point, coords, cum = cumulativeDistances(coords)) {
  const mPerDegLat = 110574;
  const mPerDegLng = 111320 * Math.cos(point.lat * DEG_TO_RAD);
  let best = { offset: Infinity, along: 0, t: 0, index: 0 };

  for (let i = 0; i < coords.length - 1; i++) {
    const ax = (coords[i][0] - point.lng) * mPerDegLng;
    const ay = (coords[i][1] - point.lat) * mPerDegLat;
    const bx = (coords[i + 1][0] - point.lng) * mPerDegLng;
    const by = (coords[i + 1][1] - point.lat) * mPerDegLat;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = ax + t * dx;
    const py = ay + t * dy;
    const offset = Math.hypot(px, py);
    if (offset < best.offset) {
      best = {
        offset,
        along: cum[i] + t * (cum[i + 1] - cum[i]),
        t,
        index: i,
      };
    }
  }
  return best;
}

export function pointAtDistance(coords, cum, distance) {
  const total = cum[cum.length - 1] || 0;
  const d = Math.max(0, Math.min(total, distance));
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < d) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const segStart = cum[i - 1];
  const segEnd = cum[i];
  const t = segEnd === segStart ? 0 : (d - segStart) / (segEnd - segStart);
  const a = toPoint(coords[i - 1]);
  const b = toPoint(coords[i]);
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
    along: d,
  };
}

/** Evenly spaced points (by distance) along a polyline. */
export function sampleCoords(coords, parts = 8) {
  if (!coords || coords.length < 2) return [];
  const cum = cumulativeDistances(coords);
  const total = cum[cum.length - 1];
  const out = [];
  for (let k = 0; k <= parts; k++) {
    out.push(pointAtDistance(coords, cum, (total * k) / parts));
  }
  return out;
}

/** Returns the portion of a polyline between two along-distances as [lng, lat][] */
export function slicePolyline(coords, start, end) {
  const cum = cumulativeDistances(coords);
  const total = cum[cum.length - 1] || 0;
  const s = Math.max(0, Math.min(start, end));
  const e = Math.min(total, Math.max(start, end));
  if (e - s < 1) return null;

  const out = [pointAtDistance(coords, cum, s)];
  for (let i = 0; i < coords.length; i++) {
    if (cum[i] > s && cum[i] < e) out.push(toPoint(coords[i]));
  }
  out.push(pointAtDistance(coords, cum, e));
  return out.map((p) => [p.lng, p.lat]);
}

/** A straight-line fallback route if the routing service is unavailable. */
export function straightLine(origin, destination, parts = 32) {
  const out = [];
  for (let i = 0; i <= parts; i++) {
    const t = i / parts;
    out.push([
      origin.lng + (destination.lng - origin.lng) * t,
      origin.lat + (destination.lat - origin.lat) * t,
    ]);
  }
  return out;
}
