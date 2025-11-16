import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { trips } from '../data/sampleData';
import tripChecklistItems from '../data/tripChecklistItems';
import { formatDateRange } from '../utils/date';
import { Trip } from '../types';
import '../styles/page-sections.css';

const coverGradients = [
  'linear-gradient(125deg, #7f5afd, #5de0e6)',
  'linear-gradient(145deg, #ff7eb3, #ffbf81)',
  'linear-gradient(145deg, #1ecad3, #7f5afd)',
  'linear-gradient(140deg, #ffd77a, #ff7eb3)'
];

const parkLocationMap: Record<string, string> = {
  MK: 'Magic Kingdom',
  EPCOT: 'EPCOT',
  HS: 'Hollywood Studios',
  AK: "Animal Kingdom",
  OFFSITE: 'Resort / Off-site'
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseISODate = (value: string) => new Date(`${value}T00:00:00`);

const getCountdownLabel = (startDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseISODate(startDate);
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 1) return `${diff} days to go`;
  if (diff === 1) return '1 day to go';
  if (diff === 0) return 'Starts today';
  if (diff === -1) return 'Started 1 day ago';
  return `Started ${Math.abs(diff)} days ago`;
};

const getPrimaryParkName = (trip: Trip) => {
  const firstDay = trip.parkDays[0];
  if (!firstDay) return undefined;
  return parkLocationMap[firstDay.park] ?? firstDay.park;
};

const getSoonestTrip = (allTrips: Trip[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return allTrips.find((trip) => parseISODate(trip.startDate) >= today) ?? allTrips[0];
};

type CalendarCell = { date: Date; iso: string; inMonth: boolean };

const buildCalendarMatrix = (seed: Date) => {
  const monthStart = new Date(seed.getFullYear(), seed.getMonth(), 1);
  const monthEnd = new Date(seed.getFullYear(), seed.getMonth() + 1, 0);
  const firstVisible = new Date(monthStart);
  firstVisible.setDate(firstVisible.getDate() - firstVisible.getDay());
  const lastVisible = new Date(monthEnd);
  lastVisible.setDate(lastVisible.getDate() + (6 - lastVisible.getDay()));

  const days: CalendarCell[] = [];
  for (let cursor = new Date(firstVisible); cursor <= lastVisible; cursor.setDate(cursor.getDate() + 1)) {
    const cellDate = new Date(cursor);
    days.push({
      date: cellDate,
      iso: cellDate.toISOString().split('T')[0],
      inMonth: cellDate.getMonth() === seed.getMonth()
    });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
};

const TripsPage = () => {
  const sortedTrips = useMemo(() => [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate)), []);
  const soonestTrip = useMemo(() => (sortedTrips.length ? getSoonestTrip(sortedTrips) : undefined), [sortedTrips]);
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(soonestTrip?.id ?? sortedTrips[0]?.id);
  const selectedTrip = sortedTrips.find((trip) => trip.id === selectedTripId) ?? sortedTrips[0];
  const nextStepsTrip = soonestTrip ?? selectedTrip;

  const calendarSeed = selectedTrip ? parseISODate(selectedTrip.startDate) : new Date();
  const calendarKey = `${calendarSeed.getFullYear()}-${calendarSeed.getMonth()}`;
  const calendarWeeks = useMemo(() => buildCalendarMatrix(new Date(calendarSeed)), [calendarKey]);
  const calendarLabel = calendarSeed.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const highlightStart = selectedTrip ? parseISODate(selectedTrip.startDate) : undefined;
  const highlightEnd = selectedTrip ? parseISODate(selectedTrip.endDate) : undefined;
  const highlightStartIso = selectedTrip?.startDate;
  const highlightEndIso = selectedTrip?.endDate;

  if (!sortedTrips.length) {
    return (
      <div className="trips-overview">
        <header className="trips-hero">
          <div>
            <p className="trips-hero__eyebrow">Upcoming adventures</p>
            <h1>No trips yet</h1>
            <p>Create your first itinerary to start planning.</p>
          </div>
          <Button as={Link} to="/trips/new">
            Create new trip
          </Button>
        </header>
      </div>
    );
  }

  return (
    <div className="trips-overview">
      <header className="trips-hero">
        <div>
          <p className="trips-hero__eyebrow">Upcoming adventures</p>
          <h1>Choose your magical focus</h1>
          <p>Pick a trip to jump back into planning or spin up an entirely new itinerary.</p>
        </div>
        <Button as={Link} to="/trips/new">
          Create new trip
        </Button>
      </header>
      <div className="trips-board">
        <div className="trips-board__left">
          <div className="trips-cover-grid">
            {sortedTrips.map((trip, index) => {
              const description = trip.homeResortOrHotel ? `${trip.homeResortOrHotel} stay` : 'Add resort or hotel details';
              const countdown = getCountdownLabel(trip.startDate);
              const parkName = getPrimaryParkName(trip);
              const gradient = coverGradients[index % coverGradients.length];
              const isSelected = selectedTrip?.id === trip.id;
              return (
                <Card
                  key={trip.id}
                  className={clsx('trip-cover-card', isSelected && 'is-selected')}
                  onClick={() => setSelectedTripId(trip.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedTripId(trip.id);
                    }
                  }}
                >
                  <div className="trip-cover-card__artwork" style={{ backgroundImage: gradient }} />
                  <div className="trip-cover-card__body">
                    <p className="trip-card__eyebrow">{formatDateRange(trip.startDate, trip.endDate)}</p>
                    <h2>{trip.name}</h2>
                    <p>{description}</p>
                  </div>
                  <div className="trip-cover-card__footer">
                    <div className="trip-cover-card__meta">
                      <span className="trip-cover-card__countdown">{countdown}</span>
                      {parkName && <span className="trip-cover-card__tag">{parkName}</span>}
                    </div>
                    <Button as={Link} to={`/trips/${trip.id}`} size="sm">
                      Open trip
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        <aside className="trips-board__right">
          <Card className="trips-calendar-card">
            <div className="trips-calendar-card__header">
              <div>
                <p className="trip-panel__eyebrow">Trip calendar</p>
                <h3>{selectedTrip?.name ?? 'Select a trip'}</h3>
                {selectedTrip && <p>{formatDateRange(selectedTrip.startDate, selectedTrip.endDate)}</p>}
              </div>
              <span className="trips-calendar-card__month">{calendarLabel}</span>
            </div>
            <div className="mini-calendar">
              <div className="mini-calendar__weekdays">
                {weekdays.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="mini-calendar__grid">
                {calendarWeeks.map((week, weekIndex) => (
                  <div className="mini-calendar__row" key={weekIndex}>
                    {week.map((day) => {
                      const inRange =
                        highlightStart && highlightEnd
                          ? day.date >= highlightStart && day.date <= highlightEnd
                          : false;
                      const isStart = highlightStartIso ? day.iso === highlightStartIso : false;
                      const isEnd = highlightEndIso ? day.iso === highlightEndIso : false;
                      return (
                        <span
                          key={day.iso}
                          className={clsx(
                            'mini-calendar__day',
                            !day.inMonth && 'is-muted',
                            inRange && 'is-in-range',
                            (isStart || isEnd) && 'is-edge'
                          )}
                        >
                          {day.date.getDate()}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="trips-next-steps">
            <div className="trips-next-steps__header">
              <div>
                <p className="trip-panel__eyebrow">Next steps</p>
                <h3>{nextStepsTrip ? nextStepsTrip.name : 'No upcoming trip'}</h3>
              </div>
              {nextStepsTrip && <p>{formatDateRange(nextStepsTrip.startDate, nextStepsTrip.endDate)}</p>}
            </div>
            {nextStepsTrip ? (
              <ul className="trips-next-steps__list">
                {tripChecklistItems.map((item) => {
                  const isDone = Boolean(nextStepsTrip.checklist?.[item.key]);
                  return (
                    <li key={item.key} className={clsx(isDone && 'is-done')}>
                      <span className="trips-next-steps__status" aria-hidden="true">
                        {isDone ? '✓' : '○'}
                      </span>
                      <span>{item.label}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Add a future trip to see planning tasks.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default TripsPage;
