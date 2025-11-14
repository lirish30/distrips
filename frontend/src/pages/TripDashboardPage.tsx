import { Link, useParams } from 'react-router-dom';
import { trips } from '../data/sampleData';
import '../styles/page-sections.css';

const formatCurrency = (value?: number) => (value ? `$${value.toLocaleString()}` : '—');
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const parseDate = (value: string) => new Date(`${value}T00:00:00`);
const toISODate = (date: Date) => date.toISOString().split('T')[0];

const TripDashboardPage = () => {
  const { tripId } = useParams();
  const trip = trips.find((item) => item.id === tripId) ?? trips[0];
  const totalActivities = trip.parkDays.flatMap((day) => day.timeBlocks.flatMap((block) => block.activities)).length;

  const sortedDays = [...trip.parkDays].sort((a, b) => a.date.localeCompare(b.date));

  const firstDay = sortedDays.length ? parseDate(sortedDays[0].date) : new Date();
  const lastDay = sortedDays.length ? parseDate(sortedDays[sortedDays.length - 1].date) : new Date();

  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  const calendarEnd = new Date(lastDay);
  calendarEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const dayLookup = new Map(sortedDays.map((day) => [day.date, day]));
  const calendarDays: { iso: string; dayIndex: number; tripDay?: typeof sortedDays[number] }[] = [];

  for (let cursor = new Date(calendarStart); cursor <= calendarEnd; cursor.setDate(cursor.getDate() + 1)) {
    const iso = toISODate(cursor);
    calendarDays.push({
      iso,
      dayIndex: cursor.getDay(),
      tripDay: dayLookup.get(iso)
    });
  }

  const calendarWeeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    calendarWeeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <article className="card">
          <p className="nav-heading">Trip window</p>
          <h2>
            {trip.startDate} → {trip.endDate}
          </h2>
        </article>
        <article className="card">
          <p className="nav-heading">Budget target</p>
          <h2>{formatCurrency(trip.budgetTarget)}</h2>
        </article>
        <article className="card">
          <p className="nav-heading">Planned activities</p>
          <h2>{totalActivities}</h2>
        </article>
      </section>

      <section className="card">
        <div className="trip-card__header">
          <div>
            <h2>Park days</h2>
            <p>Snapshot of each day’s assigned park and priorities.</p>
          </div>
          <Link className="ghost" to={`/trips/${trip.id}/day/${trip.parkDays[0].id}`}>
            Plan next day
          </Link>
        </div>
        <div className="calendar">
          <div className="calendar__header">
            {weekdays.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          {calendarWeeks.map((week, index) => (
            <div className="calendar__row" key={index}>
              {week.map((day) => {
                const calendarDate = parseDate(day.iso);
                const displayDate = calendarDate.getDate();
                if (!day.tripDay) {
                  return (
                    <div key={day.iso} className="calendar__cell calendar__cell--empty">
                      <span className="calendar__date muted">{displayDate}</span>
                    </div>
                  );
                }

                return (
                  <div key={day.iso} className="calendar__cell">
                    <header>
                      <span className="calendar__date">{displayDate}</span>
                      <span className="calendar__park">{day.tripDay.park === 'UNSET' ? 'Set park' : day.tripDay.park}</span>
                    </header>
                    <p className="calendar__notes">{day.tripDay.notes ?? 'No notes yet.'}</p>
                    <footer>
                      <span>{day.tripDay.timeBlocks.length} blocks</span>
                      <Link to={`/trips/${trip.id}/day/${day.tripDay.id}`}>Open</Link>
                    </footer>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="trip-card__header">
          <div>
            <h2>Recent reservations</h2>
            <p>ADR and experience highlights to keep on the radar.</p>
          </div>
          <Link className="ghost" to={`/trips/${trip.id}/budget`}>
            Review budget
          </Link>
        </div>
        <ul className="reservation-list">
          {trip.parkDays
            .flatMap((day) => day.timeBlocks)
            .flatMap((block) => block.activities)
            .filter((activity) => activity.type === 'ADR' || activity.type === 'RIDE')
            .slice(0, 5)
            .map((activity) => (
              <li key={activity.id}>
                <div>
                  <p>{activity.name}</p>
                  <small>{activity.type}</small>
                </div>
                <span>{activity.startTime ?? '—'}</span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
};

export default TripDashboardPage;
