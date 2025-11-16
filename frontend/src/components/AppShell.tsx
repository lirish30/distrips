import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Button from './Button';
import { trips } from '../data/sampleData';
import { formatDateRange } from '../utils/date';
import './AppShell.css';

const dvcNavLinks = [
  { to: '/dvc', label: 'Overview', icon: '🏰' },
  { to: '/dvc/contracts', label: 'Contracts', icon: '📄' },
  { to: '/dvc/use-years', label: 'Use Years', icon: '🗓️' },
  { to: '/dvc/scenarios', label: 'Scenarios', icon: '🪄' }
];

const defaultTripId = trips[0]?.id ?? 'trip-0';

const primaryNavLinks = [
  { to: '/trips', label: 'Trips overview', icon: '🧭' },
  { to: '/trips/new', label: 'Create trip', icon: '✨' },
  { to: `/trips/${defaultTripId}/family`, label: 'Family Mode', icon: '👨‍👩‍👧' }
];

const resolvePageTitle = (pathname: string) => {
  if (/^\/trips\/[^/]+\/day\//.test(pathname)) {
    return 'Day Planner';
  }
  if (/^\/trips\/[^/]+\/family/.test(pathname)) {
    return 'Family Mode';
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

const AppShell = () => {
  const location = useLocation();
  const pageTitle = useMemo(() => resolvePageTitle(location.pathname), [location.pathname]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeNav = () => setMobileNavOpen(false);

  return (
    <div className={clsx('app-shell', mobileNavOpen && 'nav-open')}>
      <button
        type="button"
        className="app-shell__nav-toggle"
        aria-label="Toggle navigation"
        onClick={() => setMobileNavOpen((prev) => !prev)}
      >
        ☰
      </button>
      <aside className="app-shell__sidebar" aria-label="Primary navigation">
        <div className="app-shell__brand">
          <span role="img" aria-label="sorcerer">
            🪄
          </span>
          <div>
            <strong>DisTrips</strong>
            <p>Travel Studio</p>
          </div>
        </div>
        <nav className="app-shell__nav" aria-label="Workspace">
          {primaryNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'app-shell__nav-link is-active' : 'app-shell__nav-link')}
              onClick={closeNav}
            >
              <span className="app-shell__nav-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-shell__trips">
          <p className="sidebar-heading">Active trips</p>
          <div className="app-shell__trip-list">
            {trips.map((trip) => (
              <NavLink
                key={trip.id}
                to={`/trips/${trip.id}`}
                className={({ isActive }) => (isActive ? 'trip-pill is-active' : 'trip-pill')}
                onClick={closeNav}
              >
                <div>
                  <span className="trip-pill__name">{trip.name}</span>
                  <span className="trip-pill__dates">{formatDateRange(trip.startDate, trip.endDate)}</span>
                </div>
                <span aria-hidden="true">→</span>
              </NavLink>
            ))}
          </div>
          <Button as={Link} to="/trips/new" size="sm" variant="secondary" fullWidth>
            Start a Trip
          </Button>
        </div>
        <nav className="app-shell__nav" aria-label="DVC tools">
          <p className="sidebar-heading">Pro · DVC</p>
          {dvcNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'app-shell__nav-link is-active' : 'app-shell__nav-link')}
              onClick={closeNav}
            >
              <span className="app-shell__nav-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-shell__footer">
          <NavLink
            to="/login"
            className={({ isActive }) => (isActive ? 'app-shell__logout is-active' : 'app-shell__logout')}
            onClick={closeNav}
          >
            <span aria-hidden="true">↩︎</span>
            Logout
          </NavLink>
        </div>
      </aside>
      <button
        type="button"
        className={clsx('app-shell__backdrop', mobileNavOpen && 'is-visible')}
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
      <main className="app-shell__main">
        <header className="app-shell__topbar">
          <div>
            <p className="app-shell__eyebrow">Today’s focus</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className="app-shell__topbar-actions">
            <label className="app-shell__search" aria-label="Search trips">
              <span aria-hidden="true">🔍</span>
              <input placeholder="Search trips, plans..." type="search" />
            </label>
            <Button as={Link} to="/trips/new" size="sm">
              Plan trip
            </Button>
            <button type="button" className="app-shell__avatar" aria-label="Account menu">
              <span>LI</span>
            </button>
          </div>
        </header>
        <div className="app-shell__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
