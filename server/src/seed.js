import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { getRoute } from './services/routing.js';
import { matchTrips } from './services/matching.js';
import { shapeTrip, matchShape } from './serializers.js';

const DEMO_PASSWORD = 'along123';

const USERS = [
  { name: 'Asha Rao', email: 'asha@along.app' },
  { name: 'Rahul Mehta', email: 'rahul@along.app' },
  { name: 'Meera Nair', email: 'meera@along.app' },
];

const TRIPS = [
  {
    email: 'asha@along.app',
    origin: {
      name: 'Kempegowda Bus Station (Majestic), Bengaluru',
      lat: 12.9775,
      lng: 77.5713,
    },
    destination: { name: 'Kempegowda Airport (BLR)', lat: 13.1979, lng: 77.7063 },
    inMinutes: 90,
    partySize: 1,
    notes: 'Early airport run from Majestic. One cabin bag, happy to share the ride.',
  },
  {
    email: 'rahul@along.app',
    origin: { name: 'Hebbal, Bengaluru', lat: 13.0358, lng: 77.597 },
    destination: { name: 'Kempegowda Airport (BLR)', lat: 13.1979, lng: 77.7063 },
    inMinutes: 105,
    partySize: 1,
    notes: 'Joining from Hebbal on the airport road. Flexible by ~10 minutes.',
  },
  {
    email: 'meera@along.app',
    origin: { name: 'Whitefield, Bengaluru', lat: 12.9698, lng: 77.75 },
    destination: { name: 'Electronic City, Bengaluru', lat: 12.8452, lng: 77.6602 },
    inMinutes: 360,
    partySize: 2,
    notes: 'Whitefield to Electronic City with one checked bag. Looking for a co-rider.',
  },
];

const minutesFromNow = (m) => new Date(Date.now() + m * 60 * 1000).toISOString();

async function seed() {
  console.log('\nSeeding Along demo data...');
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userIds = [];

  for (const user of USERS) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    if (existing) {
      db.prepare('UPDATE users SET name = ?, password_hash = ? WHERE id = ?').run(
        user.name,
        hash,
        existing.id,
      );
      userIds.push(existing.id);
      console.log(`  user  ${user.email} (existing)`);
    } else {
      const info = db
        .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
        .run(user.name, user.email, hash);
      userIds.push(Number(info.lastInsertRowid));
      console.log(`  user  ${user.email} (created)`);
    }
  }

  const placeholders = userIds.map(() => '?').join(', ');
  db.prepare(
    `DELETE FROM pools
      WHERE trip_a_id IN (SELECT id FROM trips WHERE user_id IN (${placeholders}))
         OR trip_b_id IN (SELECT id FROM trips WHERE user_id IN (${placeholders}))`,
  ).run(...userIds, ...userIds);
  db.prepare(`DELETE FROM trips WHERE user_id IN (${placeholders})`).run(...userIds);

  for (const trip of TRIPS) {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(trip.email);
    const route = await getRoute(trip.origin, trip.destination);
    const info = db
      .prepare(
        `INSERT INTO trips (
          user_id,
          origin_name, origin_lat, origin_lng,
          dest_name, dest_lat, dest_lng,
          depart_at, party_size, notes, status,
          route_geojson, route_distance_m, route_duration_s, route_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`,
      )
      .run(
        user.id,
        trip.origin.name, trip.origin.lat, trip.origin.lng,
        trip.destination.name, trip.destination.lat, trip.destination.lng,
        minutesFromNow(trip.inMinutes),
        trip.partySize,
        trip.notes,
        JSON.stringify({ type: 'LineString', coordinates: route.coordinates }),
        route.distanceM,
        route.durationS ?? null,
        route.source,
      );
    console.log(
      `  trip  ${trip.origin.name} -> ${trip.destination.name} (${(route.distanceM / 1000).toFixed(1)} km, ${route.source})`,
    );
    trip.id = Number(info.lastInsertRowid);
  }

  // Show what the engine will surface, so the demo is verifiable from the CLI.
  const rows = db
    .prepare(
      `SELECT t.* FROM trips t
        WHERE t.user_id IN (${placeholders})
        ORDER BY t.id`,
    )
    .all(...userIds)
    .map(shapeTrip);

  console.log('\n  Computed matches:');
  let count = 0;
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const match = matchTrips(matchShape(rows[i]), matchShape(rows[j]));
      if (!match) continue;
      count++;
      console.log(
        `    trip #${rows[i].id} <-> #${rows[j].id}: ` +
          `shared ${(match.sharedDistanceM / 1000).toFixed(1)} km, ` +
          `coverage ${(match.coverage * 100).toFixed(0)}%, ` +
          `fares Rs.${match.fare.a.pooled} + Rs.${match.fare.b.pooled} ` +
          `(solo Rs.${match.fare.a.solo} + Rs.${match.fare.b.solo})`,
      );
    }
  }
  if (!count) console.log('    none found');
  console.log(`\nDone. Sign in with asha@along.app / ${DEMO_PASSWORD}\n`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nSeed failed:', err);
    process.exit(1);
  });
