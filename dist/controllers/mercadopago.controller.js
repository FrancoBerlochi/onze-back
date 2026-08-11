"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = exports.receiveWebhook = void 0;
require("dotenv/config");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const resend_1 = require("resend");
const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
// Reemplazar 'tu_api_key' por la verdadera desde las variables de entorno
const resend = new resend_1.Resend(process.env.RESEND_API_KEY || 're_test123');
const receiveWebhook = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error procesando webhook de MP:", error);
        res.status(500).json({ error: 'Error procesando webhook' });
    }
};
exports.receiveWebhook = receiveWebhook;
const getOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo órdenes' });
    }
};
exports.getOrders = getOrders;
