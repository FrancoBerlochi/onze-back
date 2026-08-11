"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
require("dotenv/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("CRITICAL: JWT_SECRET is not defined in environment variables");
}
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db_1.default.adminUser.findUnique({ where: { username } });
        if (!user) {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            return;
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: '1d',
        });
        res.json({ token, username: user.username });
    }
    catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.login = login;
