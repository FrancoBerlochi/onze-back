import { Router } from 'express';
import { createCheckout, mpWebhook, getOrders, updateOrderStatus } from '../controllers/order.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas (Frontend y Mercado Pago)
router.post('/checkout', createCheckout);
router.post('/webhook', mpWebhook);

// Rutas protegidas (Admin Panel)
router.get('/', verifyToken, getOrders);
router.patch('/:id/status', verifyToken, updateOrderStatus);

export default router;
