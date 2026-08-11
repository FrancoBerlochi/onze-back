import 'dotenv/config';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET is not defined in environment variables");
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await prisma.adminUser.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      return;
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
