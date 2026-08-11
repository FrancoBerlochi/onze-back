import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Evitar crear múltiples pools en desarrollo y producción
const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Instancia única de Prisma (Singleton)
const prisma = new PrismaClient({ adapter });

export default prisma;
