import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Loader from '../components/Loader.jsx';
import {
  ArrowRightIcon,
  PlusIcon,
  RouteIcon,
  SparklesIcon,
} from '../components/Icons.jsx';
import {
  firstName,
  inr,
  km,
  relativeWhen,
  whenLabel,
} from '../format.js';

function Stat({ label, value, icon }) {
  return (
    <div className="stat card">
      <span className="stat-icon">{icon}</span>
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const text =
    status === 'pooled' ? 'Pooled' : status === 'cancelled' ? 'Cancelled' : 'Open';
  return <span className={`badge badge-${status}`}>{text}</span>;
}

function TripCard({ trip, poolId }) {
  const to = poolId ? `/pools/${poolId}` : `/trips/${trip.id}`;
  return (
    <Link to={to} className="trip-card card">
      <div className="trip-card-top">
        <StatusBadge status={trip.status} />
        <span className="muted small">{relativeWhen(trip.departAt)}</span>
      </div>

      <div className="trip-route">
        <span className="dot dot-a" />
        <div>
          <span className="tiny">From</span>
          <strong>{trip.origin.name}</strong>
        </div>
      </div>
      <div className="route-stem" />
      <div className="trip-route">
        <span className="dot dot-b" />
        <div>
          <span className="tiny">To</span>
          <strong>{trip.destination.name}</strong>
        </div>
      </div>

      <div className="trip-card-foot">
        <span>{km(trip.distanceM)}</span>
        <span>{whenLabel(trip.departAt)}</span>
        <span className="link-like">
          {poolId ? 'View pool' : 'View matches'} <ArrowRightIcon />
        </span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [tripData, poolData] = await Promise.all([
          api('/trips/mine'),
          api('/pools/mine'),
        ]);
        if (!alive) return;
        setTrips(tripData.trips);
        setPools(poolData.pools);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const poolByTrip = useMemo(() => {
    const map = new Map();
    for (const pool of pools) {
      for (const rider of pool.riders) map.set(rider.trip.id, pool.id);
    }
    return map;
  }, [pools]);

  const savings = useMemo(
    () =>
      pools.reduce((sum, pool) => {
        const mine = pool.riders.find((r) => r.user.id === user.id);
        return sum + (mine ? mine.soloFare - mine.fare : 0);
      }, 0),
    [pools, user.id],
  );

  const openTrips = trips.filter((t) => t.status === 'open');

  return (
    <div className="container page">
      <section className="dash-hero">
        <div>
          <span className="eyebrow">Good to see you</span>
          <h1>Hi {firstName(user.name)}.</h1>
          <p className="lede">
            Share a route, split the fare, and leave a seat empty on the road.
          </p>
        </div>
        <Link to="/trips/new" className="btn btn-primary">
          <PlusIcon /> Post a trip
        </Link>
      </section>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <section className="stats-grid">
        <Stat label="Open trips" value={openTrips.length} icon={<RouteIcon />} />
        <Stat
          label="Active pools"
          value={pools.length}
          icon={<span className="stat-emoji">🤝</span>}
        />
        <Stat
          label="Saved by pooling"
          value={inr(savings)}
          icon={<SparklesIcon />}
        />
      </section>

      {pools.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Active pools</h2>
            <span className="muted small">{pools.length} shared ride{pools.length === 1 ? '' : 's'}</span>
          </div>

          <div className="pool-cards">
            {pools.map((pool) => {
              const mine = pool.riders.find((r) => r.user.id === user.id) || pool.riders[0];
              const other = pool.riders.find((r) => r.trip.id !== mine.trip.id) || pool.riders[1];
              return (
                <Link key={pool.id} to={`/pools/${pool.id}`} className="pool-card card">
                  <div className="pool-card-top">
                    <span className="pool-people">
                      <span className="avatar avatar-sm">{firstName(mine.user.name)[0]}</span>
                      <span className="avatar avatar-sm avatar-alt">{firstName(other.user.name)[0]}</span>
                    </span>
                    <span className="badge badge-pooled">Confirmed</span>
                  </div>
                  <strong className="pool-title">
                    Riding with {firstName(other.user.name)}
                  </strong>
                  <span className="muted small">
                    {whenLabel(mine.trip.departAt)}
                  </span>
                  <div className="pool-card-foot">
                    <span>{km(pool.sharedDistanceM)} shared</span>
                    <span className="save-text">
                      You pay {inr(mine.fare)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Your trips</h2>
          {trips.length > 0 && (
            <Link to="/trips/new" className="link-like">
              Add another <PlusIcon />
            </Link>
          )}
        </div>

        {loading ? (
          <Loader label="Loading your trips…" />
        ) : trips.length === 0 ? (
          <div className="empty card">
            <span className="empty-icon">
              <RouteIcon />
            </span>
            <h3>No trips yet</h3>
            <p>
              Post where you're going. We'll compare your actual driving route with
              other open trips and show you the overlap.
            </p>
            <Link to="/trips/new" className="btn btn-primary">
              <PlusIcon /> Post your first trip
            </Link>
            <p className="fineprint">
              Trying the demo? Sign in as <strong>asha@along.app</strong> to see a
              seeded trip with a ready-made match.
            </p>
          </div>
        ) : (
          <div className="trip-grid">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} poolId={poolByTrip.get(trip.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
