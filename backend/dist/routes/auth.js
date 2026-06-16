"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'crm_secret_key_change_in_prod';
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid input' });
    const { email, password } = parsed.data;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !user.isActive)
        return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcryptjs_1.default.compare(password, user.password);
    if (!valid)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } });
    res.json(user);
});
router.put('/change-password', auth_1.authenticate, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6)
        return res.status(400).json({ error: 'Invalid input' });
    const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id } });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!valid)
        return res.status(400).json({ error: 'Wrong current password' });
    const hashed = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.default.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ success: true });
});
exports.default = router;
