import { Request, Response } from 'express';
import prisma from '../prismaClient';

// GET /api/faculty/:id/preferences
export const getPreferences = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const preferences = await prisma.facultyPreference.findMany({
      where: { facultyId: id },
      include: { timeSlot: true },
      orderBy: [{ timeSlot: { dayOfWeek: 'asc' } }, { timeSlot: { slotIndex: 'asc' } }],
    });
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

// POST /api/faculty/:id/preferences
// Body: { preferences: [{ timeSlotId, preferenceLevel }] }
export const setPreferences = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ error: 'preferences must be an array' });
    }

    await prisma.facultyPreference.deleteMany({ where: { facultyId: id } });

    if (preferences.length > 0) {
      await prisma.facultyPreference.createMany({
        data: preferences.map((p: { timeSlotId: string; preferenceLevel: string }) => ({
          facultyId: id,
          timeSlotId: p.timeSlotId,
          preferenceLevel: p.preferenceLevel,
        })),
      });
    }

    const updated = await prisma.facultyPreference.findMany({
      where: { facultyId: id },
      include: { timeSlot: true },
    });

    res.json({ message: 'Preferences updated', preferences: updated });
  } catch (error) {
    console.error('Set preferences error:', error);
    res.status(500).json({ error: 'Failed to set preferences' });
  }
};
