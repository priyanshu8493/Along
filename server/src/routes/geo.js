import { Router } from 'express';
import { geocode, reverseGeocode } from '../services/geocode.js';
import { wrap } from '../util.js';

const router = Router();

router.get(
  '/geocode',
  wrap(async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 3) return res.json({ results: [] });
    try {
      const results = await geocode(q);
      res.json({ results });
    } catch (err) {
      res.json({
        results: [],
        warning: 'Address search is unavailable right now — click the map to drop a pin instead.',
      });
    }
  }),
);

router.get(
  '/geocode/reverse',
  wrap(async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'lat and lng are required.' });
    }
    try {
      const place = await reverseGeocode(lat, lng);
      res.json({ place });
    } catch (err) {
      res.json({
        place: { name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng },
        warning: 'Could not look up this address, so we used the coordinates.',
      });
    }
  }),
);

export default router;
