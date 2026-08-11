"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const db_1 = __importDefault(require("../config/db"));
const getSettings = async (req, res) => {
    try {
        let settings = await db_1.default.storeSettings.findFirst();
        if (!settings) {
            settings = await db_1.default.storeSettings.create({
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
        let settings = await db_1.default.storeSettings.findFirst();
        if (settings) {
            settings = await db_1.default.storeSettings.update({
                where: { id: settings.id },
                data: {
                    shippingCost: Number(shippingCost) || 0,
                    freeShippingThreshold: Number(freeShippingThreshold) || 0
                }
            });
        }
        else {
            settings = await db_1.default.storeSettings.create({
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
