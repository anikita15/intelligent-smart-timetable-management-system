import { Request, Response } from 'express';
import prisma from '../prismaClient';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = [
  { start: '09:00', end: '10:00', isLunch: false },
  { start: '10:00', end: '11:00', isLunch: false },
  { start: '11:00', end: '12:00', isLunch: false },
  { start: '12:00', end: '13:00', isLunch: true  },  // Lunch
  { start: '13:00', end: '14:00', isLunch: false },
  { start: '14:00', end: '15:00', isLunch: false },
  { start: '15:00', end: '16:00', isLunch: false },
];

export const seedTimeSlots = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.timeSlot.count();
    if (existing > 0) {
      return res.json({ message: 'Time slots already seeded', count: existing });
    }

    const slots = [];
    for (const day of DAYS) {
      for (let i = 0; i < SLOTS.length; i++) {
        slots.push({
          dayOfWeek: day,
          startTime: SLOTS[i].start,
          endTime: SLOTS[i].end,
          isLunch: SLOTS[i].isLunch,
          slotIndex: i,
        });
      }
    }

    await prisma.timeSlot.createMany({ data: slots });
    res.json({ message: 'Time slots seeded successfully', count: slots.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to seed time slots' });
  }
};

export const getTimeSlots = async (req: Request, res: Response) => {
  try {
    const slots = await prisma.timeSlot.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }]
    });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
};
