import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await prisma.storeSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          shippingCost: 0,
          freeShippingThreshold: 0
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Error fetching settings" });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shippingCost, freeShippingThreshold } = req.body;
    
    let settings = await prisma.storeSettings.findFirst();
    
    if (settings) {
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: { 
          shippingCost: Number(shippingCost) || 0,
          freeShippingThreshold: Number(freeShippingThreshold) || 0
        }
      });
    } else {
      settings = await prisma.storeSettings.create({
        data: {
          shippingCost: Number(shippingCost) || 0,
          freeShippingThreshold: Number(freeShippingThreshold) || 0
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Error updating settings" });
  }
};
