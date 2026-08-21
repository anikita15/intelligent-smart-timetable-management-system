import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const generateTimetable = async (req: Request, res: Response) => {
  try {
    const { academicYear, semester } = req.body;

    if (!academicYear || !semester) {
      return res.status(400).json({ error: 'academicYear and semester are required' });
    }

    // 1. Fetch data
    const assignments = await prisma.facultySubjectSection.findMany({
      where: { academicYear, semester },
      include: {
        subject: true,
      }
    });

    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }]
    });

    const rooms = await prisma.room.findMany({
      where: { isActive: true }
    });

    // 2. Create new version
    const version = await prisma.timetableVersion.create({
      data: {
        status: 'DRAFT',
      }
    });

    // Tracking structures for conflict resolution
    const facultySchedule = new Set<string>(); // "facultyId-timeSlotId"
    const sectionSchedule = new Set<string>(); // "sectionId-timeSlotId"
    const roomSchedule = new Set<string>();    // "roomId-timeSlotId"

    const entriesToCreate: any[] = [];
    const unassigned: any[] = [];

    // 3. Greedy Assignment
    for (const assignment of assignments) {
      const { facultyId, sectionId, subject } = assignment;
      const totalClasses = subject.weeklyLectures + subject.weeklyLabs; // Assuming 1 slot per class for simplicity in Phase 1

      let classesAssigned = 0;

      for (const slot of timeSlots) {
        if (classesAssigned >= totalClasses) break;
        if (slot.isLunch) continue;

        const facKey = `${facultyId}-${slot.id}`;
        const secKey = `${sectionId}-${slot.id}`;

        if (!facultySchedule.has(facKey) && !sectionSchedule.has(secKey)) {
          // Find available room
          let assignedRoom = null;
          for (const room of rooms) {
            // Very simple room type matching
            if (subject.type === 'Lab' && room.type !== 'Lab') continue;
            if (subject.type !== 'Lab' && room.type === 'Lab') continue;

            const roomKey = `${room.id}-${slot.id}`;
            if (!roomSchedule.has(roomKey)) {
              assignedRoom = room;
              break;
            }
          }

          if (assignedRoom) {
            // Assign
            facultySchedule.add(facKey);
            sectionSchedule.add(secKey);
            roomSchedule.add(`${assignedRoom.id}-${slot.id}`);

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
      }

      if (classesAssigned < totalClasses) {
        unassigned.push({
          assignment,
          requested: totalClasses,
          assigned: classesAssigned
        });
      }
    }

    // 4. Save to DB
    if (entriesToCreate.length > 0) {
      await prisma.timetableEntry.createMany({
        data: entriesToCreate
      });
    }

    res.json({
      message: 'Timetable generation complete',
      versionId: version.id,
      assignedCount: entriesToCreate.length,
      unassignedCount: unassigned.length,
      unassignedDetails: unassigned
    });
  } catch (error) {
    console.error('Timetable generation error:', error);
    res.status(500).json({ error: 'Failed to generate timetable' });
  }
};

export const getTimetables = async (req: Request, res: Response) => {
  try {
    const versions = await prisma.timetableVersion.findMany({
      orderBy: { generatedAt: 'desc' }
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
        section: true
      }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timetable entries' });
  }
};
