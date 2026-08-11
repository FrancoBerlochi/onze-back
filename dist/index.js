"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// CORS Configuration
const allowedOrigins = [
    'http://localhost:3000',
    'https://www.onzecamisetas.com.ar',
    'https://onzecamisetas.com.ar'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir origin undefined (webhooks o herramientas backend) o dominios en whitelist
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Bloqueado por CORS'));
        }
    }
}));
app.use(express_1.default.json());
// Global Rate Limiter
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 150, // 150 requests por IP
    message: { error: 'Demasiadas peticiones (Rate Limit)' },
});
app.use('/api/', apiLimiter);
// Strict Rate Limiter for Login
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 intentos por IP
    message: { error: 'Demasiados intentos de login (Rate Limit)' },
});
app.use('/api/auth', loginLimiter, auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: '11 ONZE CAMISETAS Backend is running' });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
