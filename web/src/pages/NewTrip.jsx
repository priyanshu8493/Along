import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import MapPicker from '../components/MapPicker.jsx';
import { BackIcon, UsersIcon } from '../components/Icons.jsx';
import { defaultDeparture, toIso } from '../format.js';

export default function NewTrip() {
  const navigate = useNavigate();
  const initial = defaultDeparture();

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [partySize, setPartySize] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!origin) return setError('Choose a pickup point on the map or from search.');
    if (!destination) return setError('Choose a drop-off point on the map or from search.');

    const departAt = toIso(date, time);
    if (!departAt) return setError('Choose a valid departure date and time.');
    if (new Date(departAt).getTime() < Date.now() - 60_000) {
      return setError('Pick a departure time in the future.');
    }

    setBusy(true);
    try {
      const data = await api('/trips', {
        method: 'POST',
        body: {
          origin,
          destination,
          departAt,
          partySize,
          notes: notes.trim() || undefined,
        },
      });
      navigate(`/trips/${data.trip.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="container page narrow-page">
      <Link to="/" className="back">
        <BackIcon /> Dashboard
      </Link>

      <header className="page-head">
        <span className="eyebrow">New trip</span>
        <h1>Post a trip</h1>
        <p className="lede">
          Tell us where you're headed. We'll find open trips that share your road and
          work out a fair split.
        </p>
      </header>

      <form className="post-grid" onSubmit={submit}>
        <section className="card post-map">
          <MapPicker
            origin={origin}
            destination={destination}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
          />
        </section>

        <aside className="card post-side">
          <h2>Ride details</h2>

          <div className="field-row">
            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Time</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="field">
            <span className="field-label">
              <UsersIcon /> How many people?
            </span>
            <div className="party">
              {[1, 2, 3].map((size) => (
                <button
                  key={size}
                  type="button"
                  className={partySize === size ? 'on' : ''}
                  onClick={() => setPartySize(size)}
                >
                  {size}
                  <span>{size === 1 ? 'person' : 'people'}</span>
                </button>
              ))}
            </div>
            <p className="field-hint">
              A cab seats up to 3 passengers. You can pool with anyone whose seats
              add up to 3 or fewer.
            </p>
          </div>

          <label className="field">
            <span>Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bags, flexibility, anything a co-rider should know…"
              maxLength={300}
              rows={3}
            />
          </label>

          <ErrorBanner message={error} onDismiss={() => setError('')} />

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Mapping your route…' : 'Post trip & find matches'}
          </button>

          <p className="fineprint">
            We calculate your real driving route and compare it with other open trips.
            Nothing is booked or charged automatically.
          </p>
        </aside>
      </form>
    </div>
  );
}
