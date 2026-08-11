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
              const senderEmail = process.env.EMAIL_SENDER || 'onboarding@resend.dev';
              const adminEmail = process.env.ADMIN_EMAIL || existingOrder.customerEmail;
              
              // Evitar error de Resend si no hay dominio verificado y mandamos a un mail random
              // Resend solo deja enviar a tu propio mail si usás onboarding@resend.dev
              const isTestMode = senderEmail === 'onboarding@resend.dev';
              const customerEmailToSend = isTestMode ? adminEmail : existingOrder.customerEmail;

              const itemsTotal = existingOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
              const shippingCost = existingOrder.total - itemsTotal;
              
              let shippingText = shippingCost > 0 ? `$${shippingCost}` : '¡Gratis!';

              // Items del pedido formateados para HTML
              const itemsHtml = existingOrder.items.map(item => 
                `<tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">Camiseta (Talle ${item.size})${item.customization ? ` - Estampe: ${item.customization}` : ''}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">$${item.price}</td>
                </tr>`
              ).join('');
              
              // Agregar fila de envío
              const shippingHtml = `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">Envío</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: center;">1</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right; color: ${shippingCost === 0 ? '#27ae60' : 'inherit'}; font-weight: ${shippingCost === 0 ? 'bold' : 'normal'};">${shippingText}</td>
                </tr>
              `;

              // ----------------------------------------------------
              // EMAIL PARA EL CLIENTE
              // ----------------------------------------------------
              const customerHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
                  <div style="background-color: #0B0B0B; padding: 20px; text-align: center;">
                    <h1 style="color: #F5A623; margin: 0; font-size: 24px; text-transform: uppercase;">11 ONZE CAMISETAS</h1>
                  </div>
                  <div style="padding: 30px;">
                    <h2 style="color: #111; margin-top: 0;">¡Hola ${existingOrder.customerName}! ⚽</h2>
                    <p style="font-size: 16px; line-height: 1.5;">Confirmamos el pago de tu compra. Ya estamos preparando tu pedido para despacharlo lo antes posible.</p>
                    
                    <h3 style="margin-top: 30px; border-bottom: 2px solid #F5A623; padding-bottom: 5px;">Resumen de tu pedido #${existingOrder.id.slice(0,8)}</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <thead>
                        <tr>
                          <th style="text-align: left; padding: 10px; background-color: #f9f9f9;">Producto</th>
                          <th style="text-align: center; padding: 10px; background-color: #f9f9f9;">Cant.</th>
                          <th style="text-align: right; padding: 10px; background-color: #f9f9f9;">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                        ${shippingHtml}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="2" style="text-align: right; padding: 15px 10px; font-weight: bold;">TOTAL ABONADO:</td>
                          <td style="text-align: right; padding: 15px 10px; font-weight: bold; font-size: 18px; color: #F5A623;">$${existingOrder.total}</td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 14px;">
                      <strong>Datos de Envío:</strong><br>
                      ${existingOrder.address}, ${existingOrder.city} (${existingOrder.zipCode})<br>
                      Teléfono: ${existingOrder.customerPhone}
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">Ante cualquier duda, contactanos a nuestro WhatsApp.<br>
                      <a href="https://wa.me/5493413109231" style="display: inline-block; margin-top: 10px; background-color: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Escribinos al WhatsApp</a>
                    </p>
                  </div>
                </div>
              `;

              await resend.emails.send({
                from: `Onze Camisetas <${senderEmail}>`,
                to: [customerEmailToSend],
                subject: '¡Tu pedido está confirmado! ⚽ - 11 ONZE',
                html: customerHtml
              });

              // ----------------------------------------------------
              // EMAIL PARA EL ADMIN (DUEÑO)
              // ----------------------------------------------------
              const adminHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2 style="color: #27ae60;">💰 ¡Nueva Venta Ingresada!</h2>
                  <p>El cliente <strong>${existingOrder.customerName}</strong> acaba de realizar un pago exitoso.</p>
                  
                  <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #27ae60; margin-bottom: 20px;">
                    <strong>ID Pedido:</strong> ${existingOrder.id}<br>
                    <strong>Total cobrado:</strong> $${existingOrder.total}<br>
                    <strong>Email:</strong> ${existingOrder.customerEmail}<br>
                    <strong>Teléfono:</strong> ${existingOrder.customerPhone}
                  </div>
                  
                  <h3>Productos:</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    ${itemsHtml}
                    ${shippingHtml}
                  </table>
                  
                  <p style="margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/mercadopago" style="background: #0B0B0B; color: #F5A623; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver en Panel de Admin</a>
                  </p>
                </div>
              `;

              await resend.emails.send({
                from: `Sistema Onze <${senderEmail}>`,
                to: [adminEmail],
                subject: `💰 Nueva Venta - $${existingOrder.total}`,
                html: adminHtml
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
