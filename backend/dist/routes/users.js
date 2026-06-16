"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'SPECIALIST', 'HEAD']),
});
router.get('/', async (_req, res) => {
    const users = await prisma_1.default.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } });
    res.json(users);
});
router.post('/', (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.issues });
    const { name, email, password, role } = parsed.data;
    const exists = await prisma_1.default.user.findUnique({ where: { email } });
    if (exists)
        return res.status(409).json({ error: 'Email already in use' });
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({ data: { name, email, password: hashed, role }, select: { id: true, name: true, email: true, role: true, isActive: true } });
    await prisma_1.default.auditLog.create({ data: { action: `Created user ${email}`, userId: req.user.id } });
    res.status(201).json(user);
});
router.put('/:id', (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, role, isActive } = req.body;
    const user = await prisma_1.default.user.update({ where: { id }, data: { name, role, isActive }, select: { id: true, name: true, email: true, role: true, isActive: true } });
    await prisma_1.default.auditLog.create({ data: { action: `Updated user ${user.email}`, userId: req.user.id } });
    res.json(user);
});
router.delete('/:id', (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    const id = parseInt(req.params.id);
    await prisma_1.default.user.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true });
});
exports.default = router;
