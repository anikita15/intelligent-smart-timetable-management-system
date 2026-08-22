import { Request, Response } from 'express';
import prisma from '../prismaClient';

// Soft constraint score for a (faculty, slot) pair
// Higher is better
async function scoreSoftConstraints(
  facultyId: string,
  slot: { id: string; dayOfWeek: string; slotIndex: number },
  facultyLoadMap: Map<string, number>,
  maxLoad: number,
  prefsMap: Map<string, string> // key: "facultyId-timeSlotId", value: preferenceLevel
): Promise<number> {
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

export const generateTimetable = async (req: Request, res: Response): Promise<any> => {
  try {
    const { academicYear, semester, label } = req.body;

    if (!academicYear || !semester) {
      return res.status(400).json({ error: 'academicYear and semester are required' });
    }

    // 1. Fetch data
    const assignments = await prisma.facultySubjectSection.findMany({
      where: { academicYear, semester },
      include: {
        subject: true,
        faculty: { include: { preferences: true } },
      },
    });

    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
    });

    const rooms = await prisma.room.findMany({ where: { isActive: true } });

    // 2. Build preferences map
    const prefsMap = new Map<string, string>();
    for (const assignment of assignments) {
      for (const pref of assignment.faculty.preferences) {
        prefsMap.set(`${assignment.facultyId}-${pref.timeSlotId}`, pref.preferenceLevel);
      }
    }

    // 3. Create new version
    const version = await prisma.timetableVersion.create({
      data: {
        status: 'DRAFT',
        academicYear,
        semester,
        label: label || `${academicYear} Sem ${semester} – Draft`,
      },
    });

    // Tracking structures
    const facultySchedule = new Set<string>(); // "facultyId-timeSlotId"
    const sectionSchedule = new Set<string>(); // "sectionId-timeSlotId"
    const roomSchedule = new Set<string>();    // "roomId-timeSlotId"
    const facultyLoadMap = new Map<string, number>(); // facultyId → assigned count

    const entriesToCreate: any[] = [];
    const unassigned: any[] = [];

    // 4. Greedy Assignment with soft-constraint scoring
    for (const assignment of assignments) {
      const { facultyId, sectionId, subject, faculty } = assignment;
      const totalClasses = subject.weeklyLectures + subject.weeklyLabs;

      let classesAssigned = 0;

      // Collect candidate slots, score them, sort descending
      const candidateSlots = timeSlots
        .filter((slot) => !slot.isLunch)
        .filter((slot) => !facultySchedule.has(`${facultyId}-${slot.id}`))
        .filter((slot) => !sectionSchedule.has(`${sectionId}-${slot.id}`));

      // Score each candidate slot
      const scoredSlots = await Promise.all(
        candidateSlots.map(async (slot) => ({
          slot,
          score: await scoreSoftConstraints(
            facultyId,
            slot,
            facultyLoadMap,
            faculty.maxWeeklyLoad,
            prefsMap
          ),
        }))
      );

      scoredSlots.sort((a, b) => b.score - a.score);

      for (const { slot } of scoredSlots) {
        if (classesAssigned >= totalClasses) break;

        // Find available room matching subject type
        let assignedRoom = null;
        for (const room of rooms) {
          if (subject.type === 'Lab' && room.type !== 'Lab') continue;
          if (subject.type !== 'Lab' && room.type === 'Lab') continue;
          const roomKey = `${room.id}-${slot.id}`;
          if (!roomSchedule.has(roomKey)) {
            assignedRoom = room;
            break;
          }
        }

        if (assignedRoom) {
          facultySchedule.add(`${facultyId}-${slot.id}`);
          sectionSchedule.add(`${sectionId}-${slot.id}`);
          roomSchedule.add(`${assignedRoom.id}-${slot.id}`);
          facultyLoadMap.set(facultyId, (facultyLoadMap.get(facultyId) || 0) + 1);

          entriesToCreate.push({
            timetableVersionId: version.id,
            sectionId,
            subjectId: subject.id,
            facultyId,
            roomId: assignedRoom.id,
            timeSlotId: slot.id,
          });

          classesAssigned++;
        }
      }

      if (classesAssigned < totalClasses) {
        unassigned.push({
          facultyId,
          facultyName: faculty.name,
          sectionId,
          subjectId: subject.id,
          subjectName: subject.name,
          requested: totalClasses,
          assigned: classesAssigned,
          missing: totalClasses - classesAssigned,
        });
      }
    }

    // 5. Save to DB
    if (entriesToCreate.length > 0) {
      await prisma.timetableEntry.createMany({ data: entriesToCreate });
    }

    res.json({
      message: 'Timetable generation complete',
      versionId: version.id,
      label: version.label,
      assignedCount: entriesToCreate.length,
      unassignedCount: unassigned.length,
      unassignedDetails: unassigned,
    });
  } catch (error) {
    console.error('Timetable generation error:', error);
    res.status(500).json({ error: 'Failed to generate timetable' });
  }
};

export const getTimetables = async (req: Request, res: Response) => {
  try {
    const versions = await prisma.timetableVersion.findMany({
      orderBy: { generatedAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timetable versions' });
  }
};

export const getTimetableEntries = async (req: Request, res: Response) => {
  try {
    const versionId = req.params.versionId as string;
    const entries = await prisma.timetableEntry.findMany({
      where: { timetableVersionId: versionId },
      include: {
        subject: true,
        faculty: true,
        room: true,
        timeSlot: true,
        section: true,
      },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timetable entries' });
  }
};

export const publishTimetable = async (req: Request, res: Response): Promise<any> => {
  try {
    const versionId = req.params.versionId as string;
    const version = await prisma.timetableVersion.findUnique({ where: { id: versionId } });
    if (!version) return res.status(404).json({ error: 'Version not found' });
    if (version.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only DRAFT timetables can be published' });
    }

    const updated = await prisma.timetableVersion.update({
      where: { id: versionId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    res.json({ message: 'Timetable published', version: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish timetable' });
  }
};

export const archiveTimetable = async (req: Request, res: Response): Promise<any> => {
  try {
    const versionId = req.params.versionId as string;
    const version = await prisma.timetableVersion.findUnique({ where: { id: versionId } });
    if (!version) return res.status(404).json({ error: 'Version not found' });

    const updated = await prisma.timetableVersion.update({
      where: { id: versionId },
      data: { status: 'ARCHIVED' },
    });
    res.json({ message: 'Timetable archived', version: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive timetable' });
  }
};

export const deleteTimetable = async (req: Request, res: Response): Promise<any> => {
  try {
    const versionId = req.params.versionId as string;
    const version = await prisma.timetableVersion.findUnique({ where: { id: versionId } });
    if (!version) return res.status(404).json({ error: 'Version not found' });
    if (version.status === 'PUBLISHED') {
      return res.status(400).json({ error: 'Cannot delete a published timetable. Archive it first.' });
    }

    await prisma.timetableEntry.deleteMany({ where: { timetableVersionId: versionId } });
    await prisma.timetableVersion.delete({ where: { id: versionId } });
    res.json({ message: 'Timetable version deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete timetable' });
  }
};

export const getConflicts = async (req: Request, res: Response): Promise<any> => {
  try {
    const versionId = req.params.versionId as string;
    const version = await prisma.timetableVersion.findUnique({
      where: { id: versionId },
      include: { _count: { select: { entries: true } } },
    });
    if (!version) return res.status(404).json({ error: 'Version not found' });

    if (!version.academicYear || !version.semester) {
      return res.json({ conflicts: [], summary: 'No academic year/semester metadata on this version.' });
    }

    // Find assignments for this version's year/semester
    const assignments = await prisma.facultySubjectSection.findMany({
      where: { academicYear: version.academicYear, semester: version.semester },
      include: { subject: true, faculty: true, section: true },
    });

    // Count actual entries per (section, subject, faculty)
    const entries = await prisma.timetableEntry.findMany({
      where: { timetableVersionId: versionId },
    });

    // Group entries by subjectId+sectionId+facultyId
    const assignedMap = new Map<string, number>();
    for (const entry of entries) {
      const key = `${entry.subjectId}-${entry.sectionId}-${entry.facultyId}`;
      assignedMap.set(key, (assignedMap.get(key) || 0) + 1);
    }

    const conflicts = [];
    for (const a of assignments) {
      const required = a.subject.weeklyLectures + a.subject.weeklyLabs;
      const key = `${a.subjectId}-${a.sectionId}-${a.facultyId}`;
      const assigned = assignedMap.get(key) || 0;
      if (assigned < required) {
        conflicts.push({
          type: 'UNASSIGNED_SLOTS',
          severity: required - assigned >= required * 0.5 ? 'HIGH' : 'MEDIUM',
          faculty: { id: a.facultyId, name: a.faculty.name },
          subject: { id: a.subjectId, name: a.subject.name },
          section: { id: a.sectionId, name: a.section.name },
          required,
          assigned,
          missing: required - assigned,
        });
      }
    }

    res.json({
      versionId,
      label: version.label,
      totalEntries: (version as any)._count.entries,
      totalConflicts: conflicts.length,
      conflicts,
    });
  } catch (error) {
    console.error('Get conflicts error:', error);
    res.status(500).json({ error: 'Failed to fetch conflicts' });
  }
};
