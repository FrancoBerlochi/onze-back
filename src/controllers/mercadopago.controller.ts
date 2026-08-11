import 'dotenv/config';
import { Request, Response } from 'express';
import { Resend } from 'resend';
import prisma from '../config/db';

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
