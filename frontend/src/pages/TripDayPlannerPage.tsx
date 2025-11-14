import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { trips } from '../data/sampleData';
import { TripDay } from '../types';
import '../styles/page-sections.css';

const parkOptions = ['MK', 'EPCOT', 'HS', 'AK', 'OFFSITE', 'UNSET'];
const noteTypeOptions: Array<{ label: string; value: 'RIDE' | 'SHOW' | 'NOTE' | 'DINING' }> = [
  { label: 'Ride', value: 'RIDE' },
  { label: 'Show', value: 'SHOW' },
  { label: 'Note', value: 'NOTE' },
  { label: 'Dining', value: 'DINING' }
];
const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const minuteOptions = ['00', '15', '30', '45'];

const parseTimeToEditor = (time?: string) => {
  if (!time) {
    return { hour: '08', minute: '00', period: 'AM' as const };
  }
  const [hourStr, minute = '00'] = time.split(':');
  let hourNum = Number(hourStr);
  const period = hourNum >= 12 ? 'PM' : 'AM';
  hourNum = hourNum % 12;
  if (hourNum === 0) hourNum = 12;
  return { hour: String(hourNum).padStart(2, '0'), minute, period };
};

const mapExistingType = (type?: string): 'RIDE' | 'SHOW' | 'NOTE' | 'DINING' => {
  if (!type) return 'NOTE';
  if (type === 'ADR') return 'DINING';
  if (type === 'DINING' || type === 'RIDE' || type === 'SHOW' || type === 'NOTE') return type as 'RIDE' | 'SHOW' | 'NOTE' | 'DINING';
  return 'NOTE';
};

const TripDayPlannerPage = () => {
  const { tripId, dayId } = useParams();
  const trip = trips.find((item) => item.id === tripId) ?? trips[0];
  const selectedDay = useMemo(() => trip.parkDays.find((day) => day.id === dayId) ?? trip.parkDays[0], [dayId, trip]);
  const [day, setDay] = useState<TripDay>(selectedDay);
  useEffect(() => setDay(selectedDay), [selectedDay]);

  const handleParkChange = (value: string) => setDay((prev) => ({ ...prev, park: value as TripDay['park'] }));

  const [noteComposer, setNoteComposer] = useState<{
    blockId: string;
    text: string;
    hour: string;
    minute: string;
    period: 'AM' | 'PM';
    type: 'RIDE' | 'SHOW' | 'NOTE' | 'DINING';
    existingActivityId?: string;
    timeDirty: boolean;
  } | null>(null);
  const activeBlock = noteComposer ? day.timeBlocks.find((block) => block.id === noteComposer.blockId) : null;

  const openNoteComposer = (
    blockId: string,
    existing?: { id: string; name: string; startTime?: string; type: string }
  ) => {
    const { hour, minute, period } = parseTimeToEditor(existing?.startTime);
    setNoteComposer({
      blockId,
      text: existing?.name ?? '',
      hour,
      minute,
      period,
      type: mapExistingType(existing?.type),
      existingActivityId: existing?.id,
      timeDirty: !existing
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
    const mappedType = noteComposer.type === 'DINING' ? 'ADR' : noteComposer.type;
    const shouldUpdateTime = noteComposer.timeDirty || !noteComposer.existingActivityId;
    const resolvedTime = shouldUpdateTime ? formattedTime : existingActivity?.startTime;

    setDay((prev) => ({
      ...prev,
      timeBlocks: prev.timeBlocks.map((block) =>
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
                          startTime: resolvedTime
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
                      startTime: resolvedTime
                    }
                  ]
            }
          : block
      )
    }));
    closeNoteComposer();
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
          {day.timeBlocks.map((block, index) => (
            <article key={block.id} className="time-blocks__item time-blocks__item--column">
              <div className="time-blocks__track time-blocks__track--column">
                <span className="time-blocks__label">{block.label}</span>
                <span className="time-blocks__dot" />
                {index < day.timeBlocks.length - 1 && <span className="time-blocks__connector time-blocks__connector--column" />}
              </div>
              <div className="time-blocks__panel">
                <div className="time-blocks__panel-header">
                  <p>{block.activities.length} plans</p>
                  <button type="button" className="ghost" onClick={() => openNoteComposer(block.id)}>
                    + Note
                  </button>
                </div>
                <ul className="reservation-list" style={{ marginTop: '0.5rem' }}>
                  {block.activities.map((activity) => (
                    <li key={activity.id}>
                      <div>
                        <button
                          type="button"
                          className="activity-title"
                          onClick={() =>
                            openNoteComposer(block.id, {
                              id: activity.id,
                              name: activity.name,
                              startTime: activity.startTime,
                              type: activity.type
                            })
                          }
                        >
                          <p>{activity.name}</p>
                          <small>{activity.type === 'ADR' ? 'DINING' : activity.type}</small>
                        </button>
                      </div>
                      <span>{activity.startTime ?? '—'}</span>
                    </li>
                  ))}
                  {block.activities.length === 0 && <p>No activities yet.</p>}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="card day-overview-card">
        <div className="trip-card__header">
          <div>
            <h2>Day Overview</h2>
            <p>{day.date}</p>
          </div>
        </div>
        <label className="day-overview-card__field">
          <span>Park</span>
          <select value={day.park} onChange={(event) => handleParkChange(event.target.value)}>
            {parkOptions.map((park) => (
              <option key={park} value={park}>
                {park}
              </option>
            ))}
          </select>
        </label>
        <label className="day-overview-card__field">
          <span>Notes</span>
          <textarea
            rows={4}
            defaultValue={day.notes ?? ''}
            placeholder="Notes, e.g., rope drop, Genie+ goals"
          />
        </label>
      </aside>

      {noteComposer && (
        <div className="note-overlay">
          <div className="note-dialog card">
            <div className="note-dialog__header">
              <h3>{noteComposer.existingActivityId ? 'Edit plan' : 'Add plan'}</h3>
              <p>{activeBlock ? `${activeBlock.label} block` : ''}</p>
            </div>
            <label className="day-overview-card__field">
              <span>Type</span>
              <select
                value={noteComposer.type}
                onChange={(event) =>
                  setNoteComposer((prev) =>
                    prev ? { ...prev, type: event.target.value as (typeof noteTypeOptions)[number]['value'] } : prev
                  )
                }
              >
                {noteTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
            <label className="day-overview-card__field">
              <span>Note</span>
              <textarea
                rows={3}
                value={noteComposer.text}
                onChange={(event) => setNoteComposer((prev) => (prev ? { ...prev, text: event.target.value } : prev))}
                placeholder="Enter reminder or plan detail"
              />
            </label>
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
