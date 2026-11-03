import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getRoute } from '../services/routing.js';
import { matchTrips, MATCH_LIMITS } from '../services/matching.js';
import { matchShape, shapeTrip, shapeUser } from '../serializers.js';
import { wrap, httpError, validLatLng } from '../util.js';
import { PRICING } from '../config.js';

const router = Router();

function loadTrip(id) {
  return shapeTrip(db.prepare('SELECT * FROM trips WHERE id = ?').get(id));
}

function validatePlace(place, label) {
  if (!place || typeof place !== 'object') {
    throw httpError(400, `${label} is required.`);
  }
  const name = String(place.name || '').trim();
  const lat = Number(place.lat);
  const lng = Number(place.lng);
  if (!name) throw httpError(400, `Please choose a ${label.toLowerCase()}.`);
  if (!validLatLng(lat, lng)) {
    throw httpError(400, `${label} needs a valid map location. Try picking it on the map.`);
  }
  return { name, lat, lng };
}

router.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const origin = validatePlace(req.body?.origin, 'Pickup');
    const destination = validatePlace(req.body?.destination, 'Drop-off');

    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      throw httpError(400, 'Pickup and drop-off cannot be the same place.');
    }

    const departAtDate = new Date(req.body?.departAt);
    if (Number.isNaN(departAtDate.getTime())) {
      throw httpError(400, 'Please choose a valid departure date and time.');
    }

    const partySize = Number(req.body?.partySize ?? 1);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > PRICING.maxPartySize) {
      throw httpError(400, `Party size must be between 1 and ${PRICING.maxPartySize}.`);
    }

    const notes = String(req.body?.notes || '').trim().slice(0, 300) || null;

    const route = await getRoute(origin, destination);

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
        req.user.id,
        origin.name, origin.lat, origin.lng,
        destination.name, destination.lat, destination.lng,
        departAtDate.toISOString(),
        partySize,
        notes,
        JSON.stringify({ type: 'LineString', coordinates: route.coordinates }),
        route.distanceM,
        route.durationS ?? null,
        route.source,
      );

    res.status(201).json({
      trip: loadTrip(info.lastInsertRowid),
      warning: route.warning,
    });
  }),
);

router.get(
  '/mine',
  requireAuth,
  wrap(async (req, res) => {
    const rows = db
      .prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);
    res.json({ trips: rows.map(shapeTrip) });
  }),
);

router.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const trip = db
      .prepare('SELECT * FROM trips WHERE id = ?')
      .get(Number(req.params.id));
    if (!trip) throw httpError(404, 'Trip not found.');
    if (trip.user_id !== req.user.id) throw httpError(403, 'This is not your trip.');
    if (trip.status === 'pooled') {
      throw httpError(409, 'This trip is already in a pool. Cancel the pool first.');
    }
    db.prepare("UPDATE trips SET status = 'cancelled' WHERE id = ?").run(trip.id);
    res.json({ ok: true });
  }),
);

router.get(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const trip = loadTrip(Number(req.params.id));
    if (!trip) throw httpError(404, 'Trip not found.');
    res.json({ trip, isOwner: trip.userId === req.user.id });
  }),
);

router.get(
  '/:id/matches',
  requireAuth,
  wrap(async (req, res) => {
    const trip = loadTrip(Number(req.params.id));
    if (!trip) throw httpError(404, 'Trip not found.');
    if (trip.userId !== req.user.id) throw httpError(403, 'This is not your trip.');
    if (trip.status !== 'open') {
      return res.json({ trip, matches: [], reason: 'This trip is no longer open.' });
    }

    const depart = new Date(trip.departAt).getTime();
    const windowMs = MATCH_LIMITS.MAX_TIME_GAP_MIN * 60 * 1000;
    const from = new Date(depart - windowMs).toISOString();
    const to = new Date(depart + windowMs).toISOString();

    const candidates = db
      .prepare(
        `SELECT t.*, u.name AS user_name, u.email AS user_email
           FROM trips t
           JOIN users u ON u.id = t.user_id
          WHERE t.status = 'open'
            AND t.user_id != ?
            AND t.depart_at BETWEEN ? AND ?
            AND (t.party_size + ?) <= ?
          ORDER BY t.depart_at ASC`,
      )
      .all(req.user.id, from, to, trip.partySize, PRICING.maxPartySize);

    const self = matchShape(trip);
    const matches = [];

    for (const row of candidates) {
      const other = shapeTrip(row);
      const result = matchTrips(self, matchShape(other));
      if (!result) continue;
      matches.push({
        id: `${trip.id}:${other.id}`,
        otherTrip: other,
        otherUser: shapeUser({ id: row.user_id, name: row.user_name, email: row.user_email }),
        score: result.score,
        coverage: result.coverage,
        sharedDistanceM: result.sharedDistanceM,
        combinedDistanceM: result.combinedDistanceM,
        medianOffsetM: result.medianOffsetM,
        timeGapMin: result.timeGapMin,
        sharedGeo: result.sharedGeo,
        fare: result.fare,
      });
    }

    matches.sort((a, b) => b.score - a.score);
    res.json({ trip, matches });
  }),
);

export default router;
