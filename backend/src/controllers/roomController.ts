import { Request, Response } from 'express';
import prisma from '../prismaClient';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const room = await prisma.room.create({
      data: req.body,
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const room = await prisma.room.update({
      where: { id },
      data: req.body,
    });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update room' });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.room.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete room' });
  }
};
