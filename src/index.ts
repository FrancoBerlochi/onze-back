import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import mercadopagoRoutes from './routes/mercadopago.routes';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/mercadopago', mercadopagoRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: '11 ONZE CAMISETAS Backend is running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
