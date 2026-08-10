import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando inyección de datos de prueba...');

  const productos = [
    {
      name: 'Camiseta Argentina',
      price: 45000,
      category: 'Nacional' as const,
      type: 'Titular' as const,
      image: '/argentina-titular.webp',
      featured: true,
    },
    {
      name: 'Camiseta Boca Juniors',
      price: 42000,
      category: 'Nacional' as const,
      type: 'Suplente' as const,
      image: '/boca-suplente.webp',
      featured: false,
    },
    {
      name: 'Camiseta Real Madrid',
      price: 55000,
      category: 'Internacional' as const,
      type: 'Titular' as const,
      image: '/real-madrid-titular.webp',
      featured: true,
    }
  ];

  for (const p of productos) {
    const created = await prisma.product.create({
      data: p,
    });
    console.log(`Creado: ${created.name}`);
  }

  console.log('¡Datos inyectados correctamente!');
}

main()
  .catch((e) => {
    console.error('Error inyectando datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
