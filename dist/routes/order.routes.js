"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rutas públicas (Frontend y Mercado Pago)
router.post('/checkout', order_controller_1.createCheckout);
router.post('/webhook', order_controller_1.mpWebhook);
// Rutas protegidas (Admin Panel)
router.get('/', auth_middleware_1.verifyToken, order_controller_1.getOrders);
router.patch('/:id/status', auth_middleware_1.verifyToken, order_controller_1.updateOrderStatus);
exports.default = router;
