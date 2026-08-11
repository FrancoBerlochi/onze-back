"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mercadopago_controller_1 = require("../controllers/mercadopago.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// El endpoint público para notificaciones de MP ahora está en order.routes.ts (/api/orders/webhook)
// Endpoint protegido para leer las órdenes en el admin panel
router.get('/orders', auth_middleware_1.verifyToken, mercadopago_controller_1.getOrders);
exports.default = router;
