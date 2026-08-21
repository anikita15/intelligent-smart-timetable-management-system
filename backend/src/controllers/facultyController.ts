import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getFaculties = async (req: Request, res: Response) => {
  try {
    const faculties = await prisma.faculty.findMany({
      include: { user: { select: { email: true, role: true } } }
    });
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch faculties' });
  }
};

export const createFaculty = async (req: Request, res: Response) => {
  try {
    const { name, email, passwordHash, maxWeeklyLoad } = req.body;
    
    // Using a transaction to create both User and Faculty
    const result = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash, // In a real app, hash this first
          role: 'FACULTY',
        }
      });
      
      const faculty = await prisma.faculty.create({
        data: {
          userId: user.id,
          name,
          maxWeeklyLoad,
        }
      });
      return faculty;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create faculty' });
  }
};

export const updateFaculty = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, maxWeeklyLoad, isActive } = req.body;
    const faculty = await prisma.faculty.update({
      where: { id },
      data: { name, maxWeeklyLoad, isActive }
    });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update faculty' });
  }
};

export const deleteFaculty = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.faculty.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
};
