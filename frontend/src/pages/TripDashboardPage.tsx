import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { trips } from '../data/sampleData';
import restaurantOptionsData from '../data/restaurants.json';
import { formatDate, formatDateRange } from '../utils/date';
import '../styles/page-sections.css';
import { TripChecklist, TripFlightDetails } from '../types';

const formatCurrency = (value?: number) => (value ? `$${value.toLocaleString()}` : '—');
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const parseDate = (value: string) => new Date(`${value}T00:00:00`);
const toISODate = (date: Date) => date.toISOString().split('T')[0];

type ServiceType = 'QUICK' | 'TABLE';

type RestaurantOption = {
  id: string;
  name: string;
  serviceType: ServiceType;
  location: string;
};

const restaurantOptions: RestaurantOption[] = restaurantOptionsData as RestaurantOption[];
const restaurantCreditMap: Record<ServiceType, number> = {
  QUICK: 1,
  TABLE: 2
};
const parkLocationMap: Record<string, string> = {
  MK: 'Magic Kingdom',
  EPCOT: 'EPCOT',
  HS: 'Hollywood Studios',
  AK: "Disney's Animal Kingdom",
  OFFSITE: 'Resort / Off-site',
  UNSET: 'TBD'
};

type ReservationEntry = {
  id: string;
  name: string;
  location: string;
  date: string;
  time?: string;
  confirmation?: string;
  serviceType?: ServiceType;
  restaurantId?: string;
  credits?: number;
};

type InviteRole = 'viewer' | 'editor';
type InviteEntry = {
  id: string;
  email: string;
  role: InviteRole;
};

const TripDashboardPage = () => {
  const { tripId } = useParams();
  const trip = trips.find((item) => item.id === tripId) ?? trips[0];
  const isDvcPro = true;

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

  const tripLength = sortedDays.length || Math.max(1, Math.round((parseDate(trip.endDate).getTime() - parseDate(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const startDate = parseDate(trip.startDate);
  const countdownDays = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const dayNoun = Math.abs(countdownDays) === 1 ? 'day' : 'days';
  const countdownLabel =
    countdownDays > 0 ? `Trip starts in ${countdownDays} ${dayNoun}` : countdownDays === 0 ? 'Trip starts today' : `Trip started ${Math.abs(countdownDays)} ${dayNoun} ago`;

  const initialLodgingType = trip.homeResortOrHotel ? 'ONSITE' : 'UNKNOWN';
  const [lodgingType, setLodgingType] = useState<'ONSITE' | 'OFFSITE' | 'UNKNOWN'>(initialLodgingType);
  const [selectedResort, setSelectedResort] = useState(trip.homeResortOrHotel ?? '');
  const [roomType, setRoomType] = useState('Standard View');
  const [dvcQuote, setDvcQuote] = useState<{ nightly: number[]; total: number } | null>(null);
  const [usingDvc, setUsingDvc] = useState(trip.usingDvc ?? false);
  useEffect(() => setUsingDvc(trip.usingDvc ?? false), [trip]);
  const emptyFlight: TripFlightDetails = {
    airline: '',
    flightNumber: '',
    departureAirport: '',
    departureTime: '',
    arrivalAirport: '',
    arrivalTime: ''
  };
  const [departureFlight, setDepartureFlight] = useState<TripFlightDetails>(trip.logistics?.departureFlight ?? emptyFlight);
  const [returnFlight, setReturnFlight] = useState<TripFlightDetails>(trip.logistics?.returnFlight ?? emptyFlight);
  const [groundTransport, setGroundTransport] = useState(trip.logistics?.groundTransport ?? '');
  const emptyChecklist: TripChecklist = {
    ticketsPurchased: false,
    parkReservationsMade: false,
    genieStrategyDecided: false,
    magicBandsReady: false,
    memoryMaker: false
  };
  const [checklist, setChecklist] = useState<TripChecklist>({ ...emptyChecklist, ...trip.checklist });

  const resortOptions = useMemo(
    () => ['Pop Century', 'Caribbean Beach', 'Polynesian Village', 'Saratoga Springs', 'Grand Floridian'],
    []
  );
  const roomTypeOptions = useMemo(() => ['Standard View', 'Preferred View', 'Deluxe Studio', '1-Bedroom Villa'], []);
  const transportOptions = useMemo(() => ['Disney Bus', 'Mears Connect', 'Rental Car', 'Rideshare', 'Personal Car'], []);

  const updateFlight = (updater: (current: TripFlightDetails) => TripFlightDetails, type: 'departure' | 'return') => {
    if (type === 'departure') {
      setDepartureFlight((prev) => updater({ ...emptyFlight, ...prev }));
    } else {
      setReturnFlight((prev) => updater({ ...emptyFlight, ...prev }));
    }
  };

  const handleFlightChange = (type: 'departure' | 'return', field: keyof TripFlightDetails, value: string) => {
    updateFlight((current) => ({ ...current, [field]: value }), type);
  };

  const checklistItems: Array<{ key: keyof TripChecklist; label: string }> = [
    { key: 'ticketsPurchased', label: 'Tickets purchased' },
    { key: 'parkReservationsMade', label: 'Park reservations made' },
    { key: 'genieStrategyDecided', label: 'Genie+ strategy decided' },
    { key: 'magicBandsReady', label: 'MagicBands / room keys ready' },
    { key: 'memoryMaker', label: 'Memory Maker planned' }
  ];

  const initialReservations = useMemo<ReservationEntry[]>(() => {
    const items: ReservationEntry[] = [];
    trip.parkDays.forEach((day) => {
      day.timeBlocks.forEach((block) => {
        block.activities
          .filter((activity) => activity.type === 'ADR' || activity.type === 'SHOW')
          .forEach((activity) => {
            const matchedRestaurant = restaurantOptions.find(
              (option) => option.name.toLowerCase() === activity.name.toLowerCase()
            );
            const location =
              matchedRestaurant?.location ?? parkLocationMap[day.park] ?? (day.park === 'OFFSITE' ? 'Resort / Off-site' : day.park);
            const serviceType = matchedRestaurant?.serviceType;
            items.push({
              id: activity.id,
              name: activity.name,
              location,
              date: day.date,
              time: activity.startTime,
              confirmation: (activity as { confirmationCode?: string }).confirmationCode,
              restaurantId: matchedRestaurant?.id,
              serviceType,
              credits: serviceType ? restaurantCreditMap[serviceType] : 0
            });
          });
      });
    });
    return items;
  }, [trip]);

  const [reservations, setReservations] = useState<ReservationEntry[]>(initialReservations);
  useEffect(() => setReservations(initialReservations), [initialReservations]);
  const totalDiningCredits = trip.diningPlan?.enabled ? trip.diningPlan.totalCredits : 0;
  const usedDiningCredits = useMemo(
    () => reservations.reduce((sum, entry) => sum + (entry.credits ?? 0), 0),
    [reservations]
  );
  const remainingDiningCredits = Math.max(totalDiningCredits - usedDiningCredits, 0);

  const [isReservationModalOpen, setReservationModalOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    restaurantId: '',
    name: '',
    location: '',
    date: trip.startDate,
    time: '',
    confirmation: '',
    serviceType: undefined as ServiceType | undefined,
    credits: 0
  });
  const [invites, setInvites] = useState<InviteEntry[]>([]);
  const [inviteForm, setInviteForm] = useState<{ email: string; role: InviteRole }>({ email: '', role: 'viewer' });

  const openReservationModal = () => {
    setReservationForm({
      restaurantId: '',
      name: '',
      location: '',
      date: trip.startDate,
      time: '',
      confirmation: '',
      serviceType: undefined,
      credits: 0
    });
    setReservationModalOpen(true);
  };

  const closeReservationModal = () => setReservationModalOpen(false);

  const handleRestaurantSelect = (value: string) => {
    if (!value || value === 'custom') {
      setReservationForm((prev) => ({
        ...prev,
        restaurantId: value,
        serviceType: undefined,
        credits: 0
      }));
      return;
    }
    const option = restaurantOptions.find((item) => item.id === value);
    setReservationForm((prev) => ({
      ...prev,
      restaurantId: value,
      name: option?.name ?? prev.name,
      location: option?.location ?? prev.location,
      serviceType: option?.serviceType,
      credits: option ? restaurantCreditMap[option.serviceType] : prev.credits
    }));
  };

  const handleReservationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reservationForm.name) return;
    const normalizedRestaurantId =
      reservationForm.restaurantId && reservationForm.restaurantId !== 'custom' ? reservationForm.restaurantId : undefined;
    setReservations((prev) => [
      ...prev,
      {
        id: `res-${Date.now()}`,
        name: reservationForm.name,
        location: reservationForm.location || 'TBD',
        date: reservationForm.date,
        time: reservationForm.time,
        confirmation: reservationForm.confirmation,
        restaurantId: normalizedRestaurantId,
        serviceType: reservationForm.serviceType,
        credits: reservationForm.credits ?? 0
      }
    ]);
    closeReservationModal();
  };
  const handleInviteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteForm.email.trim()) return;
    setInvites((prev) => [...prev, { id: `invite-${Date.now()}`, email: inviteForm.email.trim(), role: inviteForm.role }]);
    setInviteForm({ email: '', role: 'viewer' });
  };

  const pendingReservationCredits = trip.diningPlan?.enabled ? reservationForm.credits ?? 0 : 0;
  const projectedRemainingCredits =
    trip.diningPlan?.enabled ? Math.max(remainingDiningCredits - pendingReservationCredits, 0) : undefined;

  return (
    <div className="trip-dashboard">
      <section className="card trip-hero">
        <div className="trip-hero__info">
          <p className="nav-heading">Trip Overview</p>
          <h1>{trip.name}</h1>
          <div className="trip-hero__meta">
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            <span>{tripLength} days</span>
          </div>
          <div className="trip-hero__countdown">
            <span>{countdownLabel}</span>
          </div>
          <div className="trip-hero__actions">
            <Link to={`/trips/${trip.id}/print`} className="ghost">
              Printable itinerary
            </Link>
          </div>
        </div>
        <div className="trip-hero__image">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80"
            alt="Disney castle fireworks over the park"
          />
        </div>
      </section>
      <div className="grid trip-dashboard__sections">
        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <article className="card">
            <p className="nav-heading">Trip window</p>
            <h2>{formatDateRange(trip.startDate, trip.endDate)}</h2>
          </article>
          <article className="card">
            <p className="nav-heading">Budget target</p>
            <h2>{formatCurrency(trip.budgetTarget)}</h2>
          </article>
        </section>

        <section className="card dining-card">
          <div className="trip-card__header">
            <div>
              <h2>Dining &amp; Reservations</h2>
              <p>ADR and special experience tracker.</p>
            </div>
            <button className="primary" type="button" onClick={openReservationModal}>
              Add reservation
            </button>
          </div>
          {trip.diningPlan?.enabled && (
            <p className="dining-card__credits">
              Dining plan credits remaining: {remainingDiningCredits} / {totalDiningCredits}
            </p>
          )}
          <table className="budget-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Date</th>
                <th>Time</th>
                <th>Confirmation</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1rem 0' }}>
                    No reservations yet.
                  </td>
                </tr>
              )}
              {reservations.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div className="dining-card__name">
                      <span>{entry.name}</span>
                      {trip.diningPlan?.enabled && entry.credits !== undefined && entry.credits > 0 && (
                        <small className="dining-card__credit-pill">
                          {entry.credits} credit{entry.credits === 1 ? '' : 's'}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>{entry.location}</td>
                  <td>{formatDate(entry.date)}</td>
                  <td>{entry.time ?? '—'}</td>
                  <td>{entry.confirmation ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card lodging-card">
          <div className="trip-card__header">
            <div>
              <h2>Lodging</h2>
              <p>Track where you’re staying each night.</p>
            </div>
            {!isDvcPro && (
              <Link className="ghost small" to="/dvc">
                Upgrade for DVC
              </Link>
            )}
          </div>
          <label className="toggle-field">
            <span>Using DVC for this stay</span>
            <input
              type="checkbox"
              checked={usingDvc}
              onChange={(event) => {
                setUsingDvc(event.target.checked);
                if (!event.target.checked) {
                  setDvcQuote(null);
                }
              }}
            />
          </label>
          <div className="lodging-card__options">
            {[
              { label: 'On-site Disney Resort', value: 'ONSITE' },
              { label: 'Off-site', value: 'OFFSITE' },
              { label: 'Not sure yet', value: 'UNKNOWN' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={lodgingType === option.value ? 'lodging-card__option active' : 'lodging-card__option'}
                onClick={() => setLodgingType(option.value as typeof lodgingType)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {lodgingType === 'ONSITE' && (
            <>
              <div className="lodging-card__fields">
                <label className="lodging-card__field">
                  <span>Resort</span>
                  <select value={selectedResort} onChange={(event) => setSelectedResort(event.target.value)}>
                    <option value="">Select resort</option>
                    {resortOptions.map((resort) => (
                      <option key={resort} value={resort}>
                        {resort}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="lodging-card__field">
                  <span>Room type</span>
                  <select value={roomType} onChange={(event) => setRoomType(event.target.value)}>
                    {roomTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {usingDvc && (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    const nights = tripLength;
                    const nightlyPoints = Array.from({ length: nights }, (_, idx) => 15 + idx * 2);
                    const totalPoints = nightlyPoints.reduce((sum, points) => sum + points, 0);
                    setDvcQuote({ nightly: nightlyPoints, total: totalPoints });
                  }}
                >
                  Calculate DVC points
                </button>
              )}
            </>
          )}
        </section>
        {usingDvc && (
          <section className="card dvc-summary">
            <div className="trip-card__header">
              <div>
                <h2>DVC Summary</h2>
                <p>Contract allocation for this trip.</p>
              </div>
            </div>
            {trip.dvcSummary ? (
              <dl className="trip-card__meta">
                <div>
                  <dt>Contract</dt>
                  <dd>{trip.dvcSummary.contractNickname}</dd>
                </div>
                <div>
                  <dt>Use year</dt>
                  <dd>{trip.dvcSummary.useYear}</dd>
                </div>
                <div>
                  <dt>Points allocated</dt>
                  <dd>{trip.dvcSummary.pointsAllocated}</dd>
                </div>
              </dl>
            ) : (
              <p>No contract linked yet.</p>
            )}
            {dvcQuote && (
              <div className="dvc-quote">
                <p>
                  <strong>Mocked calculation:</strong> {dvcQuote.total} pts total
                </p>
                <ul>
                  {dvcQuote.nightly.map((points, index) => (
                    <li key={index}>
                      Night {index + 1}: {points} pts
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        <section className="card">
          <div className="trip-card__header">
            <div>
              <h2>Sharing</h2>
              <p>Invite family members to view or edit this trip.</p>
            </div>
          </div>
          <form className="sharing-form" onSubmit={handleInviteSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Guest email"
                required
              />
            </label>
            <label>
              <span>Role</span>
              <select value={inviteForm.role} onChange={(event) => setInviteForm((prev) => ({ ...prev, role: event.target.value as InviteRole }))}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </label>
            <button type="submit" className="primary">
              Send invite
            </button>
          </form>
          {invites.length > 0 && (
            <table className="sharing-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id}>
                    <td>{invite.email}</td>
                    <td>{invite.role === 'viewer' ? 'Viewer' : 'Editor'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card logistics-card">
          <div className="trip-card__header">
            <div>
              <h2>Flights &amp; Transport</h2>
              <p>Keep arrival, departure, and ground plans handy.</p>
            </div>
          </div>
          <div className="logistics-card__group">
            <h3>Departure flight</h3>
            <div className="logistics-card__fields">
              <label className="logistics-card__field">
                <span>Airline</span>
                <input
                  type="text"
                  value={departureFlight.airline ?? ''}
                  onChange={(event) => handleFlightChange('departure', 'airline', event.target.value)}
                  placeholder="Delta, JetBlue..."
                />
              </label>
              <label className="logistics-card__field">
                <span>Flight #</span>
                <input
                  type="text"
                  value={departureFlight.flightNumber ?? ''}
                  onChange={(event) => handleFlightChange('departure', 'flightNumber', event.target.value)}
                  placeholder="DL 1234"
                />
              </label>
              <label className="logistics-card__field">
                <span>Departure airport</span>
                <input
                  type="text"
                  value={departureFlight.departureAirport ?? ''}
                  onChange={(event) => handleFlightChange('departure', 'departureAirport', event.target.value)}
                  placeholder="BOS"
                />
              </label>
              <label className="logistics-card__field">
                <span>Arrival airport</span>
                <input
                  type="text"
                  value={departureFlight.arrivalAirport ?? ''}
                  onChange={(event) => handleFlightChange('departure', 'arrivalAirport', event.target.value)}
                  placeholder="MCO"
                />
              </label>
              <label className="logistics-card__field">
                <span>Departure time</span>
                <input
                  type="datetime-local"
                  value={departureFlight.departureTime ?? ''}
                  onChange={(event) => handleFlightChange('departure', 'departureTime', event.target.value)}
                />
              </label>
              <label className="logistics-card__field">
                <span>Arrival time</span>
                <input
                  type="datetime-local"
                  value={departureFlight.arrivalTime ?? ''}
                  onChange={(event) => handleFlightChange('departure', 'arrivalTime', event.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="logistics-card__group">
            <h3>Return flight</h3>
            <div className="logistics-card__fields">
              <label className="logistics-card__field">
                <span>Airline</span>
                <input
                  type="text"
                  value={returnFlight.airline ?? ''}
                  onChange={(event) => handleFlightChange('return', 'airline', event.target.value)}
                />
              </label>
              <label className="logistics-card__field">
                <span>Flight #</span>
                <input
                  type="text"
                  value={returnFlight.flightNumber ?? ''}
                  onChange={(event) => handleFlightChange('return', 'flightNumber', event.target.value)}
                />
              </label>
              <label className="logistics-card__field">
                <span>Departure airport</span>
                <input
                  type="text"
                  value={returnFlight.departureAirport ?? ''}
                  onChange={(event) => handleFlightChange('return', 'departureAirport', event.target.value)}
                />
              </label>
              <label className="logistics-card__field">
                <span>Arrival airport</span>
                <input
                  type="text"
                  value={returnFlight.arrivalAirport ?? ''}
                  onChange={(event) => handleFlightChange('return', 'arrivalAirport', event.target.value)}
                />
              </label>
              <label className="logistics-card__field">
                <span>Departure time</span>
                <input
                  type="datetime-local"
                  value={returnFlight.departureTime ?? ''}
                  onChange={(event) => handleFlightChange('return', 'departureTime', event.target.value)}
                />
              </label>
              <label className="logistics-card__field">
                <span>Arrival time</span>
                <input
                  type="datetime-local"
                  value={returnFlight.arrivalTime ?? ''}
                  onChange={(event) => handleFlightChange('return', 'arrivalTime', event.target.value)}
                />
              </label>
            </div>
          </div>
          <label className="logistics-card__field">
            <span>Ground transport</span>
            <select value={groundTransport} onChange={(event) => setGroundTransport(event.target.value)}>
              <option value="">Select option</option>
              {transportOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="card checklist-card">
          <div className="trip-card__header">
            <div>
              <h2>Tickets &amp; Reservations</h2>
              <p>Quick checklist to stay on track.</p>
            </div>
          </div>
          <ul>
            {checklistItems.map((item) => (
              <li key={item.key} className="checklist-card__item">
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(checklist[item.key])}
                    onChange={() =>
                      setChecklist((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key]
                      }))
                    }
                  />
                  <span>{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
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
      {isReservationModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <form className="reservation-modal card" onSubmit={handleReservationSubmit}>
            <div className="trip-card__header">
              <div>
                <h2>Add reservation</h2>
                <p>Track dining or experience bookings.</p>
              </div>
              <button type="button" className="ghost" onClick={closeReservationModal}>
                Close
              </button>
            </div>
            <div className="reservation-modal__fields">
              <label>
                <span>Restaurant</span>
                <select value={reservationForm.restaurantId} onChange={(event) => handleRestaurantSelect(event.target.value)}>
                  <option value="">Select restaurant</option>
                  {restaurantOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} ({option.serviceType === 'QUICK' ? 'Quick-service' : 'Table-service'})
                    </option>
                  ))}
                  <option value="custom">Custom or other experience</option>
                </select>
              </label>
              <p className="reservation-modal__note">
                {reservationForm.restaurantId && reservationForm.restaurantId !== 'custom'
                  ? `${reservationForm.serviceType === 'QUICK' ? 'Quick-service' : 'Table-service'} • ${
                      reservationForm.location || 'Location pending'
                    }`
                  : 'Select a listed restaurant or choose custom to enter details manually.'}
              </p>
              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={reservationForm.name}
                  onChange={(event) => setReservationForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Location</span>
                <input
                  type="text"
                  value={reservationForm.location}
                  onChange={(event) => setReservationForm((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="Park or resort"
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={reservationForm.date}
                  onChange={(event) => setReservationForm((prev) => ({ ...prev, date: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Time</span>
                <input
                  type="time"
                  value={reservationForm.time}
                  onChange={(event) => setReservationForm((prev) => ({ ...prev, time: event.target.value }))}
                />
              </label>
              <label>
                <span>Confirmation code</span>
                <input
                  type="text"
                  value={reservationForm.confirmation}
                  onChange={(event) => setReservationForm((prev) => ({ ...prev, confirmation: event.target.value }))}
                />
              </label>
              {trip.diningPlan?.enabled && (
                <label>
                  <span>Dining plan credits</span>
                  <input
                    type="number"
                    min={0}
                    value={reservationForm.credits}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setReservationForm((prev) => ({
                        ...prev,
                        credits: Number.isNaN(nextValue) ? 0 : nextValue
                      }));
                    }}
                  />
                </label>
              )}
            </div>
            {trip.diningPlan?.enabled && (
              <p className="reservation-modal__credits">
                This reservation uses {reservationForm.credits ?? 0} credit{(reservationForm.credits ?? 0) === 1 ? '' : 's'}. Remaining
                after save: {projectedRemainingCredits}
              </p>
            )}
            <div className="reservation-modal__actions">
              <button type="button" className="ghost" onClick={closeReservationModal}>
                Cancel
              </button>
              <button type="submit" className="primary">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TripDashboardPage;
