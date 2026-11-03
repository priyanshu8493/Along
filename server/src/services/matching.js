import {
  cumulativeDistances,
  projectPoint,
  sampleCoords,
  slicePolyline,
} from './geo.js';
import { splitFare } from './fare.js';

// A trip is only considered a match if it hugs the other trip's corridor.
const MAX_ENDPOINT_OFFSET_M = 2500;
const MAX_MEDIAN_OFFSET_M = 2200;
const MIN_SHARED_M = 800;
const MIN_COVERAGE = 0.25;
const MAX_TIME_GAP_MIN = 90;

const isTrip = (t) =>
  t &&
  Array.isArray(t.coords) &&
  t.coords.length >= 2 &&
  t.origin &&
  t.destination &&
  typeof t.distanceM === 'number';

/**
 * Treats `corridor` as the long route and checks how much of `feeder` runs
 * along it, in the same direction.
 */
function evaluateCorridor(corridor, feeder) {
  if (!isTrip(corridor) || !isTrip(feeder)) return null;

  const cum = cumulativeDistances(corridor.coords);
  const corridorLength = cum[cum.length - 1];
  if (corridorLength < 500) return null;

  const originProj = projectPoint(feeder.origin, corridor.coords, cum);
  const destProj = projectPoint(feeder.destination, corridor.coords, cum);

  // Same direction of travel only. Opposite-direction trips would need a
  // different product (and a legal U-turn), so they are out of scope for the MVP.
  if (originProj.along >= destProj.along) return null;

  const shared = destProj.along - originProj.along;
  const shorterLength = Math.min(corridorLength, feeder.distanceM);
  const coverage = shorterLength > 0 ? Math.min(1, shared / shorterLength) : 0;

  // A couple of endpoints can coincidentally sit on the corridor while the
  // middle of the route wanders off. Sample the feeder to catch that.
  const samples = sampleCoords(feeder.coords, 8);
  const offsets = samples
    .map((p) => projectPoint(p, corridor.coords, cum).offset)
    .sort((a, b) => a - b);
  const medianOffset = offsets[Math.floor(offsets.length / 2)] ?? Infinity;

  const timeGapMin =
    Math.abs(new Date(corridor.departAt) - new Date(feeder.departAt)) / 60000;

  if (shared < MIN_SHARED_M) return null;
  if (coverage < MIN_COVERAGE) return null;
  if (medianOffset > MAX_MEDIAN_OFFSET_M) return null;
  if (originProj.offset > MAX_ENDPOINT_OFFSET_M || destProj.offset > MAX_ENDPOINT_OFFSET_M) {
    return null;
  }
  if (!Number.isFinite(timeGapMin) || timeGapMin > MAX_TIME_GAP_MIN) return null;

  const closeness = Math.max(0, 1 - medianOffset / MAX_MEDIAN_OFFSET_M);
  const timeScore = Math.max(0, 1 - timeGapMin / MAX_TIME_GAP_MIN);
  const score = 0.6 * coverage + 0.25 * closeness + 0.15 * timeScore;

  const sharedCoords = slicePolyline(corridor.coords, originProj.along, destProj.along);
  if (!sharedCoords || sharedCoords.length < 2) return null;

  const fares = splitFare({
    distanceA: corridor.distanceM,
    distanceB: feeder.distanceM,
    shared,
  });

  return {
    corridorTripId: corridor.id,
    feederTripId: feeder.id,
    sharedDistanceM: shared,
    medianOffsetM: medianOffset,
    coverage,
    timeGapMin,
    score,
    combinedDistanceM: fares.combinedDistance,
    sharedGeo: { type: 'LineString', coordinates: sharedCoords },
    fares,
  };
}

/**
 * Compares two shaped trips and returns the best overlap found in either
 * direction, or null if they do not share a usable corridor.
 *
 * Shape: { id, origin:{lat,lng}, destination:{lat,lng}, coords:[[lng,lat]],
 *          distanceM, departAt, partySize, userId }
 */
export function matchTrips(tripA, tripB) {
  const candidates = [
    evaluateCorridor(tripA, tripB),
    evaluateCorridor(tripB, tripA),
  ].filter(Boolean);

  if (!candidates.length) return null;
  const best = candidates.sort((a, b) => b.score - a.score)[0];

  // Remap the corridor/feeder fares back onto A and B.
  const aIsCorridor = best.corridorTripId === tripA.id;
  const fareA = aIsCorridor ? best.fares.fareA : best.fares.fareB;
  const fareB = aIsCorridor ? best.fares.fareB : best.fares.fareA;
  const soloA = aIsCorridor ? best.fares.soloA : best.fares.soloB;
  const soloB = aIsCorridor ? best.fares.soloB : best.fares.soloA;

  return {
    score: best.score,
    coverage: best.coverage,
    sharedDistanceM: best.sharedDistanceM,
    combinedDistanceM: best.combinedDistanceM,
    medianOffsetM: best.medianOffsetM,
    timeGapMin: best.timeGapMin,
    sharedGeo: best.sharedGeo,
    corridorTripId: best.corridorTripId,
    fare: {
      total: best.fares.total,
      a: { pooled: fareA, solo: soloA, savings: Math.max(0, soloA - fareA) },
      b: { pooled: fareB, solo: soloB, savings: Math.max(0, soloB - fareB) },
    },
  };
}

export const MATCH_LIMITS = {
  MAX_TIME_GAP_MIN,
  MIN_SHARED_M,
  MIN_COVERAGE,
};
