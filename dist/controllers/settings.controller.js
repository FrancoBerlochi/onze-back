"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const getSettings = async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ error: "Error fetching settings" });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
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
        }
        else {
            settings = await prisma.storeSettings.create({
                data: {
                    shippingCost: Number(shippingCost) || 0,
                    freeShippingThreshold: Number(freeShippingThreshold) || 0
                }
            });
        }
        res.json(settings);
    }
    catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ error: "Error updating settings" });
    }
};
exports.updateSettings = updateSettings;
