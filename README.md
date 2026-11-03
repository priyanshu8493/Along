# Along — share the ride, split the fare

Along is a route-overlap ride-pooling MVP. You post where you're going; Along finds
another open trip whose **road route** runs along yours, shows you the shared stretch,
and splits the fare fairly.

> For the full pitch-ready problem statement, see **[PROBLEM_STATEMENT.md](./PROBLEM_STATEMENT.md)**.

The demo scenario: Asha travels **Majestic → Bengaluru Airport**, Rahul travels
**Hebbal → Bengaluru Airport**. Rahul's route is nested inside Asha's, so they share
**26.7 km** of the same airport road. Alone they would pay ₹546 + ₹460; together they
pay **₹330 + ₹243**.

---

## Quick start

Requires Node 22.5+ (tested on Node 24) and npm.

```bash
npm install
npm run seed     # creates demo users and trips (fetches real OSRM routes)
npm run dev      # API on :4000, web on :5173
```

Open **http://localhost:5173**.

### Demo accounts

| Email | Password | Trip |
| --- | --- | --- |
| `asha@along.app` | `along123` | Majestic → Airport (long route) |
| `rahul@along.app` | `along123` | Hebbal → Airport (nested route) |
| `meera@along.app` | `along123` | Whitefield → Electronic City (no match) |

Sign in as **Asha**, open her trip, and you'll see Rahul as a 93%-overlap match with
a fare comparison. Pool the ride to see the combined route and split.

The login screen has one-click demo account fillers.

---

## How the matching works

1. When a trip is posted, the API asks **OSRM** for the real driving route (GeoJSON
   polyline + distance). If OSRM is unavailable, it falls back to a straight-line
   estimate and labels the trip accordingly.
2. For each pair of open trips, the shorter route is **projected onto the longer
   route's polyline**. Endpoints are projected to get the along-route start/end of the
   shared stretch.
3. A match must pass all of these:
   - same direction of travel;
   - endpoints within 2.5 km of the corridor and median sample offset ≤ 2.2 km;
   - at least 800 m shared;
   - at least 25% of the shorter trip overlaps;
   - departures within ±90 minutes;
   - combined party size ≤ 3.
4. Results are scored by route coverage (60%), how tightly the routes hug (25%), and
   departure-time closeness (15%). The best direction is kept.

The shared stretch is stored as its own GeoJSON LineString, which is what the amber
line on the map shows.

## How the fare split works

```
combined distance = d(A) + d(B) − shared
share(A)          = (d(A) − shared) + shared / 2
share(B)          = (d(B) − shared) + shared / 2
fare              = base/2 + perKm × share
```

Each rider pays for the part only they travel, plus half the shared stretch. The base
fare is split evenly. The two fares always add up to the cost of the combined ride,
and both riders pay less than going solo. Defaults: **₹60 base + ₹14/km** (set in
`server/src/config.js`).

Demo numbers: Asha pays ₹330 vs ₹546 solo; Rahul pays ₹243 vs ₹460 solo; the pooled
ride totals ₹573 (vs ₹1,006 separately).

> Note: the combined distance is computed as `d(A) + d(B) − shared`. When the two
> routes use slightly different road geometry for the same stretch, this is a small
> conservative overestimate. It never causes a rider to pay more than solo.

---

## Stack

- **Frontend** — React 18 + Vite, React Router, Leaflet + OpenStreetMap tiles.
- **Backend** — Node, Express, `node:sqlite` (built in, no native build), JWT auth,
  bcrypt password hashing.
- **Routing** — public OSRM demo server, proxied and cached in the trip row.
- **Geocoding** — Nominatim (search + reverse), proxied with an in-memory cache.

## Project layout

```
server/
  src/
    index.js              Express app + production static serving
    db.js                 SQLite schema (users, trips, pools)
    seed.js               demo users and trips
    routes/               auth, trips, pools, geocode
    services/
      geo.js              haversine, projection, polyline slicing
      matching.js         corridor matching + scoring
      fare.js             fare splitting
      routing.js          OSRM client with fallback
      geocode.js          Nominatim client with cache
web/
  src/
    pages/                Auth, Dashboard, NewTrip, TripMatches, PoolDetail
    components/           Nav, MapPicker, RouteMap, PlaceField, …
    styles.css            design system
```

## API

All trip/pool routes require `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | `{ name, email, password }` → token |
| `POST` | `/api/auth/login` | `{ email, password }` → token |
| `GET` | `/api/auth/me` | current user |
| `POST` | `/api/trips` | post a trip; server computes the route |
| `GET` | `/api/trips/mine` | my trips |
| `GET` | `/api/trips/:id/matches` | scored route overlaps for my trip |
| `DELETE` | `/api/trips/:id` | cancel an open trip |
| `POST` | `/api/pools` | `{ tripId, matchedTripId }` → create/reopen a pool |
| `GET` | `/api/pools/mine` | my active pools |
| `GET` | `/api/pools/:id` | pool detail with fare breakdown |
| `POST` | `/api/pools/:id/cancel` | cancel a pool and reopen both trips |
| `GET` | `/api/geocode?q=` | address search |
| `GET` | `/api/geocode/reverse?lat=&lng=` | reverse geocode |

## Configuration

Copy `.env.example` to `.env` if you want to override defaults:

```bash
PORT=4000
JWT_SECRET=replace-me
# OSRM_URL=https://router.project-osrm.org
# NOMINATIM_URL=https://nominatim.openstreetmap.org
# DB_PATH=./server/data/along.db
```

## Production build

```bash
npm run build
npm run start      # serves web/dist and the API from :4000
```

## MVP limitations / next steps

- **Pooling is one-sided** — creating a pool doesn't require the other rider to
  accept yet. A request/accept flow is the next product step.
- **No payments or live cab dispatch** — fares are an estimate, and the ride is not
  booked. Integrations with a cab provider would come later.
- **Same-direction only** — opposite-direction overlaps are rejected.
- **Public demo services** — OSRM/Nominatim are rate-limited and have no SLA; the app
  degrades gracefully to estimates/coordinate labels.
- **SQLite + local JWT secret** — fine for a demo, not for production.
- **Matching is pairwise** — it does not yet build 3-rider chains or consider traffic
  at departure time.
