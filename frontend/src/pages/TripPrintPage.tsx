import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trips } from '../data/sampleData';
import { formatDate } from '../utils/date';
import '../styles/print.css';

const TripPrintPage = () => {
  const { tripId } = useParams();
  const trip = trips.find((item) => item.id === tripId) ?? trips[0];

  const sortedDays = useMemo(() => [...trip.parkDays].sort((a, b) => a.date.localeCompare(b.date)), [trip.parkDays]);

  return (
    <div className="print-layout">
      <header className="print-header">
        <div>
          <p>Printable Itinerary</p>
          <h1>{trip.name}</h1>
          <p>
            {trip.startDate} → {trip.endDate}
          </p>
        </div>
        <div className="print-actions">
          <button type="button" onClick={() => window.print()}>
            Print itinerary
          </button>
          <Link to={`/trips/${trip.id}`}>Back to trip</Link>
        </div>
      </header>
      <main>
        {sortedDays.map((day) => (
          <section key={day.id} className="print-day">
            <header>
              <h2>{formatDate(day.date)}</h2>
              <p>Park: {day.park}</p>
              {day.notes && <p className="print-notes">{day.notes}</p>}
            </header>
            <div className="print-day__blocks">
              {day.timeBlocks.map((block) => (
                <article key={block.id}>
                  <h3>{block.label}</h3>
                  {block.activities.length === 0 && <p className="muted">No plans yet.</p>}
                  {block.activities.map((activity) => (
                    <div key={activity.id} className="print-activity">
                      <div>
                        <strong>{activity.name}</strong>
                        {activity.notes && <p>{activity.notes}</p>}
                      </div>
                      <span>{activity.startTime ?? '—'}</span>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default TripPrintPage;
