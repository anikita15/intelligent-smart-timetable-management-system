import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, sectionId: user.sectionId } });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const setup = async (req: Request, res: Response): Promise<any> => {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(400).json({ error: 'Setup already completed' });
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@itms.edu',
        passwordHash,
        role: 'ADMIN',
      },
    });

    res.json({ message: 'Admin user created', email: adminUser.email });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin-only: create a FACULTY or STUDENT account
export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, role, name, maxWeeklyLoad, sectionId } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'email, password, and role are required' });
    }
    if (!['FACULTY', 'STUDENT'].includes(role)) {
      return res.status(400).json({ error: 'role must be FACULTY or STUDENT' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        // Link student to section if provided
        ...(role === 'STUDENT' && sectionId ? { sectionId } : {}),
      },
    });

    // For FACULTY, create Faculty profile as well
    let faculty = null;
    if (role === 'FACULTY') {
      faculty = await prisma.faculty.create({
        data: {
          userId: user.id,
          name: name || email.split('@')[0],
          maxWeeklyLoad: maxWeeklyLoad || 20,
        },
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, email: user.email, role: user.role, sectionId: user.sectionId },
      faculty,
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin-only: list all non-admin users
export const listUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: {
        id: true,
        email: true,
        role: true,
        sectionId: true,
        section: { select: { id: true, name: true } },
        createdAt: true,
        facultyProfile: {
          select: { id: true, name: true, isActive: true, maxWeeklyLoad: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin-only: update a user's linked section (for students)
export const updateUserSection = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { sectionId } = req.body;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'STUDENT') return res.status(400).json({ error: 'Section can only be assigned to STUDENT accounts' });

    const updated = await prisma.user.update({
      where: { id },
      data: { sectionId: sectionId || null },
      select: { id: true, email: true, role: true, sectionId: true, section: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user section' });
  }
};
