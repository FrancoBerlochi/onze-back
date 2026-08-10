import 'dotenv/config';
import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Resend } from 'resend';

const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Reemplazar 'tu_api_key' por la verdadera desde las variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY || 're_test123');

export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    const payment = req.body;
    console.log("Mercado Pago Webhook recibido:", payment);

    // 1. Aquí irá la lógica para verificar la firma de MP
    // 2. Buscar la orden en la BD para actualizarla a "paid"
    
    // 3. Enviar email al cliente usando Resend
    // await resend.emails.send({
    //   from: 'onboarding@resend.dev', // Cambiar por tu dominio verificado
    //   to: 'cliente@ejemplo.com', // Sacar el email de la orden de MP
    //   subject: '¡Tu camiseta está en camino! ⚽',
    //   html: '<p>Confirmamos el pago de tu compra. ¡Gracias por elegir 11 ONZE CAMISETAS!</p>'
    // });

    res.status(200).send("Webhook recibido y procesado");
  } catch (error) {
    console.error("Error procesando webhook de MP:", error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};

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
