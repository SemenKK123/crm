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
router.get('/', async (_req, res) => {
    const now = new Date();
    const [total, byStatus, overdue, recent, byPriority, recentAudit] = await Promise.all([
        prisma_1.default.ticket.count(),
        prisma_1.default.ticket.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma_1.default.ticket.count({ where: { slaDeadline: { lt: now }, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
        prisma_1.default.ticket.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { client: { select: { name: true } }, assignee: { select: { name: true } } },
        }),
        prisma_1.default.ticket.groupBy({ by: ['priority'], _count: { _all: true } }),
        prisma_1.default.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
    ]);
    res.json({ total, byStatus, overdue, recent, byPriority, recentAudit });
});
exports.default = router;
