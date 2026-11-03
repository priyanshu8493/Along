import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { matchTrips } from '../services/matching.js';
import { matchShape, shapePool, shapeTrip, shapeUser } from '../serializers.js';
import { wrap, httpError } from '../util.js';
import { PRICING } from '../config.js';

const router = Router();

const getRawTrip = (id) => db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
const getUser = (id) =>
  db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id);

function hydrate(pool) {
  if (!pool) return null;
  return shapePool(
    pool,
    getRawTrip(pool.trip_a_id),
    getRawTrip(pool.trip_b_id),
    getUser(getRawTrip(pool.trip_a_id)?.user_id),
    getUser(getRawTrip(pool.trip_b_id)?.user_id),
  );
}

function assertParticipant(pool, userId) {
  const a = getRawTrip(pool.trip_a_id);
  const b = getRawTrip(pool.trip_b_id);
  if (a?.user_id !== userId && b?.user_id !== userId) {
    throw httpError(403, 'This pool is not yours.');
  }
}

router.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const tripId = Number(req.body?.tripId);
    const matchedTripId = Number(req.body?.matchedTripId);
    if (!tripId || !matchedTripId || tripId === matchedTripId) {
      throw httpError(400, 'Choose a valid trip to pool with.');
    }

    const rawA = getRawTrip(tripId);
    const rawB = getRawTrip(matchedTripId);
    if (!rawA || !rawB) throw httpError(404, 'One of these trips no longer exists.');
    if (rawA.user_id !== req.user.id && rawB.user_id !== req.user.id) {
      throw httpError(403, 'You can only pool your own trips.');
    }
    if (rawA.user_id === rawB.user_id) {
      throw httpError(400, 'You cannot pool two trips from the same account.');
    }
    if (rawA.status !== 'open' || rawB.status !== 'open') {
      throw httpError(409, 'One of these trips is no longer open for pooling.');
    }
    if (rawA.party_size + rawB.party_size > PRICING.maxPartySize) {
      throw httpError(409, 'Together you would exceed the available seats in one cab.');
    }

    const tripA = shapeTrip(rawA);
    const tripB = shapeTrip(rawB);
    const result = matchTrips(matchShape(tripA), matchShape(tripB));
    if (!result) {
      throw httpError(409, 'These routes no longer overlap enough to pool.');
    }

    const [first, second] = rawA.id < rawB.id ? [tripA, tripB] : [tripB, tripA];
    const firstIsMatchA = first.id === tripA.id;
    const fareFirst = firstIsMatchA ? result.fare.a.pooled : result.fare.b.pooled;
    const fareSecond = firstIsMatchA ? result.fare.b.pooled : result.fare.a.pooled;

    // The table keeps one row per trip pair (UNIQUE constraint). If this pair
    // pooled before and was cancelled, reopen that row rather than inserting.
    const existing = db
      .prepare(
        'SELECT * FROM pools WHERE (trip_a_id = ? AND trip_b_id = ?) OR (trip_a_id = ? AND trip_b_id = ?)',
      )
      .get(first.id, second.id, second.id, first.id);
    if (existing?.status === 'active') {
      throw httpError(409, 'These trips are already pooled together.');
    }

    const sharedJson = JSON.stringify(result.sharedGeo);
    let poolId;

    if (existing) {
      db.prepare(
        `UPDATE pools
            SET shared_distance_m = ?, combined_distance_m = ?,
                fare_a = ?, fare_b = ?, shared_geojson = ?,
                status = 'active', created_at = datetime('now')
          WHERE id = ?`,
      ).run(
        result.sharedDistanceM,
        result.combinedDistanceM,
        fareFirst,
        fareSecond,
        sharedJson,
        existing.id,
      );
      poolId = existing.id;
    } else {
      const info = db
        .prepare(
          `INSERT INTO pools (
            trip_a_id, trip_b_id, shared_distance_m, combined_distance_m,
            fare_a, fare_b, shared_geojson, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        )
        .run(
          first.id,
          second.id,
          result.sharedDistanceM,
          result.combinedDistanceM,
          fareFirst,
          fareSecond,
          sharedJson,
        );
      poolId = info.lastInsertRowid;
    }

    db.prepare("UPDATE trips SET status = 'pooled' WHERE id IN (?, ?)").run(
      first.id,
      second.id,
    );

    const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(poolId);
    res.status(201).json({ pool: hydrate(pool) });
  }),
);

router.get(
  '/mine',
  requireAuth,
  wrap(async (req, res) => {
    const rows = db
      .prepare(
        `SELECT p.*
           FROM pools p
           JOIN trips ta ON ta.id = p.trip_a_id
           JOIN trips tb ON tb.id = p.trip_b_id
          WHERE (ta.user_id = ? OR tb.user_id = ?)
            AND p.status = 'active'
          ORDER BY p.created_at DESC`,
      )
      .all(req.user.id, req.user.id);
    res.json({ pools: rows.map(hydrate) });
  }),
);

router.get(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(Number(req.params.id));
    if (!pool) throw httpError(404, 'Pool not found.');
    assertParticipant(pool, req.user.id);
    res.json({ pool: hydrate(pool) });
  }),
);

router.post(
  '/:id/cancel',
  requireAuth,
  wrap(async (req, res) => {
    const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(Number(req.params.id));
    if (!pool) throw httpError(404, 'Pool not found.');
    assertParticipant(pool, req.user.id);
    if (pool.status !== 'active') throw httpError(409, 'This pool is already closed.');

    db.prepare("UPDATE pools SET status = 'cancelled' WHERE id = ?").run(pool.id);
    db.prepare("UPDATE trips SET status = 'open' WHERE id IN (?, ?) AND status = 'pooled'").run(
      pool.trip_a_id,
      pool.trip_b_id,
    );
    res.json({ ok: true });
  }),
);

export default router;
