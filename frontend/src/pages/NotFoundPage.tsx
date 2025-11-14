import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="card" style={{ textAlign: 'center' }}>
    <h2>Page not found</h2>
    <p>Try heading back to your trips dashboard.</p>
    <Link to="/trips" className="primary" style={{ marginTop: '1rem' }}>
      Back to trips
    </Link>
  </div>
);

export default NotFoundPage;
