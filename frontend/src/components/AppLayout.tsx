import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import './AppLayout.css';

const navSections = [
  {
    title: 'Core',
    links: [
      { to: '/trips', label: 'Trips' }
    ]
  },
  {
    title: 'Pro · DVC',
    links: [
      { to: '/dvc', label: 'Overview' },
      { to: '/dvc/contracts', label: 'Contracts' },
      { to: '/dvc/use-years', label: 'Use Years' },
      { to: '/dvc/scenarios', label: 'Scenarios' }
    ]
  }
];

const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span role="img" aria-label="castle">
            🏰
          </span>
          <strong>DisTrips</strong>
        </div>
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            <p className="sidebar-heading">{section.title}</p>
            {section.links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="nav-footer">
          <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Logout
          </NavLink>
        </div>
      </aside>
      <main className="main-panel">
        <header className="top-bar">
          <div>
            <p className="page-path">{location.pathname}</p>
            <h1>Trip Planning Workspace</h1>
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
