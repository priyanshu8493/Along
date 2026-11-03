import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { initials, firstName } from '../format.js';
import { LogoMark } from './Icons.jsx';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" aria-label="Along home">
          <span className="brand-mark">
            <LogoMark />
          </span>
          <span className="brand-name">Along</span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/trips/new">Post a trip</NavLink>
        </nav>

        <div className="nav-user">
          <span className="avatar" title={user.name}>
            {initials(user.name)}
          </span>
          <span className="nav-username">{firstName(user.name)}</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
