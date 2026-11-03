import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { CheckIcon, LogoMark, PinIcon } from '../components/Icons.jsx';

const DEMO_ACCOUNTS = [
  { name: 'Asha Rao', email: 'asha@along.app', route: 'Hebbal → Silk Board' },
  { name: 'Rahul Mehta', email: 'rahul@along.app', route: 'Marathahalli → HSR Layout' },
];

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { user, ready, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate(from, { replace: true });
  }, [ready, user, from, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const useDemo = (account) => {
    setEmail(account.email);
    setPassword('along123');
    setError('');
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-brand">
          <LogoMark size={34} />
          <span>Along</span>
        </div>

        <div className="auth-copy">
          <span className="eyebrow light">Ride pooling, properly</span>
          <h1>
            Two routes.
            <br />
            One cab.
          </h1>
          <p>
            When your journey overlaps someone else's, share the ride and split the
            fare — automatically, by the kilometre.
          </p>

          <ul className="auth-points">
            <li>
              <CheckIcon /> Overlap-aware matching, not just the same destination
            </li>
            <li>
              <CheckIcon /> A fair fare split, down to the shared stretch
            </li>
            <li>
              <CheckIcon /> Fewer cars, cheaper commutes
            </li>
          </ul>
        </div>

        <div className="auth-art">
          <svg viewBox="0 0 380 190" fill="none" aria-hidden="true">
            <path
              d="M22 160C86 160 92 46 190 46s100-14 168-24"
              stroke="rgba(255,255,255,.32)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M128 132c34-6 34-52 88-58"
              stroke="#fbbf24"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="7 9"
            />
            <circle cx="22" cy="160" r="7" fill="#fff" />
            <circle cx="358" cy="22" r="7" fill="#fff" />
            <circle cx="128" cy="132" r="6" fill="#fbbf24" />
            <circle cx="216" cy="74" r="6" fill="#fbbf24" />
            <text x="34" y="150" fill="rgba(255,255,255,.85)" fontSize="13" fontWeight="600">
              You
            </text>
            <text x="252" y="52" fill="rgba(255,255,255,.85)" fontSize="13" fontWeight="600">
              Co-rider
            </text>
          </svg>
        </div>

        <p className="auth-foot">Along MVP · Bengaluru · Built for the daily commute</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <LogoMark size={30} />
            <span>Along</span>
          </div>

          <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-sub">
            {isLogin
              ? 'Sign in to see who is travelling your way.'
              : 'Start sharing rides in under a minute.'}
          </p>

          <ErrorBanner message={error} onDismiss={() => setError('')} />

          <form className="form" onSubmit={submit}>
            {!isLogin && (
              <label className="field">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </label>

            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {isLogin && (
            <div className="demo-box">
              <div className="demo-head">
                <span>Try the demo</span>
                <span className="demo-pass">password: along123</span>
              </div>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="demo-row"
                  onClick={() => useDemo(account)}
                >
                  <span className="demo-dot" />
                  <span className="demo-who">
                    <strong>{account.name}</strong>
                    <span>{account.route}</span>
                  </span>
                  <span className="demo-use">Use</span>
                </button>
              ))}
            </div>
          )}

          <p className="auth-switch">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <Link to={isLogin ? '/register' : '/login'}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </p>

          <p className="auth-note">
            <PinIcon /> Pickup and drop-off are chosen on a real map.
          </p>
        </div>
      </main>
    </div>
  );
}
