import { parseJson } from './util.js';
import { PRICING } from './config.js';
import { soloFare } from './services/fare.js';

export function shapeUser(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export function shapeTrip(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    origin: { name: row.origin_name, lat: row.origin_lat, lng: row.origin_lng },
    destination: { name: row.dest_name, lat: row.dest_lat, lng: row.dest_lng },
    departAt: row.depart_at,
    partySize: row.party_size,
    notes: row.notes,
    status: row.status,
    distanceM: row.route_distance_m,
    durationS: row.route_duration_s,
    routeSource: row.route_source,
    route: parseJson(row.route_geojson, { type: 'LineString', coordinates: [] }),
    createdAt: row.created_at,
  };
}

/** The compact shape the matching engine works with. */
export function matchShape(trip) {
  return {
    id: trip.id,
    userId: trip.userId,
    origin: trip.origin,
    destination: trip.destination,
    coords: trip.route?.coordinates ?? [],
    distanceM: trip.distanceM,
    departAt: trip.departAt,
    partySize: trip.partySize,
  };
}

export function shapePool(pool, tripA, tripB, userA, userB) {
  const shapeA = shapeTrip(tripA);
  const shapeB = shapeTrip(tripB);
  return {
    id: pool.id,
    status: pool.status,
    createdAt: pool.created_at,
    sharedDistanceM: pool.shared_distance_m,
    combinedDistanceM: pool.combined_distance_m,
    sharedGeo: parseJson(pool.shared_geojson),
    totalFare: pool.fare_a + pool.fare_b,
    riders: [
      {
        trip: shapeA,
        user: shapeUser(userA),
        fare: pool.fare_a,
        soloFare: Math.round(soloFare(shapeA.distanceM, PRICING)),
      },
      {
        trip: shapeB,
        user: shapeUser(userB),
        fare: pool.fare_b,
        soloFare: Math.round(soloFare(shapeB.distanceM, PRICING)),
      },
    ],
  };
}
