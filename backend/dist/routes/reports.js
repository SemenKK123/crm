"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', async (req, res) => {
    const { from, to, assigneeId } = req.query;
    const where = {};
    if (from || to) {
        where.createdAt = {};
        if (from)
            where.createdAt.gte = new Date(String(from));
        if (to)
            where.createdAt.lte = new Date(String(to));
    }
    if (assigneeId)
        where.assigneeId = parseInt(String(assigneeId));
    const [tickets, byStatus, byPriority, byCategory, byAssignee] = await Promise.all([
        prisma_1.default.ticket.findMany({
            where,
            include: {
                client: { select: { name: true, company: true } },
                assignee: { select: { name: true } },
                creator: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.default.ticket.groupBy({ by: ['status'], where, _count: { _all: true } }),
        prisma_1.default.ticket.groupBy({ by: ['priority'], where, _count: { _all: true } }),
        prisma_1.default.ticket.groupBy({ by: ['category'], where, _count: { _all: true } }),
        prisma_1.default.ticket.groupBy({ by: ['assigneeId'], where, _count: { _all: true } }),
    ]);
    const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const withSla = tickets.filter(t => t.slaDeadline);
    const slaBreached = withSla.filter(t => t.resolvedAt && t.slaDeadline && t.resolvedAt > t.slaDeadline);
    res.json({
        tickets,
        summary: { total: tickets.length, resolved: resolved.length, slaCompliance: withSla.length ? Math.round((1 - slaBreached.length / withSla.length) * 100) : 100 },
        byStatus,
        byPriority,
        byCategory,
        byAssignee,
    });
});
exports.default = router;
