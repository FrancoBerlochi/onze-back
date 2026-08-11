"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = void 0;
require("dotenv/config");
const resend_1 = require("resend");
const db_1 = __importDefault(require("../config/db"));
// Reemplazar 'tu_api_key' por la verdadera desde las variables de entorno
const resend = new resend_1.Resend(process.env.RESEND_API_KEY || 're_test123');
// El webhook de pagos ahora se maneja íntegramente en order.controller.ts (mpWebhook)
// para poder interactuar directamente con la base de datos de órdenes y stock.
const getOrders = async (req, res) => {
    try {
        const orders = await db_1.default.order.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Error obteniendo órdenes' });
    }
};
exports.getOrders = getOrders;
