import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Nav from './components/Nav.jsx';
import Loader from './components/Loader.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewTrip from './pages/NewTrip.jsx';
import TripMatches from './pages/TripMatches.jsx';
import PoolDetail from './pages/PoolDetail.jsx';

function ProtectedLayout() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="full-loader">
        <Loader label="Starting Along…" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      <Nav />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/trips/new" element={<NewTrip />} />
        <Route path="/trips/:id" element={<TripMatches />} />
        <Route path="/pools/:id" element={<PoolDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
