import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Resend } from 'resend';
import 'dotenv/config';

const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_123');

// Configuración de Mercado Pago
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-123456789-123456-123456789-123456789'
});

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, customer, total } = req.body;
    
    // 1. Guardar la orden en la base de datos (Estado PENDING)
    const order = await prisma.order.create({
      data: {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        address: customer.address,
        city: customer.city,
        zipCode: customer.zipCode,
        total: total,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            size: item.size,
            customization: item.customization || null,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    // 2. Armar la preferencia para Mercado Pago
    const preference = new Preference(mpClient);
    
    // IMPORTANTE: URL de ngrok para desarrollo. En producción usar tu dominio real.
    const baseUrl = process.env.PUBLIC_URL || 'https://tu-ngrok-url.ngrok.app';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const body: any = {
      items: items.map((item: any) => ({
        id: item.productId,
        title: `${item.name} - Talle ${item.size}`,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'ARS'
      })),
      payer: {
        name: customer.name,
        email: customer.email,
      },
      back_urls: {
        success: `${frontendUrl}/carrito/gracias`,
        failure: `${frontendUrl}/carrito`,
        pending: `${frontendUrl}/carrito`
      },
      auto_return: "approved",
      purpose: "wallet_purchase",
      external_reference: order.id,
      notification_url: `${baseUrl}/api/orders/webhook`
    };

    let init_point = "";
    
    try {
      const result = await preference.create({ body });
      init_point = result.init_point!;
      
      // Guardar el preference ID por las dudas
      await prisma.order.update({
        where: { id: order.id },
        data: { mpPreferenceId: result.id }
      });
    } catch (mpError: any) {
      console.warn("Mercado Pago rechazó el token de prueba. Usando redirección simulada.");
      // Si el token es de prueba y falla, usamos un enlace falso directo a "gracias" para poder probar el Frontend
      init_point = `${frontendUrl}/carrito/gracias?fake_order=${order.id}`;
    }
    
    res.json({ init_point });
  } catch (error) {
    console.error("Error creating checkout:", error);
    res.status(500).json({ error: "Error al generar el pago" });
  }
};

export const mpWebhook = async (req: Request, res: Response): Promise<void> => {
  // Mercado Pago exige que respondamos 200 OK lo antes posible
  res.status(200).send("OK");
  
  const { type, data } = req.body;
  
  if (type === 'payment' && data?.id) {
    try {
      const payment = new Payment(mpClient);
      const paymentInfo = await payment.get({ id: data.id });
      
      if (paymentInfo.status === 'approved' && paymentInfo.external_reference) {
        const orderId = paymentInfo.external_reference;
        
        // Evitar procesar dos veces el mismo webhook
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (existingOrder && existingOrder.status === 'PENDING') {
          // 1. Marcar como ACCEPTED
          await prisma.order.update({
            where: { id: orderId },
            data: { 
              status: 'ACCEPTED',
              mpPaymentId: paymentInfo.id?.toString()
            }
          });

          // 2. Descontar stock
          for (const item of existingOrder.items) {
            const sizeField = `stock${item.size}`;
            
            // Usamos raw o update de manera dinámica (ej: stockM: { decrement: quantity })
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                [sizeField]: {
                  decrement: item.quantity
                }
              }
            });
          }

          // 3. Enviar correos con Resend (desactivado si no hay API key real)
          if (process.env.RESEND_API_KEY) {
            try {
              // Mail para el cliente
              await resend.emails.send({
                from: 'Onze Camisetas <ventas@tu-dominio.com>', // Necesitás verificar un dominio en Resend
                to: [existingOrder.customerEmail],
                subject: '¡Tu pedido está confirmado! ⚽',
                html: `<h1>Gracias por tu compra, ${existingOrder.customerName}</h1><p>Estamos preparando tu pedido. Pronto nos pondremos en contacto para el envío.</p>`
              });

              // Mail para el dueño
              await resend.emails.send({
                from: 'Sistema Onze <ventas@tu-dominio.com>',
                to: ['tu-email-personal@gmail.com'], // Cambiar por tu mail
                subject: '💰 ¡Nueva Venta Ingresada!',
                html: `<h1>Nueva venta de $${existingOrder.total}</h1><p>El cliente ${existingOrder.customerName} acaba de pagar su pedido. Revisá el panel de administración.</p>`
              });
            } catch (emailError) {
              console.error("Error enviando emails:", emailError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error procesando webhook de Mercado Pago:", error);
    }
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    res.json(orders);
  } catch (error) {
    console.error("Error obteniendo órdenes:", error);
    res.status(500).json({ error: "Error al cargar pedidos" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    // Si cambia a CANCELLED, debemos reponer el stock
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (status === 'CANCELLED' && existingOrder.status === 'ACCEPTED') {
      // Reponer stock
      for (const item of existingOrder.items) {
        const sizeField = `stock${item.size}`;
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            [sizeField]: {
              increment: item.quantity
            }
          }
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error actualizando estado del pedido:", error);
    res.status(500).json({ error: "Error al actualizar pedido" });
  }
};
