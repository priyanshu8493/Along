import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Loader from '../components/Loader.jsx';
import RouteMap from '../components/RouteMap.jsx';
import {
  BackIcon,
  ClockIcon,
  RouteIcon,
  SparklesIcon,
  UsersIcon,
} from '../components/Icons.jsx';
import {
  duration,
  firstName,
  inr,
  km,
  pct,
  scoreLabel,
  timeOf,
  whenLabel,
} from '../format.js';

function scoreTone(score) {
  if (score >= 0.72) return 'great';
  if (score >= 0.5) return 'good';
  return 'ok';
}

function TripSummary({ trip }) {
  return (
    <section className="trip-hero card">
      <div className="trip-hero-route">
        <div className="trip-route">
          <span className="dot dot-a" />
          <div>
            <span className="tiny">Pickup</span>
            <strong>{trip.origin.name}</strong>
          </div>
        </div>
        <span className="route-arrow">→</span>
        <div className="trip-route">
          <span className="dot dot-b" />
          <div>
            <span className="tiny">Drop-off</span>
            <strong>{trip.destination.name}</strong>
          </div>
        </div>
      </div>
      <div className="trip-meta">
        <span>
          <ClockIcon /> {whenLabel(trip.departAt)}
        </span>
        <span>
          <RouteIcon /> {km(trip.distanceM)} · {duration(trip.durationS)}
        </span>
        <span>
          <UsersIcon /> {trip.partySize} {trip.partySize === 1 ? 'person' : 'people'}
        </span>
      </div>
    </section>
  );
}

function MatchCard({ match, active, onClick }) {
  return (
    <button
      type="button"
      className={`match-card ${active ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="match-top">
        <div className="person">
          <span className="avatar">
            {match.otherUser.name
              .split(' ')
              .slice(0, 2)
              .map((p) => p[0])
              .join('')}
          </span>
          <div className="person-info">
            <strong>{match.otherUser.name}</strong>
            <span>
              Leaves {timeOf(match.otherTrip.departAt)} ·{' '}
              {Math.round(match.timeGapMin)} min apart
            </span>
          </div>
        </div>
        <span className={`badge badge-${scoreTone(match.score)}`}>
          {scoreLabel(match.score)}
        </span>
      </div>

      <div className="match-route">
        <span className="dot dot-c" />
        <span className="match-place">{match.otherTrip.origin.name}</span>
        <span className="match-arrow">→</span>
        <span className="dot dot-d" />
        <span className="match-place">{match.otherTrip.destination.name}</span>
      </div>

      <div className="match-stats">
        <span>
          <RouteIcon /> {km(match.sharedDistanceM)} shared
        </span>
        <span>
          <UsersIcon /> {pct(match.coverage)} overlap
        </span>
        <span className="save-text">
          <SparklesIcon /> Save {inr(match.fare.a.savings)}
        </span>
      </div>
    </button>
  );
}

function EmptyMatches({ trip }) {
  return (
    <div className="empty card">
      <span className="empty-icon">
        <RouteIcon />
      </span>
      <h3>No overlapping trips yet</h3>
      <p>
        We've kept your trip open. We looked ±90 minutes around your departure for
        trips whose route runs along yours.
      </p>
      <ul className="criteria">
        <li>The shared stretch must be at least 800 m</li>
        <li>The route must overlap by at least 25%</li>
        <li>Combined seats must be 3 or fewer</li>
      </ul>
      <Link to="/trips/new" className="btn btn-primary">
        Post another trip
      </Link>
    </div>
  );
}

export default function TripMatches() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pooling, setPooling] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setLoadError('');
    api(`/trips/${id}/matches`)
      .then((result) => {
        if (!alive) return;
        setData(result);
        setSelectedId(result.matches[0]?.id ?? null);
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

  if (!data) {
    return (
      <div className="container page">
        <Loader label="Comparing your route with open trips…" />
      </div>
    );
  }

  const { trip, matches } = data;
  const current = matches.find((m) => m.id === selectedId) || null;

  const selfTrip = {
    id: 'self',
    color: '#2563eb',
    route: trip.route,
    origin: trip.origin,
    destination: trip.destination,
    labels: ['A', 'B'],
  };

  const otherTrip = current
    ? {
        id: 'other',
        color: '#db2777',
        route: current.otherTrip.route,
        origin: current.otherTrip.origin,
        destination: current.otherTrip.destination,
        labels: ['C', 'D'],
      }
    : null;

  const handlePool = async () => {
    if (!current) return;
    setPooling(true);
    setActionError('');
    try {
      const result = await api('/pools', {
        method: 'POST',
        body: { tripId: trip.id, matchedTripId: current.otherTrip.id },
      });
      navigate(`/pools/${result.pool.id}`);
    } catch (err) {
      setActionError(err.message);
      setPooling(false);
    }
  };

  return (
    <div className="container page">
      <Link to="/" className="back">
        <BackIcon /> Dashboard
      </Link>

      <header className="page-head compact">
        <span className="eyebrow">Match results</span>
        <h1>{matches.length} trip{matches.length === 1 ? '' : 's'} share your road</h1>
        <p className="lede">
          We compare the actual driving route — not just start and end points.
        </p>
      </header>

      <TripSummary trip={trip} />

      <div className="matches-layout">
        <div className="match-list-col">
          <div className="list-head">
            <h2>Co-riders</h2>
            {matches.length > 0 && <span className="muted small">Best fit first</span>}
          </div>

          {matches.length === 0 ? (
            <EmptyMatches trip={trip} />
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                active={match.id === selectedId}
                onClick={() => {
                  setSelectedId(match.id);
                  setActionError('');
                }}
              />
            ))
          )}

          <div className="card mini-note">
            <h3>How matching works</h3>
            <p>
              We project the shorter route onto the longer one. If it hugs the corridor
              in the same direction, the overlapping stretch becomes your shared ride.
            </p>
          </div>
        </div>

        <div className="match-detail-col">
          {current ? (
            <div className="match-detail card">
              <div className="detail-head">
                <div>
                  <span className="eyebrow">Route comparison</span>
                  <h2>Pool with {firstName(current.otherUser.name)}</h2>
                </div>
                <span className={`badge badge-${scoreTone(current.score)}`}>
                  {scoreLabel(current.score)}
                </span>
              </div>

              <RouteMap
                trips={[selfTrip, otherTrip]}
                shared={current.sharedGeo}
                height={360}
              />

              <div className="legend">
                <span>
                  <i style={{ background: '#2563eb' }} /> Your route
                </span>
                <span>
                  <i style={{ background: '#db2777' }} />{' '}
                  {firstName(current.otherUser.name)}'s route
                </span>
                <span>
                  <i style={{ background: '#f59e0b' }} /> Shared{' '}
                  {km(current.sharedDistanceM)}
                </span>
              </div>

              <div className="metrics">
                <div className="metric">
                  <span>Shared stretch</span>
                  <strong>{km(current.sharedDistanceM)}</strong>
                </div>
                <div className="metric">
                  <span>Route overlap</span>
                  <strong>{pct(current.coverage)}</strong>
                </div>
                <div className="metric">
                  <span>Departure gap</span>
                  <strong>{Math.round(current.timeGapMin)} min</strong>
                </div>
              </div>

              <div className="fare-block">
                <div className="fare-head">
                  <h3>Fare split</h3>
                  <span className="muted small">
                    Combined ride {inr(current.fare.total)}
                  </span>
                </div>
                <table className="fare-table">
                  <thead>
                    <tr>
                      <th />
                      <th>You</th>
                      <th>{firstName(current.otherUser.name)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Solo</td>
                      <td>{inr(current.fare.a.solo)}</td>
                      <td>{inr(current.fare.b.solo)}</td>
                    </tr>
                    <tr className="strong-row">
                      <td>With pool</td>
                      <td>{inr(current.fare.a.pooled)}</td>
                      <td>{inr(current.fare.b.pooled)}</td>
                    </tr>
                    <tr className="save-row">
                      <td>You save</td>
                      <td>{inr(current.fare.a.savings)}</td>
                      <td>{inr(current.fare.b.savings)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="fineprint">
                  You each pay for your own stretch plus half of the{' '}
                  {km(current.sharedDistanceM)} shared stretch.
                </p>
              </div>

              <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />

              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handlePool}
                disabled={pooling}
              >
                {pooling
                  ? 'Creating your pool…'
                  : `Pool with ${firstName(current.otherUser.name)}`}
              </button>
            </div>
          ) : (
            <div className="match-detail card no-match-detail">
              <span className="empty-icon">
                <RouteIcon />
              </span>
              <h2>Your route is waiting</h2>
              <p>
                There's nobody on this stretch yet. Your trip stays open, so new
                co-riders can match with it later.
              </p>
              <RouteMap trips={[selfTrip]} height={300} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
