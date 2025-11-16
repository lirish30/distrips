import { FocusEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { trips } from '../data/sampleData';
import tripChecklistItems from '../data/tripChecklistItems';
import restaurantOptionsData from '../data/restaurants.json';
import { formatDate, formatDateRange } from '../utils/date';
import '../styles/page-sections.css';
import { TripChecklist, TripFlightDetails } from '../types';

const formatCurrency = (value?: number) => (value ? `$${value.toLocaleString()}` : '—');
const formatTimeLabel = (value?: string) => {
  if (!value) return 'Time TBD';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};
const createFlightId = () => `flight-${Math.random().toString(36).slice(2, 10)}`;
const createEmptyFlight = (direction: 'OUTBOUND' | 'INBOUND' = 'OUTBOUND'): TripFlightDetails => ({
  id: createFlightId(),
  direction,
  airline: '',
  flightNumber: '',
  departureAirport: '',
  departureTime: '',
  arrivalAirport: '',
  arrivalTime: '',
  confirmationCode: '',
  travelers: []
});
const formatTravelerInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
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
const reservationCategoryLabels: Record<string, string> = {
  ADR: 'Dining',
  RIDE: 'Ride',
  SHOW: 'Show',
  NOTE: 'Note',
  OTHER: 'Experience',
  CUSTOM: 'Custom'
};
const parkTagFallback = 'NONE';

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
  park?: string;
  category?: string;
};

type InviteRole = 'viewer' | 'editor';
type InviteEntry = {
  id: string;
  email: string;
  role: InviteRole;
};

const getReservationTypeLabel = (entry: ReservationEntry) => {
  if (entry.category && reservationCategoryLabels[entry.category]) {
    return reservationCategoryLabels[entry.category];
  }
  if (entry.serviceType) {
    return entry.serviceType === 'QUICK' ? 'Quick-service' : 'Table-service';
  }
  return 'Reservation';
};

const TripDashboardPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const trip = trips.find((item) => item.id === tripId) ?? trips[0];
  const isDvcPro = true;
  const firstParkDay = trip.parkDays[0];
  const firstParkDayId = firstParkDay?.id;
  const dayPlannerLink = firstParkDayId ? `/trips/${trip.id}/day/${firstParkDayId}` : `/trips/${trip.id}`;

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
  const [groundTransport, setGroundTransport] = useState(trip.logistics?.groundTransport ?? '');
  useEffect(() => setGroundTransport(trip.logistics?.groundTransport ?? ''), [trip]);
  const buildFlightsFromLogistics = () => {
    if (trip.logistics?.flights?.length) {
      return trip.logistics.flights.map((flight, index) => ({
        ...flight,
        id: flight.id ?? createFlightId(),
        direction: flight.direction ?? (index === 0 ? 'OUTBOUND' : 'INBOUND')
      }));
    }
    const fallbackFlights: TripFlightDetails[] = [];
    if (trip.logistics?.departureFlight) {
      fallbackFlights.push({ ...trip.logistics.departureFlight, id: createFlightId(), direction: 'OUTBOUND' });
    }
    if (trip.logistics?.returnFlight) {
      fallbackFlights.push({ ...trip.logistics.returnFlight, id: createFlightId(), direction: 'INBOUND' });
    }
    return fallbackFlights;
  };
  const [flights, setFlights] = useState<TripFlightDetails[]>(buildFlightsFromLogistics);
  useEffect(() => {
    setFlights(buildFlightsFromLogistics());
  }, [trip]);
  const [isFlightsModalOpen, setFlightsModalOpen] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [flightForm, setFlightForm] = useState<TripFlightDetails>(createEmptyFlight());
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

  const initialReservations = useMemo<ReservationEntry[]>(() => {
    const items: ReservationEntry[] = [];
    trip.parkDays.forEach((day) => {
      day.timeBlocks.forEach((block) => {
        block.activities
          .filter((activity) => activity.type === 'ADR' || activity.type === 'SHOW' || activity.type === 'RIDE')
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
              credits: serviceType ? restaurantCreditMap[serviceType] : 0,
              park: day.park,
              category: activity.type
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
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isLodgingModalOpen, setLodgingModalOpen] = useState(false);
  const [activeDayPopover, setActiveDayPopover] = useState<string | null>(null);

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
  const openShareModal = () => setShareModalOpen(true);
  const closeShareModal = () => setShareModalOpen(false);
  const openLodgingModal = () => setLodgingModalOpen(true);
  const closeLodgingModal = () => setLodgingModalOpen(false);

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
    const matchedDay = trip.parkDays.find((day) => day.date === reservationForm.date);
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
        credits: reservationForm.credits ?? 0,
        park: matchedDay?.park,
        category: reservationForm.serviceType ? 'ADR' : 'CUSTOM'
      }
    ]);
    closeReservationModal();
  };
  const openFlightsModal = (flight?: TripFlightDetails) => {
    setFlightsModalOpen(true);
    if (flight) {
      setFlightForm({ ...flight });
      setEditingFlightId(flight.id ?? null);
    } else {
      setFlightForm(createEmptyFlight());
      setEditingFlightId(null);
    }
  };
  const closeFlightsModal = () => setFlightsModalOpen(false);
  const handleFlightFormChange = (field: keyof TripFlightDetails, value: string) => {
    setFlightForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleFlightTravelerChange = (value: string) => {
    const travelers = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setFlightForm((prev) => ({ ...prev, travelers }));
  };
  const handleFlightSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFlight: TripFlightDetails = {
      ...flightForm,
      id: flightForm.id ?? createFlightId(),
      direction: flightForm.direction ?? 'OUTBOUND'
    };
    setFlights((prev) =>
      editingFlightId ? prev.map((flight) => (flight.id === editingFlightId ? nextFlight : flight)) : [...prev, nextFlight]
    );
    closeFlightsModal();
  };
  const handleFlightDelete = () => {
    if (!editingFlightId) return;
    setFlights((prev) => prev.filter((flight) => flight.id !== editingFlightId));
    closeFlightsModal();
  };
  const goToTripDay = (tripDayId?: string) => {
    if (!tripDayId) return;
    navigate(`/trips/${trip.id}/day/${tripDayId}`);
  };
  const handleDayKeyDown = (event: KeyboardEvent<HTMLDivElement>, tripDayId?: string) => {
    if (!tripDayId) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToTripDay(tripDayId);
    }
  };
  const handleDayBlur = (event: FocusEvent<HTMLDivElement>, hasReservations: boolean) => {
    if (!hasReservations) return;
    const next = event.relatedTarget as Node | null;
    if (!next || !event.currentTarget.contains(next)) {
      setActiveDayPopover(null);
    }
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
  const checklistPreview = tripChecklistItems.slice(0, 5);
  const reservationSortValue = (entry: ReservationEntry) => {
    const dateObject = parseDate(entry.date);
    if (entry.time) {
      const [hours, minutes] = entry.time.split(':').map((value) => Number(value));
      dateObject.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    }
    return dateObject.getTime();
  };
  const upcomingReservations = useMemo(
    () => [...reservations].sort((a, b) => reservationSortValue(a) - reservationSortValue(b)).slice(0, 5),
    [reservations]
  );
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, ReservationEntry[]>();
    reservations.forEach((entry) => {
      const iso = entry.date;
      const next = map.get(iso) ?? [];
      next.push(entry);
      map.set(iso, next);
    });
    return map;
  }, [reservations]);
  const getNextFlight = (direction: 'OUTBOUND' | 'INBOUND') => {
    const directionFlights = flights.filter((flight) => (flight.direction ?? 'OUTBOUND') === direction);
    if (!directionFlights.length) return undefined;
    const sorted = [...directionFlights].sort((a, b) => {
      const aTime = a.departureTime ? new Date(a.departureTime).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.departureTime ? new Date(b.departureTime).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
    const now = Date.now();
    const future = sorted.find((flight) => {
      const departureMillis = flight.departureTime ? new Date(flight.departureTime).getTime() : Number.MAX_SAFE_INTEGER;
      return departureMillis >= now;
    });
    return future ?? sorted[0];
  };
  const upcomingOutbound = useMemo(() => getNextFlight('OUTBOUND'), [flights]);
  const upcomingInbound = useMemo(() => getNextFlight('INBOUND'), [flights]);
  const resortDisplay = selectedResort || trip.homeResortOrHotel || 'Not set';
  const lodgingDatesLabel = `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;
  const groundTransportDisplay = groundTransport || 'Not set';
  const hasDiningPlan = Boolean(trip.diningPlan?.enabled);
  const heroStats = [
    { label: 'Trip length', value: `${tripLength} days` },
    { label: 'Park days planned', value: `${trip.parkDays.length}` },
    { label: 'Budget target', value: formatCurrency(trip.budgetTarget) }
  ];
  const renderFlightCard = (flight: TripFlightDetails | undefined, label: string) => {
    const isEmpty = !flight;
    const departureDate = flight?.departureTime ? formatDate(flight.departureTime) : 'Add departure';
    const arrivalDate = flight?.arrivalTime ? formatDate(flight.arrivalTime) : 'Add arrival';
    const departureTime = formatTimeLabel(flight?.departureTime);
    const arrivalTime = formatTimeLabel(flight?.arrivalTime);
    const travelers = flight?.travelers ?? [];
    return (
      <Card key={label} className={isEmpty ? 'flight-card flight-card--empty' : 'flight-card'}>
        <div className="flight-card__header">
          <div>
            <p className="flight-card__label">{label}</p>
            <h3>{flight?.airline ? `${flight.airline} ${flight.flightNumber ?? ''}` : 'Add airline'}</h3>
          </div>
          <span className="flight-card__direction">{flight?.direction === 'INBOUND' ? 'Inbound' : 'Outbound'}</span>
        </div>
        <div className="flight-card__body">
          <div className="flight-card__segment">
            <p className="flight-card__airport">{flight?.departureAirport || '---'}</p>
            <small>{departureDate}</small>
            <strong>{departureTime}</strong>
          </div>
          <div className="flight-card__divider">→</div>
          <div className="flight-card__segment">
            <p className="flight-card__airport">{flight?.arrivalAirport || '---'}</p>
            <small>{arrivalDate}</small>
            <strong>{arrivalTime}</strong>
          </div>
        </div>
        <div className="flight-card__footer">
          <span className="flight-card__confirmation">Conf {flight?.confirmationCode || '—'}</span>
          <div className="flight-passengers">
            {travelers.length === 0 && <span className="flight-passengers__placeholder">Add travelers</span>}
            {travelers.map((traveler) => (
              <span key={traveler} className="flight-passengers__avatar">
                {formatTravelerInitials(traveler)}
              </span>
            ))}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="trip-dashboard">
      <Card as="section" className="trip-hero-card" variant="tinted" padding="xl">
        <div className="trip-hero-card__layout">
          <div className="trip-hero-card__body">
            <p className="trip-hero__eyebrow">Trip overview</p>
            <h1>{trip.name}</h1>
            <p className="trip-hero__dates">{formatDateRange(trip.startDate, trip.endDate)}</p>
            <div className="trip-hero__summary">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
            <div className="trip-hero__countdown">{countdownLabel}</div>
            <div className="trip-hero__actions">
              <Button as={Link} to={dayPlannerLink} size="sm">
                Edit trip
              </Button>
              <button type="button" className="trip-hero__icon-button" onClick={openShareModal} aria-label="Share trip">
                <span aria-hidden="true">🔗</span>
              </button>
            </div>
          </div>
          <div className="trip-hero-card__media">
            <img
              src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80"
              alt="Disney castle fireworks over the park"
            />
          </div>
        </div>
      </Card>
      <div className="trip-dashboard__columns">
        <div className="trip-dashboard__column trip-dashboard__column--left">
          <Card as="section" className="trip-panel checklist-card">
            <div className="trip-panel__header">
              <div>
                <p className="trip-panel__eyebrow">Tickets &amp; prep</p>
                <h2>Trip checklist</h2>
                <p>High-level steps to stay on track.</p>
              </div>
            </div>
            <ul>
              {checklistPreview.map((item) => (
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
          </Card>
          <Card as="section" className="trip-panel lodging-summary-card">
            <div className="trip-panel__header">
              <div>
                <p className="trip-panel__eyebrow">Stay</p>
                <h2>Lodging summary</h2>
                <p>Where you’re staying each night.</p>
              </div>
            </div>
            <dl className="lodging-summary-card__details">
              <div>
                <dt>Resort / Hotel</dt>
                <dd>{resortDisplay}</dd>
              </div>
              <div>
                <dt>Room type</dt>
                <dd>{roomType}</dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>{lodgingDatesLabel}</dd>
              </div>
            </dl>
            <div className="lodging-summary-card__actions">
              <Button type="button" variant="ghost" size="sm" onClick={openLodgingModal}>
                Manage lodging
              </Button>
            </div>
          </Card>
        </div>
        <div className="trip-dashboard__column trip-dashboard__column--center">
          <Card as="section" className="trip-panel dining-card">
            <div className="trip-panel__header">
              <div>
                <p className="trip-panel__eyebrow">Dining &amp; plans</p>
                <h2>Dining &amp; reservations</h2>
                <p>Track ADRs and special experiences.</p>
              </div>
              <Button type="button" size="sm" onClick={openReservationModal}>
                Add reservation
              </Button>
            </div>
            {hasDiningPlan && (
              <p className="dining-card__credits">
                Dining plan credits remaining: {remainingDiningCredits} / {totalDiningCredits}
              </p>
            )}
            <p className="trip-panel__note">Upcoming reservations appear in the right column.</p>
            <Link className="text-link" to={dayPlannerLink}>
              View all reservations
            </Link>
          </Card>
        <Card as="section" className="trip-panel trip-calendar-card">
          <div className="trip-panel__header">
            <div>
              <p className="trip-panel__eyebrow">Park assignments</p>
              <h2>Park days</h2>
                <p>Snapshot of each day’s assigned park and priorities.</p>
              </div>
              {firstParkDay ? (
                <Button as={Link} to={`/trips/${trip.id}/day/${firstParkDay.id}`} variant="ghost" size="sm">
                  Plan next day
                </Button>
              ) : (
                <Button as={Link} to={`/trips/${trip.id}`} variant="ghost" size="sm">
                  Add park days
                </Button>
              )}
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
                  const dayReservations = reservationsByDate.get(day.iso) ?? [];
                  const hasReservations = dayReservations.length > 0;
                  const showPopover = hasReservations && activeDayPopover === day.iso;
                  if (!day.tripDay) {
                    return (
                      <div key={day.iso} className="calendar__cell calendar__cell--empty">
                        <span className="calendar__date muted">{displayDate}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={day.iso}
                      className={`calendar__cell${day.tripDay ? ' is-clickable' : ''}${hasReservations ? ' has-reservations' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${formatDate(day.iso)}${hasReservations ? `, ${dayReservations.length} reservations` : ''}`}
                      onClick={() => goToTripDay(day.tripDay?.id)}
                      onKeyDown={(event) => handleDayKeyDown(event, day.tripDay?.id)}
                      onMouseEnter={() => hasReservations && setActiveDayPopover(day.iso)}
                      onMouseLeave={() => hasReservations && setActiveDayPopover(null)}
                      onFocus={() => hasReservations && setActiveDayPopover(day.iso)}
                      onBlur={(event) => handleDayBlur(event, hasReservations)}
                    >
                      <header>
                        <span className="calendar__date">{displayDate}</span>
                        <span className="calendar__park">{day.tripDay.park === 'UNSET' ? 'Set park' : day.tripDay.park}</span>
                      </header>
                      <p className="calendar__notes">{day.tripDay.notes ?? 'No notes yet.'}</p>
                      <footer>
                        <span>{day.tripDay.timeBlocks.length} blocks</span>
                      </footer>
                      {hasReservations && <span className="calendar__marker">{dayReservations.length}</span>}
                      {showPopover && (
                        <div className="calendar-popover">
                          <p>Reservations</p>
                          <ul>
                            {dayReservations.map((entry) => (
                              <li key={entry.id}>
                                <span>{formatTimeLabel(entry.time)}</span>
                                <div>
                                  <strong>{entry.name}</strong>
                                  <small>{getReservationTypeLabel(entry)}</small>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
        <Card as="section" className="trip-panel flights-board-card">
          <div className="trip-panel__header">
            <div>
              <p className="trip-panel__eyebrow">Flights &amp; transport</p>
              <h2>Upcoming flights</h2>
              <p>Boarding pass view of your next legs.</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => openFlightsModal()}>
              View all flights
            </Button>
          </div>
          <div className="flight-card-grid">
            {renderFlightCard(upcomingOutbound, 'Next outbound')}
            {renderFlightCard(upcomingInbound, 'Next return')}
          </div>
          <label className="ground-transport-field">
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
        </Card>
      </div>
        <div className="trip-dashboard__column trip-dashboard__column--right">
          <Card as="section" className="trip-panel reservation-highlights">
            <div className="trip-panel__header">
              <div>
                <p className="trip-panel__eyebrow">Upcoming reservations</p>
                <h2>Next experiences</h2>
              </div>
              <Link className="text-link" to={dayPlannerLink}>
                View all
              </Link>
            </div>
            <ul className="reservation-list reservation-list--compact">
              {upcomingReservations.length === 0 && <li className="empty-state">No reservations yet.</li>}
              {upcomingReservations.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <p>{entry.name}</p>
                    <small>
                      {formatDate(entry.date)} · {formatTimeLabel(entry.time)} · {getReservationTypeLabel(entry)}
                    </small>
                  </div>
                  <div className="reservation-list__meta">
                    <span className="reservation-tag" data-park={entry.park ?? parkTagFallback}>
                      {entry.park ?? '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card as="section" className="trip-panel travel-glance-card">
            <div className="trip-panel__header">
              <div>
                <p className="trip-panel__eyebrow">At a glance</p>
                <h2>Trip notes</h2>
              </div>
            </div>
            <dl className="travel-glance-card__list">
              <div>
                <dt>Ground transport</dt>
                <dd>{groundTransportDisplay}</dd>
              </div>
              <div>
                <dt>Dining plan</dt>
                <dd>{hasDiningPlan ? `${remainingDiningCredits} of ${totalDiningCredits} credits left` : 'No dining plan'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
      {isReservationModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <Card as="form" className="reservation-modal" onSubmit={handleReservationSubmit}>
            <div className="trip-card__header">
              <div>
                <h2>Add reservation</h2>
                <p>Track dining or experience bookings.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeReservationModal}>
                Close
              </Button>
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
                  ? `${reservationForm.serviceType === 'QUICK' ? 'Quick-service' : 'Table-service'} • ${reservationForm.location || 'Location pending'}`
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
                This reservation uses {reservationForm.credits ?? 0} credit{(reservationForm.credits ?? 0) === 1 ? '' : 's'}. Remaining after save: {projectedRemainingCredits}
              </p>
            )}
            <div className="reservation-modal__actions">
              <Button type="button" variant="ghost" onClick={closeReservationModal}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </Card>
        </div>
      )}
      {isShareModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <Card as="form" className="share-modal" onSubmit={handleInviteSubmit}>
            <div className="trip-card__header">
              <div>
                <h2>Share trip</h2>
                <p>Invite collaborators to view or edit.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeShareModal}>
                Close
              </Button>
            </div>
            <div className="sharing-form">
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
              <Button type="submit" size="sm">
                Send invite
              </Button>
            </div>
            {invites.length > 0 && (
              <div className="table-scroll">
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
              </div>
            )}
          </Card>
        </div>
      )}
      {isLodgingModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <Card as="section" className="lodging-modal">
            <div className="trip-panel__header">
              <div>
                <p className="trip-panel__eyebrow">Stay</p>
                <h2>Manage lodging</h2>
                <p>Update resort, room type, and DVC usage.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeLodgingModal}>
                Close
              </Button>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const nights = tripLength;
                      const nightlyPoints = Array.from({ length: nights }, (_, idx) => 15 + idx * 2);
                      const totalPoints = nightlyPoints.reduce((sum, points) => sum + points, 0);
                      setDvcQuote({ nightly: nightlyPoints, total: totalPoints });
                    }}
                  >
                    Calculate DVC points
                  </Button>
                )}
              </>
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
          </Card>
        </div>
      )}
      {isFlightsModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <Card as="section" className="flights-modal">
            <div className="trip-panel__header">
              <div>
                <p className="trip-panel__eyebrow">Flights</p>
                <h2>Manage flights</h2>
                <p>Add or edit each flight leg.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeFlightsModal}>
                Close
              </Button>
            </div>
            <div className="flights-modal__content">
              <div className="flights-modal__list">
                <div className="flights-modal__list-header">
                  <p>Saved flights</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => openFlightsModal()}>
                    Add flight
                  </Button>
                </div>
                {flights.length === 0 && <p>No flights saved yet.</p>}
                {flights.length > 0 && (
                  <ul>
                    {flights.map((flight) => (
                      <li key={flight.id}>
                        <button type="button" onClick={() => openFlightsModal(flight)}>
                          {(flight.direction === 'INBOUND' ? 'Inbound' : 'Outbound')}{' '}
                          · {flight.airline ?? 'Airline'} {flight.flightNumber ?? ''}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <form className="flights-modal__form" onSubmit={handleFlightSave}>
                <label>
                  <span>Direction</span>
                  <select
                    value={flightForm.direction ?? 'OUTBOUND'}
                    onChange={(event) => handleFlightFormChange('direction', event.target.value)}
                  >
                    <option value="OUTBOUND">Outbound</option>
                    <option value="INBOUND">Inbound</option>
                  </select>
                </label>
                <label>
                  <span>Airline</span>
                  <input type="text" value={flightForm.airline ?? ''} onChange={(event) => handleFlightFormChange('airline', event.target.value)} />
                </label>
                <label>
                  <span>Flight number</span>
                  <input
                    type="text"
                    value={flightForm.flightNumber ?? ''}
                    onChange={(event) => handleFlightFormChange('flightNumber', event.target.value)}
                  />
                </label>
                <label>
                  <span>Departure airport</span>
                  <input
                    type="text"
                    value={flightForm.departureAirport ?? ''}
                    onChange={(event) => handleFlightFormChange('departureAirport', event.target.value)}
                  />
                </label>
                <label>
                  <span>Departure time</span>
                  <input
                    type="datetime-local"
                    value={flightForm.departureTime ?? ''}
                    onChange={(event) => handleFlightFormChange('departureTime', event.target.value)}
                  />
                </label>
                <label>
                  <span>Arrival airport</span>
                  <input
                    type="text"
                    value={flightForm.arrivalAirport ?? ''}
                    onChange={(event) => handleFlightFormChange('arrivalAirport', event.target.value)}
                  />
                </label>
                <label>
                  <span>Arrival time</span>
                  <input
                    type="datetime-local"
                    value={flightForm.arrivalTime ?? ''}
                    onChange={(event) => handleFlightFormChange('arrivalTime', event.target.value)}
                  />
                </label>
                <label>
                  <span>Confirmation code</span>
                  <input
                    type="text"
                    value={flightForm.confirmationCode ?? ''}
                    onChange={(event) => handleFlightFormChange('confirmationCode', event.target.value)}
                  />
                </label>
                <label>
                  <span>Travelers</span>
                  <input
                    type="text"
                    placeholder="Comma separated"
                    value={flightForm.travelers?.join(', ') ?? ''}
                    onChange={(event) => handleFlightTravelerChange(event.target.value)}
                  />
                </label>
                <div className="flights-modal__actions">
                  {editingFlightId && (
                    <Button type="button" variant="ghost" onClick={handleFlightDelete}>
                      Remove flight
                    </Button>
                  )}
                  <Button type="submit">Save flight</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TripDashboardPage;
