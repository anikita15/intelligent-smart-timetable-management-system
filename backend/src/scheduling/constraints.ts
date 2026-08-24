/**
 * Pure scheduling constraint functions — extracted for testability.
 * No Prisma/DB dependencies here.
 */

export type PreferenceLevel = 'PREFERRED' | 'NEUTRAL' | 'AVOID';

export interface SlotInfo {
  id: string;
  dayOfWeek: string;
  slotIndex: number;
  isLunch: boolean;
}

export interface Room {
  id: string;
  type: string; // 'Lab' | 'Classroom'
  capacity: number;
}

/**
 * Computes a soft-constraint score for a (faculty, slot) pair.
 * Higher score = better assignment candidate.
 */
export function scoreSoftConstraints(
  facultyId: string,
  slot: SlotInfo,
  facultyLoadMap: Map<string, number>,
  maxLoad: number,
  prefsMap: Map<string, PreferenceLevel>
): number {
  let score = 100; // baseline

  // Soft constraint 1: Faculty preference
  const prefKey = `${facultyId}-${slot.id}`;
  const pref = prefsMap.get(prefKey);
  if (pref === 'PREFERRED') score += 30;
  if (pref === 'AVOID') score -= 50;

  // Soft constraint 2: Load balancing — penalise heavily loaded faculty
  const currentLoad = facultyLoadMap.get(facultyId) || 0;
  const loadRatio = currentLoad / (maxLoad || 20);
  score -= Math.round(loadRatio * 20);

  // Soft constraint 3: Prefer earlier slots (mornings for theory)
  score -= slot.slotIndex * 2;

  return score;
}

/**
 * Checks if a faculty member is free at a given time slot.
 */
export function isFacultyFree(
  facultyId: string,
  slotId: string,
  facultySchedule: Set<string>
): boolean {
  return !facultySchedule.has(`${facultyId}-${slotId}`);
}

/**
 * Checks if a section is free at a given time slot.
 */
export function isSectionFree(
  sectionId: string,
  slotId: string,
  sectionSchedule: Set<string>
): boolean {
  return !sectionSchedule.has(`${sectionId}-${slotId}`);
}

/**
 * Finds an available room that matches the subject type.
 * Returns null if none available.
 */
export function findAvailableRoom(
  rooms: Room[],
  slotId: string,
  roomSchedule: Set<string>,
  subjectType: string,
  sectionStrength: number = 0
): Room | null {
  for (const room of rooms) {
    // Lab must go in a lab room, theory must not go in a lab room
    if (subjectType === 'Lab' && room.type !== 'Lab') continue;
    if (subjectType !== 'Lab' && room.type === 'Lab') continue;

    // Room must have sufficient capacity
    if (sectionStrength > 0 && room.capacity < sectionStrength) continue;

    const roomKey = `${room.id}-${slotId}`;
    if (!roomSchedule.has(roomKey)) {
      return room;
    }
  }
  return null;
}

/**
 * Filters a list of slots to valid candidates for a given faculty+section.
 */
export function getCandidateSlots(
  slots: SlotInfo[],
  facultyId: string,
  sectionId: string,
  facultySchedule: Set<string>,
  sectionSchedule: Set<string>
): SlotInfo[] {
  return slots.filter(
    (slot) =>
      !slot.isLunch &&
      isFacultyFree(facultyId, slot.id, facultySchedule) &&
      isSectionFree(sectionId, slot.id, sectionSchedule)
  );
}
