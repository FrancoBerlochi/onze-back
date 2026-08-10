"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const prisma_1 = require("../generated/prisma");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new prisma_1.PrismaClient({ adapter });
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_11_onze';
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.adminUser.findUnique({ where: { username } });
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
