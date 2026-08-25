import React, { useMemo } from 'react';

interface TimeSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isLunch: boolean;
  slotIndex: number;
}

interface Entry {
  id: string;
  timeSlot: TimeSlot;
  subject: { id: string; name: string; type: string };
  faculty: { id: string; name: string };
  room: { id: string; name: string };
  section: { id: string; name: string };
}

interface Props {
  entries: Entry[];
  filterFacultyId?: string;
  filterSectionId?: string;
  showSection?: boolean;
  onEntryClick?: (entry: Entry) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Deterministic color index per section
function sectionColorIdx(sectionId: string) {
  let hash = 0;
  for (let i = 0; i < sectionId.length; i++) hash = sectionId.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 6;
}

const TimetableGrid: React.FC<Props> = ({ entries, filterFacultyId, filterSectionId, showSection = false, onEntryClick }) => {
  const filtered = useMemo(() => {
    let e = entries;
    if (filterFacultyId) e = e.filter(x => x.faculty.id === filterFacultyId);
    if (filterSectionId) e = e.filter(x => x.section.id === filterSectionId);
    return e;
  }, [entries, filterFacultyId, filterSectionId]);

  // Collect unique time slot rows (sorted by slotIndex)
  const allSlots = useMemo(() => {
    const slotMap = new Map<string, TimeSlot>();
    entries.forEach(e => slotMap.set(`${e.timeSlot.dayOfWeek}-${e.timeSlot.slotIndex}`, e.timeSlot));
    // Also build from all distinct (slotIndex, times) pairs
    const byIndex = new Map<number, TimeSlot>();
    entries.forEach(e => {
      if (!byIndex.has(e.timeSlot.slotIndex)) byIndex.set(e.timeSlot.slotIndex, e.timeSlot);
    });
    return Array.from(byIndex.values()).sort((a, b) => a.slotIndex - b.slotIndex);
  }, [entries]);

  // Build lookup: dayOfWeek-slotIndex → entries
  const lookup = useMemo(() => {
    const map = new Map<string, Entry[]>();
    filtered.forEach(e => {
      const key = `${e.timeSlot.dayOfWeek}-${e.timeSlot.slotIndex}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [filtered]);

  if (allSlots.length === 0) {
    return (
      <div className="empty-state">
        <p>No timetable data to display.</p>
      </div>
    );
  }

  const gridTemplate = `80px repeat(${DAYS.length}, 1fr)`;

  return (
    <div className="timetable-grid-wrapper">
      <div className="timetable-grid" style={{ gridTemplateColumns: gridTemplate }}>
        {/* Header row */}
        <div style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', padding: '0.6rem 0.5rem' }} />
        {DAYS.map(day => (
          <div key={day} className="timetable-day-cell">{day.slice(0, 3)}</div>
        ))}

        {/* Body rows */}
        {allSlots.map(slot => (
          <React.Fragment key={slot.slotIndex}>
            {/* Time label */}
            <div className="timetable-time-label">
              <span>{slot.startTime}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{slot.endTime}</span>
            </div>

            {/* Day cells */}
            {DAYS.map(day => {
              const key = `${day}-${slot.slotIndex}`;
              const cellEntries = lookup.get(key) || [];
              const isLunch = slot.isLunch;

              return (
                <div key={day} className={`timetable-slot ${isLunch ? 'lunch' : ''} ${cellEntries.length === 0 ? 'empty' : ''}`}>
                  {isLunch && cellEntries.length === 0 && <div className="lunch-banner">Lunch</div>}
                  {cellEntries.map(entry => (
                    <div 
                      key={entry.id} 
                      className={`timetable-entry entry-color-${sectionColorIdx(entry.section.id)} ${onEntryClick ? 'clickable' : ''}`}
                      onClick={() => onEntryClick && onEntryClick(entry)}
                      style={onEntryClick ? { cursor: 'pointer' } : undefined}
                    >
                      {showSection && <span className="section-name">{entry.section.name}</span>}
                      <span className="subject-name">{entry.subject.name}</span>
                      <span className="faculty-name">{entry.faculty.name}</span>
                      <span className="room-name">📍 {entry.room.name}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TimetableGrid;
