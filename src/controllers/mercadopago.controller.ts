import 'dotenv/config';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Resend } from 'resend';

const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Reemplazar 'tu_api_key' por la verdadera desde las variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY || 're_test123');

// El webhook de pagos ahora se maneja íntegramente en order.controller.ts (mpWebhook)
// para poder interactuar directamente con la base de datos de órdenes y stock.

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo órdenes' });
  }
};
