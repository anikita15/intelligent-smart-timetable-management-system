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

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
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
    const { email, password, role, name, maxWeeklyLoad } = req.body;

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
      data: { email, passwordHash, role },
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
      user: { id: user.id, email: user.email, role: user.role },
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

