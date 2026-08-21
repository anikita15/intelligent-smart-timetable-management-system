import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getSections = async (req: Request, res: Response) => {
  try {
    const sections = await prisma.section.findMany();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
};

export const createSection = async (req: Request, res: Response) => {
  try {
    const section = await prisma.section.create({
      data: req.body,
    });
    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create section' });
  }
};

export const updateSection = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const section = await prisma.section.update({
      where: { id },
      data: req.body,
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update section' });
  }
};

export const deleteSection = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.section.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
};
