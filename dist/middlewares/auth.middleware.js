"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_11_onze';
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const verified = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // @ts-ignore
        req.user = verified;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};
exports.verifyToken = verifyToken;
