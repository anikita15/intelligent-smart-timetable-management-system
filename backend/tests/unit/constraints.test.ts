import {
  scoreSoftConstraints,
  isFacultyFree,
  isSectionFree,
  findAvailableRoom,
  getCandidateSlots,
  SlotInfo,
  Room,
  PreferenceLevel,
} from '../../src/scheduling/constraints';

const makeSlot = (id: string, slotIndex = 0, isLunch = false): SlotInfo => ({
  id,
  dayOfWeek: 'Monday',
  slotIndex,
  isLunch,
});

const makeRoom = (id: string, type: string, capacity = 60): Room => ({ id, type, capacity });

describe('scoreSoftConstraints', () => {
  const slot = makeSlot('slot-1', 0);
  const loadMap = new Map<string, number>();
  const prefsMap = new Map<string, PreferenceLevel>();

  it('returns baseline 100 with no preferences or load', () => {
    expect(scoreSoftConstraints('f1', slot, loadMap, 20, prefsMap)).toBe(100);
  });

  it('adds +30 for PREFERRED slot', () => {
    const prefs = new Map<string, PreferenceLevel>([['f1-slot-1', 'PREFERRED']]);
    expect(scoreSoftConstraints('f1', slot, loadMap, 20, prefs)).toBe(130);
  });

  it('subtracts 50 for AVOID slot', () => {
    const prefs = new Map<string, PreferenceLevel>([['f1-slot-1', 'AVOID']]);
    expect(scoreSoftConstraints('f1', slot, loadMap, 20, prefs)).toBe(50);
  });

  it('penalises later slots (higher slotIndex)', () => {
    const early = makeSlot('s1', 0);
    const late = makeSlot('s2', 4);
    const scoreEarly = scoreSoftConstraints('f1', early, loadMap, 20, prefsMap);
    const scoreLate = scoreSoftConstraints('f1', late, loadMap, 20, prefsMap);
    expect(scoreEarly).toBeGreaterThan(scoreLate);
  });

  it('penalises faculty with high load', () => {
    const highLoad = new Map<string, number>([['f1', 18]]);
    const noLoad = new Map<string, number>();
    const scoreHigh = scoreSoftConstraints('f1', slot, highLoad, 20, prefsMap);
    const scoreLow = scoreSoftConstraints('f1', slot, noLoad, 20, prefsMap);
    expect(scoreHigh).toBeLessThan(scoreLow);
  });
});

describe('isFacultyFree', () => {
  it('returns true when faculty has no bookings', () => {
    expect(isFacultyFree('f1', 's1', new Set())).toBe(true);
  });

  it('returns false when faculty is booked', () => {
    const sched = new Set(['f1-s1']);
    expect(isFacultyFree('f1', 's1', sched)).toBe(false);
  });

  it('returns true when a different faculty is booked', () => {
    const sched = new Set(['f2-s1']);
    expect(isFacultyFree('f1', 's1', sched)).toBe(true);
  });

  it('returns true when same faculty is booked in a different slot', () => {
    const sched = new Set(['f1-s2']);
    expect(isFacultyFree('f1', 's1', sched)).toBe(true);
  });
});

describe('isSectionFree', () => {
  it('returns true when section is unbooked', () => {
    expect(isSectionFree('sec1', 'slot1', new Set())).toBe(true);
  });

  it('returns false when section is double-booked', () => {
    const sched = new Set(['sec1-slot1']);
    expect(isSectionFree('sec1', 'slot1', sched)).toBe(false);
  });
});

describe('findAvailableRoom', () => {
  const rooms = [makeRoom('r1', 'Classroom', 60), makeRoom('r2', 'Lab', 40)];

  it('returns a classroom for theory subjects', () => {
    const result = findAvailableRoom(rooms, 's1', new Set(), 'Theory');
    expect(result?.id).toBe('r1');
  });

  it('returns a lab for lab subjects', () => {
    const result = findAvailableRoom(rooms, 's1', new Set(), 'Lab');
    expect(result?.id).toBe('r2');
  });

  it('returns null when no rooms are available', () => {
    const booked = new Set(['r1-s1', 'r2-s1']);
    expect(findAvailableRoom(rooms, 's1', booked, 'Theory')).toBeNull();
  });

  it('excludes booked rooms', () => {
    const booked = new Set(['r1-s1']);
    // No other classrooms available
    const result = findAvailableRoom(rooms, 's1', booked, 'Theory');
    expect(result).toBeNull();
  });

  it('enforces room capacity when sectionStrength is given', () => {
    const tinyRooms = [makeRoom('small', 'Classroom', 10)];
    // Section of 50 students should not fit in a room of capacity 10
    expect(findAvailableRoom(tinyRooms, 's1', new Set(), 'Theory', 50)).toBeNull();
    // Section of 5 students should fit
    expect(findAvailableRoom(tinyRooms, 's1', new Set(), 'Theory', 5)).not.toBeNull();
  });
});

describe('getCandidateSlots', () => {
  const slots: SlotInfo[] = [
    makeSlot('s1', 0, false),
    makeSlot('s2', 1, false),
    makeSlot('lunch', 2, true), // lunch slot — must be excluded
    makeSlot('s3', 3, false),
  ];

  it('excludes lunch slots', () => {
    const result = getCandidateSlots(slots, 'f1', 'sec1', new Set(), new Set());
    expect(result.map(s => s.id)).not.toContain('lunch');
  });

  it('excludes slots where faculty is already booked', () => {
    const fSched = new Set(['f1-s1']);
    const result = getCandidateSlots(slots, 'f1', 'sec1', fSched, new Set());
    expect(result.map(s => s.id)).not.toContain('s1');
    expect(result.map(s => s.id)).toContain('s2');
  });

  it('excludes slots where section is already booked', () => {
    const sSched = new Set(['sec1-s2']);
    const result = getCandidateSlots(slots, 'f1', 'sec1', new Set(), sSched);
    expect(result.map(s => s.id)).not.toContain('s2');
  });

  it('returns all non-lunch free slots when nothing is booked', () => {
    const result = getCandidateSlots(slots, 'f1', 'sec1', new Set(), new Set());
    expect(result).toHaveLength(3); // s1, s2, s3 (no lunch)
  });
});
