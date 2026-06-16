"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
const schema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    company: zod_1.z.string().optional(),
    inn: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
router.get('/', async (req, res) => {
    const { search } = req.query;
    const clients = await prisma_1.default.client.findMany({
        where: search ? {
            OR: [
                { name: { contains: String(search), mode: 'insensitive' } },
                { company: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search) } },
            ]
        } : undefined,
        include: { _count: { select: { tickets: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(clients);
});
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const client = await prisma_1.default.client.findUnique({
        where: { id },
        include: {
            tickets: {
                include: { assignee: { select: { name: true } }, creator: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
    if (!client)
        return res.status(404).json({ error: 'Not found' });
    res.json(client);
});
router.post('/', async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.issues });
    const client = await prisma_1.default.client.create({ data: parsed.data });
    await prisma_1.default.auditLog.create({ data: { action: `Created client ${client.name}`, userId: req.user.id } });
    res.status(201).json(client);
});
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.issues });
    const client = await prisma_1.default.client.update({ where: { id }, data: parsed.data });
    res.json(client);
});
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    await prisma_1.default.client.delete({ where: { id } });
    res.json({ success: true });
});
exports.default = router;
