import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { trips } from '../data/sampleData';
import { formatDate } from '../utils/date';
import '../styles/page-sections.css';
import { Trip } from '../types';

type FamilyMember = {
  id: string;
  name: string;
  color: string;
};

type FamilyModeEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  persons: string[];
  notes?: string;
  source: 'reservation' | 'custom';
  reservationId?: string;
};

const familyMembers: FamilyMember[] = [
  { id: 'logan', name: 'Logan', color: '#f97316' },
  { id: 'ava', name: 'Ava', color: '#8b5cf6' },
  { id: 'mason', name: 'Mason', color: '#0ea5e9' },
  { id: 'family', name: 'Family', color: '#10b981' }
];

const eventTypeOptions = [
  { value: 'RIDE', label: 'Rides' },
  { value: 'DINING', label: 'Dining' },
  { value: 'BREAK', label: 'Breaks' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'CUSTOM', label: 'Family event' }
];

const hourStart = 7;
const hourEnd = 22;
const minutesTotal = (hourEnd - hourStart) * 60;

const parseTimeToMinutes = (value: string, fallback = hourStart * 60) => {
  if (!value) return fallback;
  const [hours, mins] = value.split(':').map((segment) => Number(segment));
  if (Number.isNaN(hours) || Number.isNaN(mins)) return fallback;
  return hours * 60 + mins;
};

const generateId = () => `family-event-${Math.random().toString(36).slice(2, 9)}`;

const buildEventsFromTrip = (trip: Trip): FamilyModeEvent[] => {
  const events: FamilyModeEvent[] = [];
  trip.parkDays.forEach((day) => {
    day.timeBlocks.forEach((block) => {
      block.activities.forEach((activity) => {
        if (!activity.startTime) return;
        const startMinutes = parseTimeToMinutes(activity.startTime);
        const endMinutes = activity.endTime ? parseTimeToMinutes(activity.endTime) : startMinutes + 60;
        const ensureTime = (minutes: number) => {
          const hour = String(Math.max(0, Math.floor(minutes / 60))).padStart(2, '0');
          const minute = String(minutes % 60).padStart(2, '0');
          return `${hour}:${minute}`;
        };
        events.push({
          id: `${activity.id}-family`,
          title: activity.name,
          date: day.date,
          startTime: ensureTime(startMinutes),
          endTime: ensureTime(endMinutes),
          type: activity.type === 'ADR' ? 'DINING' : activity.type === 'NOTE' ? 'BREAK' : activity.type,
          persons: ['family'],
          notes: activity.notes,
          source: 'reservation',
          reservationId: activity.id
        });
      });
    });
  });
  return events;
};

const buildCalendarMatrix = (seed: Date) => {
  const monthStart = new Date(seed.getFullYear(), seed.getMonth(), 1);
  const monthEnd = new Date(seed.getFullYear(), seed.getMonth() + 1, 0);
  const firstVisible = new Date(monthStart);
  firstVisible.setDate(firstVisible.getDate() - firstVisible.getDay());
  const lastVisible = new Date(monthEnd);
  lastVisible.setDate(lastVisible.getDate() + (6 - lastVisible.getDay()));

  const days: Array<{ date: Date; iso: string; inMonth: boolean }> = [];
  for (let cursor = new Date(firstVisible); cursor <= lastVisible; cursor.setDate(cursor.getDate() + 1)) {
    const cell = new Date(cursor);
    days.push({
      date: cell,
      iso: cell.toISOString().split('T')[0],
      inMonth: cell.getMonth() === seed.getMonth()
    });
  }
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
};

const TripFamilyModePage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const trip = trips.find((item) => item.id === tripId) ?? trips[0];
  const fallbackDate = trip?.startDate ?? new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(fallbackDate);
  const [viewMode, setViewMode] = useState<'DAILY' | 'WEEKLY'>('WEEKLY');
  const [events, setEvents] = useState<FamilyModeEvent[]>(() => [
    ...buildEventsFromTrip(trip),
    {
      id: generateId(),
      title: 'Pool time',
      date: trip.startDate,
      startTime: '14:00',
      endTime: '15:30',
      type: 'BREAK',
      persons: ['ava', 'mason'],
      source: 'custom',
      notes: 'Bring floaties'
    }
  ]);
  const [filters, setFilters] = useState({
    members: familyMembers.map((member) => member.id),
    types: eventTypeOptions.map((option) => option.value)
  });
  const [eventModal, setEventModal] = useState<{ open: boolean; data: FamilyModeEvent | null }>(() => ({ open: false, data: null }));

  const selectedDateObj = new Date(selectedDate);
  const calendarWeeks = useMemo(() => buildCalendarMatrix(selectedDateObj), [selectedDateObj]);

  const startOfWeek = useMemo(() => {
    const day = selectedDateObj.getDay();
    const clone = new Date(selectedDateObj);
    clone.setDate(clone.getDate() - day);
    return clone;
  }, [selectedDateObj]);
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return {
      date,
      iso: date.toISOString().split('T')[0],
      label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    };
  });

  const filteredEvents = useMemo(() => {
    return events.filter((event) => filters.members.some((member) => event.persons.includes(member)) && filters.types.includes(event.type));
  }, [events, filters]);

  const dayEventsMap = useMemo(() => {
    const map = new Map<string, FamilyModeEvent[]>();
    filteredEvents.forEach((eventItem) => {
      const bucket = map.get(eventItem.date) ?? [];
      bucket.push(eventItem);
      map.set(eventItem.date, bucket);
    });
    map.forEach((items) => items.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)));
    return map;
  }, [filteredEvents]);

  const handleMemberToggle = (memberId: string) => {
    setFilters((prev) => {
      const nextMembers = prev.members.includes(memberId)
        ? prev.members.filter((id) => id !== memberId)
        : [...prev.members, memberId];
      return { ...prev, members: nextMembers };
    });
  };

  const handleTypeToggle = (type: string) => {
    setFilters((prev) => {
      const nextTypes = prev.types.includes(type) ? prev.types.filter((item) => item !== type) : [...prev.types, type];
      return { ...prev, types: nextTypes };
    });
  };

  const openEventModal = (eventData?: FamilyModeEvent) => {
    if (eventData) {
      setEventModal({ open: true, data: eventData });
      return;
    }
    setEventModal({
      open: true,
      data: {
        id: generateId(),
        title: 'New event',
        date: selectedDate,
        startTime: '09:00',
        endTime: '10:00',
        type: 'CUSTOM',
        persons: [familyMembers[0]?.id ?? 'family'],
        source: 'custom'
      }
    });
  };

  const closeEventModal = () => setEventModal({ open: false, data: null });

  const handleGridClick = (dayIso: string, clickY: number, columnHeight: number) => {
    const ratio = Math.min(Math.max(clickY / columnHeight, 0), 1);
    const minutesFromStart = Math.round((minutesTotal * ratio) / 30) * 30;
    const startMinutes = hourStart * 60 + minutesFromStart;
    const endMinutes = startMinutes + 60;
    const buildTime = (minutes: number) => {
      const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
      const minute = String(minutes % 60).padStart(2, '0');
      return `${hour}:${minute}`;
    };
    const newEvent: FamilyModeEvent = {
      id: generateId(),
      title: 'New event',
      date: dayIso,
      startTime: buildTime(startMinutes),
      endTime: buildTime(endMinutes),
      type: 'CUSTOM',
      persons: [familyMembers[0]?.id ?? 'family'],
      source: 'custom'
    };
    setEventModal({ open: true, data: newEvent });
  };

  const saveEvent = (eventData: FamilyModeEvent) => {
    setEvents((prev) => {
      const exists = prev.some((item) => item.id === eventData.id);
      return exists ? prev.map((item) => (item.id === eventData.id ? eventData : item)) : [...prev, eventData];
    });
    closeEventModal();
  };

  const deleteEvent = (eventId?: string) => {
    if (!eventId) return;
    setEvents((prev) => prev.filter((item) => item.id !== eventId));
    closeEventModal();
  };

  const renderDailyView = () => {
    const dayEvents = dayEventsMap.get(selectedDate) ?? [];
    return (
      <div className="family-daily-view">
        {dayEvents.length === 0 && <p className="empty-state">No events for this day.</p>}
        {dayEvents.map((eventItem) => (
          <button key={eventItem.id} type="button" className="family-event-card" onClick={() => openEventModal(eventItem)}>
            <span className="family-event-card__time">
              {eventItem.startTime} – {eventItem.endTime}
            </span>
            <strong>{eventItem.title}</strong>
            <small>{eventItem.type}</small>
          </button>
        ))}
      </div>
    );
  };

  const renderWeeklyView = () => {
    return (
      <div className="family-weekly-grid">
        <div className="family-weekly-grid__times">
          {Array.from({ length: hourEnd - hourStart }).map((_, index) => {
            const hour = hourStart + index;
            const label = new Date().setHours(hour, 0, 0, 0);
            return (
              <span key={hour}>
                {new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(label)}
              </span>
            );
          })}
        </div>
        <div className="family-weekly-grid__columns">
          {weekDays.map((day) => (
            <div
              key={day.iso}
              className="family-weekly-column"
              onClick={(event) => {
                const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                handleGridClick(day.iso, event.clientY - bounds.top, bounds.height);
              }}
            >
              <header>
                <span>{day.label.split(' ')[0]}</span>
                <strong>{day.date.getDate()}</strong>
              </header>
              <div className="family-weekly-column__body">
                {(dayEventsMap.get(day.iso) ?? []).map((eventItem) => {
                  const startMinutes = parseTimeToMinutes(eventItem.startTime, hourStart * 60);
                  const endMinutes = parseTimeToMinutes(eventItem.endTime, startMinutes + 60);
                  const top = ((startMinutes - hourStart * 60) / minutesTotal) * 100;
                  const height = Math.max(((endMinutes - startMinutes) / minutesTotal) * 100, 8);
                  const member = familyMembers.find((mem) => eventItem.persons.includes(mem.id)) ?? familyMembers[familyMembers.length - 1];
                  return (
                    <button
                      key={eventItem.id}
                      type="button"
                      className="family-calendar__event"
                      style={{ top: `${top}%`, height: `${height}%`, background: member.color }}
                      onClick={(event) => {
                        event.stopPropagation();
                        openEventModal(eventItem);
                      }}
                    >
                      <span>{eventItem.startTime}</span>
                      <strong>{eventItem.title}</strong>
                      <small>{eventItem.type}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!trip) {
    return (
      <div className="trip-dashboard">
        <Card>
          <p>No trip selected.</p>
          <Button as={Link} to="/trips">
            Back to trips
          </Button>
        </Card>
      </div>
    );
  }

  const handleModalSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventModal.open || !eventModal.data) return;
    saveEvent(eventModal.data);
  };

  return (
    <div className="family-mode">
      <aside className="family-mode__sidebar">
        <Card className="family-calendar-picker">
          <div className="family-calendar-picker__header">
            <p>{selectedDateObj.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="mini-calendar">
            <div className="mini-calendar__weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="mini-calendar__grid">
              {calendarWeeks.map((week, index) => (
                <div className="mini-calendar__row" key={index}>
                  {week.map((day) => (
                    <button
                      key={day.iso}
                      type="button"
                      className={`mini-calendar__day${day.iso === selectedDate ? ' is-in-range' : ''}${!day.inMonth ? ' is-muted' : ''}`}
                      onClick={() => setSelectedDate(day.iso)}
                    >
                      {day.date.getDate()}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="family-filters">
          <h3>Family filters</h3>
          <div className="family-filter-group">
            <p>Members</p>
            {familyMembers.map((member) => (
              <label key={member.id}>
                <input type="checkbox" checked={filters.members.includes(member.id)} onChange={() => handleMemberToggle(member.id)} />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
          <div className="family-filter-group">
            <p>Activities</p>
            {eventTypeOptions.map((option) => (
              <label key={option.value}>
                <input type="checkbox" checked={filters.types.includes(option.value)} onChange={() => handleTypeToggle(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </Card>
      </aside>
      <section className="family-mode__main">
        <div className="family-mode__toolbar">
          <div>
            <p>Family calendar</p>
            <h2>{selectedDateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</h2>
          </div>
          <div className="family-mode__actions">
            <div className="view-toggle">
              {['DAILY', 'WEEKLY'].map((mode) => (
                <button key={mode} type="button" className={viewMode === mode ? 'is-active' : ''} onClick={() => setViewMode(mode as 'DAILY' | 'WEEKLY')}>
                  {mode === 'DAILY' ? 'Daily' : 'Weekly'}
                </button>
              ))}
            </div>
            <Button type="button" onClick={() => openEventModal()}>
              Create event
            </Button>
          </div>
        </div>
        <Card className="family-mode__schedule">
          {viewMode === 'DAILY' ? renderDailyView() : renderWeeklyView()}
        </Card>
      </section>
      {eventModal.open && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <Card as="form" className="family-event-modal" onSubmit={handleModalSave}>
            <div className="trip-card__header">
              <div>
                <h2>{eventModal.data ? 'Edit event' : 'Create event'}</h2>
                <p>Adjust details for the family schedule.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeEventModal}>
                Close
              </Button>
            </div>
            <div className="family-event-modal__grid">
              <label>
                <span>Title</span>
                <input
                  type="text"
                  value={eventModal.data?.title ?? ''}
                  onChange={(event) => setEventModal((prev) => ({
                    ...prev,
                    data: prev.data ? { ...prev.data, title: event.target.value } : null
                  }))}
                  required
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={eventModal.data?.date ?? selectedDate}
                  onChange={(event) => setEventModal((prev) => ({
                    ...prev,
                    data: prev.data ? { ...prev.data, date: event.target.value } : null
                  }))}
                  required
                />
              </label>
              <label>
                <span>Start time</span>
                <input
                  type="time"
                  value={eventModal.data?.startTime ?? '09:00'}
                  onChange={(event) => setEventModal((prev) => ({
                    ...prev,
                    data: prev.data ? { ...prev.data, startTime: event.target.value } : null
                  }))}
                  required
                />
              </label>
              <label>
                <span>End time</span>
                <input
                  type="time"
                  value={eventModal.data?.endTime ?? '10:00'}
                  onChange={(event) => setEventModal((prev) => ({
                    ...prev,
                    data: prev.data ? { ...prev.data, endTime: event.target.value } : null
                  }))}
                  required
                />
              </label>
              <label>
                <span>Type</span>
                <select
                  value={eventModal.data?.type ?? 'CUSTOM'}
                  onChange={(event) => setEventModal((prev) => ({
                    ...prev,
                    data: prev.data ? { ...prev.data, type: event.target.value } : null
                  }))}
                >
                  {eventTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Person</span>
                <select
                  value={eventModal.data?.persons?.[0] ?? familyMembers[0]?.id}
                  onChange={(event) => setEventModal((prev) => ({
                    ...prev,
                    data: prev.data ? { ...prev.data, persons: [event.target.value] } : null
                  }))}
                >
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="family-event-modal__notes">
                <span>Notes</span>
                <textarea
                  value={eventModal.data?.notes ?? ''}
                  onChange={(event) => setEventModal((prev) => ({
                    ...prev,
                    data: prev.data ? { ...prev.data, notes: event.target.value } : null
                  }))}
                />
              </label>
            </div>
            <div className="family-event-modal__actions">
              {eventModal.data?.source === 'custom' && (
                <Button type="button" variant="ghost" onClick={() => deleteEvent(eventModal.data?.id)}>
                  Delete
                </Button>
              )}
              <Button type="submit">Save</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TripFamilyModePage;
