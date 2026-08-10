import { Router } from 'express';
import { receiveWebhook, getOrders } from '../controllers/mercadopago.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint público para que Mercado Pago envíe notificaciones
router.post('/webhook', receiveWebhook);

// Endpoint protegido para leer las órdenes en el admin panel
router.get('/orders', verifyToken, getOrders);

export default router;
