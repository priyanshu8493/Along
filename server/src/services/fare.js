import { PRICING } from '../config.js';

export function soloFare(distanceM, pricing = PRICING) {
  return pricing.baseFare + (pricing.perKm * distanceM) / 1000;
}

/**
 * Splits a pooled ride so both riders always pay less than going solo.
 *
 * Each rider pays for the part of the route only they travel, plus half of the
 * shared segment. The base fare is split evenly. Because the shared segment is
 * counted once (not twice) and the base fare is counted once, the two shares
 * always add up to the cost of the combined ride.
 */
export function splitFare({ distanceA, distanceB, shared, pricing = PRICING }) {
  const sharedSafe = Math.max(0, Math.min(shared, distanceA, distanceB));
  const combinedDistance = distanceA + distanceB - sharedSafe;

  const total = Math.round(soloFare(combinedDistance, pricing));

  const effectiveA = distanceA - sharedSafe / 2;
  const effectiveB = distanceB - sharedSafe / 2;

  const rawA = pricing.baseFare / 2 + (pricing.perKm * effectiveA) / 1000;
  let fareA = Math.round(rawA);
  fareA = Math.max(0, Math.min(total, fareA));
  const fareB = total - fareA;

  return {
    total,
    fareA,
    fareB,
    combinedDistance,
    effectiveA,
    effectiveB,
    soloA: Math.round(soloFare(distanceA, pricing)),
    soloB: Math.round(soloFare(distanceB, pricing)),
  };
}
