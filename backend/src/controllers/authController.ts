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
