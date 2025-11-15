import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import restaurantOptionsData from '../data/restaurants.json';
import rideOptionsData from '../data/rides.json';
import { trips } from '../data/sampleData';
import { Activity, ActivityType, ParkCode, TimeBlockLabel, TripDay } from '../types';
import { formatDate } from '../utils/date';
import '../styles/page-sections.css';

const parkOptions = ['MK', 'EPCOT', 'HS', 'AK', 'OFFSITE', 'UNSET'];
const typeOptions: Array<{ label: string; value: 'RIDE' | 'DINING' | 'SHOW' | 'CHARACTER' | 'NOTE' | 'OTHER' }> = [
  { label: 'Ride', value: 'RIDE' },
  { label: 'Dining', value: 'DINING' },
  { label: 'Show', value: 'SHOW' },
  { label: 'Character', value: 'CHARACTER' },
  { label: 'Note', value: 'NOTE' },
  { label: 'Other', value: 'OTHER' }
];
type RestaurantOption = { id: string; name: string; location: string };
const restaurantOptions: RestaurantOption[] = restaurantOptionsData as RestaurantOption[];
type RideOption = { id: string; name: string; park: ParkCode; geniePlus: boolean; heightRequirement: string };
const rideOptions: RideOption[] = rideOptionsData as RideOption[];
const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const minuteOptions = ['00', '15', '30', '45'];
const scheduleBlueprint: Array<{ label: TimeBlockLabel; display: string }> = [
  { label: 'BREAKFAST', display: 'Breakfast' },
  { label: 'MORNING', display: 'Morning' },
  { label: 'LUNCH', display: 'Lunch' },
  { label: 'AFTERNOON', display: 'Afternoon' },
  { label: 'DINNER', display: 'Dinner' },
  { label: 'EVENING', display: 'Evening' },
  { label: 'SNACKS', display: 'Snacks' }
];
const displayLabelMap = new Map(scheduleBlueprint.map((item) => [item.label, item.display]));
const getRideOptionsForPark = (park: ParkCode) =>
  park === 'UNSET' || park === 'OFFSITE' ? rideOptions : rideOptions.filter((ride) => ride.park === park);
const ensureBlocks = (tripDay: TripDay): TripDay => {
  const normalizedBlocks = scheduleBlueprint.map(({ label }, index) => {
    const existing = tripDay.timeBlocks.find((block) => block.label === label);
    if (existing) {
      return { ...existing, sortOrder: index + 1 };
    }
    return {
      id: `${tripDay.id}-${label.toLowerCase()}`,
      tripDayId: tripDay.id,
      label,
      sortOrder: index + 1,
      activities: []
    };
  });
  return { ...tripDay, timeBlocks: normalizedBlocks };
};

type DayPeriod = 'AM' | 'PM';

const parseTimeToEditor = (time?: string): { hour: string; minute: string; period: DayPeriod } => {
  if (!time) {
    return { hour: '08', minute: '00', period: 'AM' };
  }
  const [hourStr, minute = '00'] = time.split(':');
  let hourNum = Number(hourStr);
  const period: DayPeriod = hourNum >= 12 ? 'PM' : 'AM';
  hourNum = hourNum % 12;
  if (hourNum === 0) hourNum = 12;
  return { hour: String(hourNum).padStart(2, '0'), minute, period };
};

const mapExistingType = (type?: string): 'RIDE' | 'DINING' | 'SHOW' | 'CHARACTER' | 'NOTE' | 'OTHER' => {
  if (!type) return 'NOTE';
  if (type === 'ADR' || type === 'DINING') return 'DINING';
  if (type === 'RIDE' || type === 'SHOW' || type === 'NOTE') return type as 'RIDE' | 'SHOW' | 'NOTE';
  return 'OTHER';
};
const mapUiTypeToActivityType = (type: 'RIDE' | 'DINING' | 'SHOW' | 'CHARACTER' | 'NOTE' | 'OTHER'): ActivityType => {
  switch (type) {
    case 'DINING':
      return 'ADR';
    case 'RIDE':
      return 'RIDE';
    case 'SHOW':
      return 'SHOW';
    case 'NOTE':
      return 'NOTE';
    default:
      return 'OTHER';
  }
};

const TripDayPlannerPage = () => {
  const { tripId, dayId } = useParams();
  const trip = trips.find((item) => item.id === tripId) ?? trips[0];
  const selectedDay = useMemo(() => trip.parkDays.find((day) => day.id === dayId) ?? trip.parkDays[0], [dayId, trip]);
  const normalizedDay = useMemo(() => ensureBlocks(selectedDay), [selectedDay]);
  const [day, setDay] = useState<TripDay>(normalizedDay);
  const [geniePlan, setGeniePlan] = useState<string>(normalizedDay.notes ?? '');
  const [dayNotes, setDayNotes] = useState<string>(normalizedDay.notes ?? '');
  useEffect(() => {
    setDay(normalizedDay);
    setGeniePlan(normalizedDay.notes ?? '');
    setDayNotes(normalizedDay.notes ?? '');
  }, [normalizedDay]);
  const rideOptionsForSelectedPark = useMemo(() => getRideOptionsForPark(day.park), [day.park]);
  const parkHours = useMemo(() => {
    switch (day.park) {
      case 'MK':
        return 'Magic Kingdom · 8:30 AM – 10:00 PM';
      case 'EPCOT':
        return 'EPCOT · 9:00 AM – 9:00 PM';
      case 'HS':
        return 'Hollywood Studios · 8:30 AM – 9:30 PM';
      case 'AK':
        return "Animal Kingdom · 8:00 AM – 7:00 PM";
      default:
        return 'Hours TBD';
    }
  }, [day.park]);

  const handleParkChange = (value: string) => setDay((prev) => ({ ...prev, park: value as TripDay['park'] }));

  const [noteComposer, setNoteComposer] = useState<{
    blockId: string;
    blockLabel: TimeBlockLabel;
    text: string;
    hour: string;
    minute: string;
    period: 'AM' | 'PM';
    type: 'RIDE' | 'DINING' | 'SHOW' | 'CHARACTER' | 'NOTE' | 'OTHER';
    existingActivityId?: string;
    timeDirty: boolean;
    referenceId?: string;
    useGeniePlus: boolean;
    isMustDo: boolean;
  } | null>(null);
  const activeBlock = noteComposer ? day.timeBlocks.find((block) => block.id === noteComposer.blockId) : null;

  const openNoteComposer = (block: { id: string; label: TimeBlockLabel }, existing?: Activity) => {
    const { hour, minute, period } = parseTimeToEditor(existing?.startTime);
    setNoteComposer({
      blockId: block.id,
      blockLabel: block.label,
      text: existing?.name ?? '',
      hour,
      minute,
      period,
      type: mapExistingType(existing?.type),
      existingActivityId: existing?.id,
      timeDirty: !existing,
      referenceId:
        mapExistingType(existing?.type) === 'DINING'
          ? restaurantOptions.find((option) => option.name.toLowerCase() === (existing?.name ?? '').toLowerCase())?.id
        : mapExistingType(existing?.type) === 'RIDE'
            ? rideOptions.find((option) => option.name.toLowerCase() === (existing?.name ?? '').toLowerCase())?.id
            : undefined,
      useGeniePlus: existing?.useGeniePlus ?? false,
      isMustDo: existing?.isMustDo ?? false
    });
  };
  const closeNoteComposer = () => setNoteComposer(null);

  const handleSaveNote = () => {
    if (!noteComposer?.text) return;
    const existingActivity =
      noteComposer.existingActivityId && activeBlock
        ? activeBlock.activities.find((activity) => activity.id === noteComposer.existingActivityId)
        : null;
    const hourNum = Number(noteComposer.hour);
    const normalizedHour = Number.isNaN(hourNum) ? 12 : Math.max(1, Math.min(12, hourNum));
    let hour24 = normalizedHour % 12;
    if (noteComposer.period === 'PM') hour24 += 12;
    if (noteComposer.period === 'AM' && normalizedHour === 12) hour24 = 0;
    const formattedHour = hour24.toString().padStart(2, '0');
    const formattedTime = `${formattedHour}:${noteComposer.minute}`;
    const mappedType = mapUiTypeToActivityType(noteComposer.type);
    const shouldUpdateTime = noteComposer.timeDirty || !noteComposer.existingActivityId;
    const resolvedTime = shouldUpdateTime ? formattedTime : existingActivity?.startTime;

    setDay((prev) => {
      const baseDay = ensureBlocks(prev);
      const nextBlocks = baseDay.timeBlocks.map((block) =>
        block.id === noteComposer.blockId
          ? {
              ...block,
              activities: noteComposer.existingActivityId
                ? block.activities.map((activity) =>
                    activity.id === noteComposer.existingActivityId
                      ? {
                          ...activity,
                          type: mappedType,
                          name: noteComposer.text,
                          startTime: resolvedTime,
                          isMustDo: noteComposer.isMustDo,
                          useGeniePlus: noteComposer.useGeniePlus
                        }
                      : activity
                  )
                : [
                    ...block.activities,
                    {
                      id: `${block.id}-${Date.now()}`,
                      timeBlockId: block.id,
                      type: mappedType,
                      name: noteComposer.text,
                      startTime: resolvedTime,
                      isMustDo: noteComposer.isMustDo,
                      useGeniePlus: noteComposer.useGeniePlus
                    }
                  ]
            }
          : block
      );
      return { ...baseDay, timeBlocks: nextBlocks };
    });
    closeNoteComposer();
  };
  const handleTypeChange = (value: (typeof typeOptions)[number]['value']) => {
    setNoteComposer((prev) => {
      if (!prev) return prev;
      if (prev.type === value) return prev;
      let nextReference: string | undefined;
      let nextText = prev.text;
      let nextUseGeniePlus = value === 'RIDE' ? prev.useGeniePlus : false;
      let nextIsMustDo = value === 'RIDE' ? prev.isMustDo : false;
      if (value === 'RIDE') {
        const existingOption = rideOptions.find((ride) => ride.id === prev.referenceId);
        const fallback = existingOption ?? rideOptionsForSelectedPark[0];
        nextReference = fallback?.id;
        if (!prev.text || prev.type !== 'RIDE') nextText = fallback?.name ?? '';
        nextUseGeniePlus = fallback?.geniePlus ?? false;
        nextIsMustDo = prev.isMustDo;
      } else if (value === 'DINING') {
        const existingRestaurant = restaurantOptions.find((restaurant) => restaurant.id === prev.referenceId);
        const fallback = existingRestaurant ?? restaurantOptions[0];
        nextReference = fallback?.id;
        if (!prev.text || prev.type !== 'DINING') nextText = fallback?.name ?? '';
      } else {
        nextReference = undefined;
      }
      return { ...prev, type: value, referenceId: nextReference, text: nextText, useGeniePlus: nextUseGeniePlus, isMustDo: nextIsMustDo };
    });
  };
  const handleRideSelect = (value: string) => {
    setNoteComposer((prev) => {
      if (!prev) return prev;
      if (value === 'custom' || value === '') {
        return { ...prev, referenceId: undefined };
      }
      const ride = rideOptions.find((option) => option.id === value);
      if (!ride) return prev;
      return { ...prev, referenceId: ride.id, text: ride.name, useGeniePlus: ride.geniePlus };
    });
  };
  const handleRestaurantSelect = (value: string) => {
    setNoteComposer((prev) => {
      if (!prev) return prev;
      if (value === 'custom' || value === '') {
        return { ...prev, referenceId: undefined };
      }
      const restaurant = restaurantOptions.find((option) => option.id === value);
      if (!restaurant) return prev;
      return { ...prev, referenceId: restaurant.id, text: restaurant.name };
    });
  };
  const renderTypeSpecificFields = () => {
    if (!noteComposer) return null;
    if (noteComposer.type === 'RIDE') {
      const ridesForPark = rideOptionsForSelectedPark.length ? rideOptionsForSelectedPark : rideOptions;
      const selectedRide = rideOptions.find((ride) => ride.id === noteComposer.referenceId);
      const genieAvailable = selectedRide ? selectedRide.geniePlus : true;
      return (
        <>
          <label className="day-overview-card__field">
            <span>Ride</span>
            <select value={noteComposer.referenceId ?? ''} onChange={(event) => handleRideSelect(event.target.value)}>
              <option value="">Select ride</option>
              {ridesForPark.map((ride) => (
                <option key={ride.id} value={ride.id}>
                  {ride.name}
                </option>
              ))}
              <option value="custom">Custom ride</option>
            </select>
          </label>
          {selectedRide && (
            <p className="form-hint">
              Height requirement: {selectedRide.heightRequirement} •{' '}
              {selectedRide.geniePlus ? 'Genie+ available' : 'Genie+ not offered'}
            </p>
          )}
          <div className="checkbox-grid">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={genieAvailable ? noteComposer.useGeniePlus : false}
                disabled={!genieAvailable}
                onChange={(event) =>
                  setNoteComposer((prev) => (prev ? { ...prev, useGeniePlus: event.target.checked } : prev))
                }
              />
              <span>Use Genie+</span>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={noteComposer.isMustDo}
                onChange={(event) => setNoteComposer((prev) => (prev ? { ...prev, isMustDo: event.target.checked } : prev))}
              />
              <span>Must-do</span>
            </label>
          </div>
        </>
      );
    }
    if (noteComposer.type === 'DINING') {
      return (
        <>
          <label className="day-overview-card__field">
            <span>Restaurant</span>
            <select
              value={noteComposer.referenceId ?? ''}
              onChange={(event) => handleRestaurantSelect(event.target.value)}
            >
              <option value="">Select restaurant</option>
              {restaurantOptions.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
              <option value="custom">Custom dining</option>
            </select>
          </label>
          {noteComposer.referenceId && (
            <p className="form-hint">
              {
                restaurantOptions.find((restaurant) => restaurant.id === noteComposer.referenceId)?.location ??
                'Location to be determined'
              }
            </p>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <div className="day-planner">
      <section className="card time-blocks time-blocks--column">
        <header className="trip-card__header">
          <div>
            <h2>Schedule</h2>
            <p>All blocks in one view</p>
          </div>
        </header>
        <div className="time-blocks__stack">
          {scheduleBlueprint.map(({ label, display }, index) => {
            const block =
              day.timeBlocks.find((item) => item.label === label) ??
              {
                id: `${day.id}-${label.toLowerCase()}`,
                tripDayId: day.id,
                label,
                sortOrder: index + 1,
                activities: []
              };
            return (
              <article key={block.id} className="time-blocks__item time-blocks__item--column">
                <div className="time-blocks__track time-blocks__track--column">
                  <span className="time-blocks__label">{display}</span>
                  <span className="time-blocks__dot" />
                  {index < scheduleBlueprint.length - 1 && (
                    <span className="time-blocks__connector time-blocks__connector--column" />
                  )}
                </div>
                <div className="time-blocks__panel">
                  <div className="time-blocks__panel-header">
                    <p>{block.activities.length} plans</p>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => openNoteComposer(block)}
                      aria-label={`Add plan for ${display}`}
                    >
                      + Note
                    </button>
                  </div>
                  <ul className="reservation-list" style={{ marginTop: '0.5rem' }} role="list" aria-label={`${display} activities`}>
                    {block.activities.map((activity) => {
                      const displayType = activity.type === 'ADR' ? 'Dining' : activity.type;
                      return (
                        <li key={activity.id} className="activity-card">
                          <button
                            type="button"
                            className="activity-card__body"
                            onClick={() => openNoteComposer(block, activity)}
                          >
                            <span className={`type-chip type-chip--${activity.type.toLowerCase()}`}>{displayType}</span>
                            <div className="activity-card__info">
                              <p className="activity-card__name">{activity.name}</p>
                              <div className="activity-card__meta">
                                <span>{activity.startTime ?? '—'}</span>
                                <div className="activity-card__icons">
                                  {activity.useGeniePlus && (
                                    <span className="activity-card__icon" title="Using Genie+">
                                      ⚡
                                    </span>
                                  )}
                                  {activity.isMustDo && (
                                    <span className="activity-card__icon" title="Must-do">
                                      ★
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                    {block.activities.length === 0 && <p>No activities yet.</p>}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="card day-overview-card">
        <div className="trip-card__header">
          <div>
            <h2>Day Overview</h2>
            <p>{formatDate(day.date)}</p>
          </div>
        </div>
        <div className="day-overview-card__field">
          <span>Park</span>
          <select value={day.park} onChange={(event) => handleParkChange(event.target.value)}>
            {parkOptions.map((park) => (
              <option key={park} value={park}>
                {park}
              </option>
            ))}
          </select>
        </div>
        <div className="day-overview-card__field">
          <span>Park hours</span>
          <p className="form-hint">{parkHours}</p>
        </div>
        <label className="day-overview-card__field">
          <span>Genie+ / Lightning Lane plan</span>
          <input
            type="text"
            value={geniePlan}
            onChange={(event) => setGeniePlan(event.target.value)}
            placeholder="e.g., Prioritize TRON + Peter Pan"
          />
        </label>
        <label className="day-overview-card__field">
          <span>Notes</span>
          <textarea
            rows={6}
            value={dayNotes}
            onChange={(event) => setDayNotes(event.target.value)}
            placeholder="Notes, e.g., rope drop, Genie+ goals"
          />
        </label>
      </aside>

      {noteComposer && (
        <div className="note-overlay">
          <div className="note-dialog card">
            <div className="note-dialog__header">
              <h3>{noteComposer.existingActivityId ? 'Edit plan' : 'Add plan'}</h3>
              <p>{displayLabelMap.get(noteComposer.blockLabel)} block</p>
            </div>
            <div className="type-segmented">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={noteComposer.type === option.value ? 'segment active' : 'segment'}
                  onClick={() => handleTypeChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {renderTypeSpecificFields()}
            <label className="day-overview-card__field">
              <span>Time</span>
              <div className="time-picker">
                <select
                  value={noteComposer.hour}
                  onChange={(event) =>
                    setNoteComposer((prev) => (prev ? { ...prev, hour: event.target.value, timeDirty: true } : prev))
                  }
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={noteComposer.minute}
                  onChange={(event) =>
                    setNoteComposer((prev) => (prev ? { ...prev, minute: event.target.value, timeDirty: true } : prev))
                  }
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
                <select
                  value={noteComposer.period}
                  onChange={(event) =>
                    setNoteComposer((prev) =>
                      prev ? { ...prev, period: event.target.value as 'AM' | 'PM', timeDirty: true } : prev
                    )
                  }
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </label>
            {noteComposer.type === 'NOTE' ? (
              <label className="day-overview-card__field">
                <span>Note</span>
                <textarea
                  rows={3}
                  value={noteComposer.text}
                  onChange={(event) => setNoteComposer((prev) => (prev ? { ...prev, text: event.target.value } : prev))}
                  placeholder="Add notes or reminders"
                />
              </label>
            ) : (
              <label className="day-overview-card__field">
                <span>{noteComposer.type === 'DINING' ? 'Reservation name' : 'Title'}</span>
                <input
                  type="text"
                  value={noteComposer.text}
                  onChange={(event) => setNoteComposer((prev) => (prev ? { ...prev, text: event.target.value } : prev))}
                  placeholder="Enter name"
                />
              </label>
            )}
            <div className="note-dialog__actions">
              <button type="button" className="ghost" onClick={closeNoteComposer}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveNote} disabled={!noteComposer.text.trim()}>
                {noteComposer.existingActivityId ? 'Save changes' : 'Add plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDayPlannerPage;
