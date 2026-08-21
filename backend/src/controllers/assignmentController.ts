import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.facultySubjectSection.findMany({
      include: {
        faculty: true,
        subject: true,
        section: true,
      }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.facultySubjectSection.create({
      data: req.body,
      include: { faculty: true, subject: true, section: true }
    });
    res.status(201).json(assignment);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'This subject-section assignment already exists for this academic year.' });
    }
    res.status(500).json({ error: 'Failed to create assignment' });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.facultySubjectSection.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
};
