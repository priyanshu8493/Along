import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Loader from '../components/Loader.jsx';
import RouteMap from '../components/RouteMap.jsx';
import {
  BackIcon,
  CheckIcon,
  ClockIcon,
  SparklesIcon,
} from '../components/Icons.jsx';
import { firstName, inr, km, whenLabel } from '../format.js';

function RiderRow({ rider }) {
  return (
    <div className="rider-row">
      <span className="avatar">
        {rider.user.name
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0])
          .join('')}
      </span>
      <div className="rider-info">
        <strong>{rider.user.name}</strong>
        <span className="muted small">
          {rider.trip.origin.name} → {rider.trip.destination.name}
        </span>
        <a href={`mailto:${rider.user.email}`} className="rider-contact">
          {rider.user.email}
        </a>
      </div>
      <span className="rider-fare">{inr(rider.fare)}</span>
    </div>
  );
}

export default function PoolDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pool, setPool] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let alive = true;
    api(`/pools/${id}`)
      .then((data) => {
        if (alive) setPool(data.pool);
      })
      .catch((err) => {
        if (alive) setLoadError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loadError) {
    return (
      <div className="container page">
        <Link to="/" className="back">
          <BackIcon /> Dashboard
        </Link>
        <ErrorBanner message={loadError} />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="container page">
        <Loader label="Loading your pool…" />
      </div>
    );
  }

  const mine = pool.riders.find((r) => r.user.id === user.id) || pool.riders[0];
  const other = pool.riders.find((r) => r.trip.id !== mine.trip.id) || pool.riders[1];
  const savings = Math.max(0, mine.soloFare - mine.fare);

  const mapTrips = pool.riders.map((rider, index) => ({
    id: rider.trip.id,
    color: index === 0 ? '#2563eb' : '#db2777',
    route: rider.trip.route,
    origin: rider.trip.origin,
    destination: rider.trip.destination,
    labels: index === 0 ? ['A', 'B'] : ['C', 'D'],
  }));

  const cancel = async () => {
    const ok = window.confirm(
      'Cancel this pool? Both trips will reopen so you can match again.',
    );
    if (!ok) return;
    setCancelling(true);
    setActionError('');
    try {
      await api(`/pools/${id}/cancel`, { method: 'POST' });
      navigate('/');
    } catch (err) {
      setActionError(err.message);
      setCancelling(false);
    }
  };

  return (
    <div className="container page">
      <Link to="/" className="back">
        <BackIcon /> Dashboard
      </Link>

      <section className="pool-hero card">
        <div className="pool-hero-copy">
          <span className="success-pill">
            <CheckIcon /> Pool confirmed
          </span>
          <h1>You're riding with {firstName(other.user.name)}.</h1>
          <p>
            <ClockIcon /> {whenLabel(mine.trip.departAt)} · {mine.trip.origin.name} →{' '}
            {mine.trip.destination.name}
          </p>
        </div>
        <div className="pool-hero-money">
          <span className="tiny">Your fare</span>
          <strong>{inr(mine.fare)}</strong>
          <span className="save-text">
            <SparklesIcon /> Saving {inr(savings)}
          </span>
        </div>
      </section>

      <div className="pool-layout">
        <section className="card pool-map-card">
          <RouteMap trips={mapTrips} shared={pool.sharedGeo} height={420} />
          <div className="legend">
            <span>
              <i style={{ background: '#2563eb' }} /> {mine.user.name}
            </span>
            <span>
              <i style={{ background: '#db2777' }} /> {other.user.name}
            </span>
            <span>
              <i style={{ background: '#f59e0b' }} /> Shared {km(pool.sharedDistanceM)}
            </span>
          </div>
        </section>

        <aside className="pool-side">
          <div className="card">
            <div className="fare-head">
              <h2>Fare split</h2>
              <span className="muted small">
                {km(pool.combinedDistanceM)} combined
              </span>
            </div>
            <table className="fare-table">
              <thead>
                <tr>
                  <th />
                  {pool.riders.map((rider) => (
                    <th key={rider.trip.id}>{firstName(rider.user.name)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Solo</td>
                  {pool.riders.map((rider) => (
                    <td key={rider.trip.id}>{inr(rider.soloFare)}</td>
                  ))}
                </tr>
                <tr className="strong-row">
                  <td>With pool</td>
                  {pool.riders.map((rider) => (
                    <td key={rider.trip.id}>{inr(rider.fare)}</td>
                  ))}
                </tr>
                <tr className="save-row">
                  <td>Saved</td>
                  {pool.riders.map((rider) => (
                    <td key={rider.trip.id}>
                      {inr(Math.max(0, rider.soloFare - rider.fare))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div className="fare-total">
              <span>Combined ride</span>
              <strong>{inr(pool.totalFare)}</strong>
            </div>
            <p className="fineprint">
              Each rider pays for their own stretch plus half of the{' '}
              {km(pool.sharedDistanceM)} shared stretch. The base fare is split evenly.
            </p>
          </div>

          <div className="card">
            <h2>Co-riders</h2>
            <div className="rider-list">
              {pool.riders.map((rider) => (
                <RiderRow key={rider.trip.id} rider={rider} />
              ))}
            </div>
            <a
              className="btn btn-ghost btn-block"
              href={`mailto:${other.user.email}?subject=${encodeURIComponent(
                'Our Along ride',
              )}`}
            >
              Message {firstName(other.user.name)}
            </a>
          </div>

          <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />

          <button
            type="button"
            className="btn btn-ghost btn-block danger-text"
            onClick={cancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel this pool'}
          </button>
        </aside>
      </div>
    </div>
  );
}
