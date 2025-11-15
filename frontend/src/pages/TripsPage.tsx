import { Link } from 'react-router-dom';
import { trips } from '../data/sampleData';
import { formatDateRange } from '../utils/date';
import '../styles/page-sections.css';

const TripsPage = () => {
  return (
    <div className="grid trips-grid">
      {trips.map((trip) => (
        <div key={trip.id} className="card trip-card">
          <div className="trip-card__header">
            <div>
              <h2>{trip.name}</h2>
              <p>{formatDateRange(trip.startDate, trip.endDate)}</p>
            </div>
            <span className="trip-card__badge">{trip.parkDays.length} days</span>
          </div>
          <dl className="trip-card__meta">
            <div>
              <dt>Home Resort / Hotel</dt>
              <dd>{trip.homeResortOrHotel ?? 'Not set'}</dd>
            </div>
            <div>
              <dt>Budget target</dt>
              <dd>${trip.budgetTarget?.toLocaleString() ?? 'N/A'}</dd>
            </div>
          </dl>
          <div className="trip-card__actions">
            <Link to={`/trips/${trip.id}`} className="ghost">
              Open dashboard
            </Link>
            <Link to={`/trips/${trip.id}/day/${trip.parkDays[0].id}`} className="primary">
              Plan days
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TripsPage;
