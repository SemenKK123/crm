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
const createSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    category: zod_1.z.string().min(1),
    clientId: zod_1.z.number(),
    assigneeId: zod_1.z.number().optional(),
    slaHours: zod_1.z.number().optional(),
});
const ticketInclude = {
    client: { select: { id: true, name: true, company: true } },
    assignee: { select: { id: true, name: true, email: true } },
    creator: { select: { id: true, name: true } },
    comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } },
};
router.get('/', async (req, res) => {
    const { status, priority, assigneeId, search } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (assigneeId)
        where.assigneeId = parseInt(String(assigneeId));
    if (search)
        where.OR = [
            { title: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
        ];
    const tickets = await prisma_1.default.ticket.findMany({
        where,
        include: ticketInclude,
        orderBy: { createdAt: 'desc' },
    });
    res.json(tickets);
});
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const ticket = await prisma_1.default.ticket.findUnique({ where: { id }, include: ticketInclude });
    if (!ticket)
        return res.status(404).json({ error: 'Not found' });
    res.json(ticket);
});
router.post('/', async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.issues });
    const { slaHours, ...data } = parsed.data;
    let slaDeadline;
    if (slaHours) {
        slaDeadline = new Date(Date.now() + slaHours * 3600000);
    }
    else {
        const cat = await prisma_1.default.category.findFirst({ where: { name: data.category } });
        if (cat)
            slaDeadline = new Date(Date.now() + cat.slaHours * 3600000);
    }
    const ticket = await prisma_1.default.ticket.create({
        data: { ...data, creatorId: req.user.id, slaDeadline },
        include: ticketInclude,
    });
    await prisma_1.default.auditLog.create({ data: { action: 'Created ticket', details: ticket.title, userId: req.user.id, ticketId: ticket.id } });
    res.status(201).json(ticket);
});
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, description, priority, category, assigneeId, status } = req.body;
    const old = await prisma_1.default.ticket.findUnique({ where: { id } });
    if (!old)
        return res.status(404).json({ error: 'Not found' });
    const data = { title, description, priority, category, assigneeId, status };
    if (status === 'RESOLVED' && old.status !== 'RESOLVED')
        data.resolvedAt = new Date();
    const ticket = await prisma_1.default.ticket.update({ where: { id }, data, include: ticketInclude });
    await prisma_1.default.auditLog.create({ data: { action: `Updated ticket status to ${status || old.status}`, userId: req.user.id, ticketId: id } });
    res.json(ticket);
});
router.post('/:id/comments', async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { text, isInternal } = req.body;
    if (!text)
        return res.status(400).json({ error: 'Text required' });
    const comment = await prisma_1.default.comment.create({
        data: { text, isInternal: !!isInternal, ticketId, authorId: req.user.id },
        include: { author: { select: { id: true, name: true } } },
    });
    await prisma_1.default.auditLog.create({ data: { action: 'Added comment', userId: req.user.id, ticketId } });
    res.status(201).json(comment);
});
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    await prisma_1.default.comment.deleteMany({ where: { ticketId: id } });
    await prisma_1.default.auditLog.deleteMany({ where: { ticketId: id } });
    await prisma_1.default.ticket.delete({ where: { id } });
    res.json({ success: true });
});
exports.default = router;
