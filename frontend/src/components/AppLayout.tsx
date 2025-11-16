import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { trips } from '../data/sampleData';
import { formatDateRange } from '../utils/date';
import './AppLayout.css';

const dvcNavLinks = [
  { to: '/dvc', label: 'Overview' },
  { to: '/dvc/contracts', label: 'Contracts' },
  { to: '/dvc/use-years', label: 'Use Years' },
  { to: '/dvc/scenarios', label: 'Scenarios' }
];

const resolvePageTitle = (pathname: string) => {
  if (/^\/trips\/[^/]+\/day\//.test(pathname)) {
    return 'Day Planner';
  }
  if (/^\/trips\/[^/]+\/budget/.test(pathname)) {
    return 'Trip Budget';
  }
  if (pathname.startsWith('/trips/new')) {
    return 'Create Trip';
  }
  if (/^\/trips\/[^/]+/.test(pathname)) {
    return 'Trip Dashboard';
  }
  if (pathname.startsWith('/dvc/contracts')) {
    return 'DVC Contracts';
  }
  if (pathname.startsWith('/dvc/use-years')) {
    return 'DVC Use Years';
  }
  if (pathname.startsWith('/dvc/scenarios')) {
    return 'DVC Scenarios';
  }
  if (pathname.startsWith('/dvc')) {
    return 'DVC Overview';
  }
  return 'Trip Planning Workspace';
};

const AppLayout = () => {
  const location = useLocation();
  const pageTitle = useMemo(() => resolvePageTitle(location.pathname), [location.pathname]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeNav = () => setMobileNavOpen(false);

  return (
    <div className={`app-shell ${mobileNavOpen ? 'nav-open' : ''}`}>
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-label="Toggle navigation"
        onClick={() => setMobileNavOpen((prev) => !prev)}
      >
        ☰
      </button>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span role="img" aria-label="castle">
            🏰
          </span>
          <strong>DisTrips</strong>
        </div>
        <div className="nav-section trips-section">
          <p className="sidebar-heading">Trips</p>
          <div className="trip-list">
            <NavLink
              to="/trips"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={closeNav}
            >
              All Trips
            </NavLink>
            {trips.map((trip) => (
              <NavLink
                key={trip.id}
                to={`/trips/${trip.id}`}
                className={({ isActive }) => (isActive ? 'nav-link trip-link active' : 'nav-link trip-link')}
                onClick={closeNav}
              >
                <span className="trip-link__name">{trip.name}</span>
                <span className="trip-link__dates">{formatDateRange(trip.startDate, trip.endDate)}</span>
              </NavLink>
            ))}
          </div>
          <Link className="primary create-trip-button" to="/trips/new">
            + Create Trip
          </Link>
        </div>
        <div className="nav-section">
          <p className="sidebar-heading">Pro · DVC</p>
          {dvcNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={closeNav}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="nav-footer">
          <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} onClick={closeNav}>
            Logout
          </NavLink>
        </div>
      </aside>
      <button
        type="button"
        className={`nav-overlay ${mobileNavOpen ? 'visible' : ''}`}
        aria-label="Close navigation"
        aria-hidden={!mobileNavOpen}
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={closeNav}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closeNav();
          }
        }}
      />
      <main className="main-panel">
        <header className="top-bar">
          <div className="page-title">
            <h1>{pageTitle}</h1>
          </div>
          <Link className="primary" to="/trips/new">
            Create Trip
          </Link>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
