import { Router } from 'express';
import { getOrders } from '../controllers/mercadopago.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// El endpoint público para notificaciones de MP ahora está en order.routes.ts (/api/orders/webhook)
// Endpoint protegido para leer las órdenes en el admin panel
router.get('/orders', verifyToken, getOrders);

export default router;
