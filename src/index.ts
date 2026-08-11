import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import settingsRoutes from './routes/settings.routes';

const app = express();
const port = process.env.PORT || 4000;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://www.onzecamisetas.com.ar',
  'https://onzecamisetas.com.ar'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir origin undefined (webhooks o herramientas backend) o dominios en whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  }
}));

app.use(express.json());

// Global Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 150, // 150 requests por IP
  message: { error: 'Demasiadas peticiones (Rate Limit)' },
});
app.use('/api/', apiLimiter);

// Strict Rate Limiter for Login
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 intentos por IP
  message: { error: 'Demasiados intentos de login (Rate Limit)' },
});

app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '11 ONZE CAMISETAS Backend is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
