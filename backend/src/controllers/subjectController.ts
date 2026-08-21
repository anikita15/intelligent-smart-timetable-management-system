import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const subject = await prisma.subject.create({
      data: req.body,
    });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const subject = await prisma.subject.update({
      where: { id },
      data: req.body,
    });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subject' });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.subject.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};
