import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const now = new Date();

  const [total, byStatus, overdue, recent, byPriority, recentAudit] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.ticket.count({ where: { slaDeadline: { lt: now }, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } }, assignee: { select: { name: true } } },
    }),
    prisma.ticket.groupBy({ by: ['priority'], _count: { _all: true } }),
    prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
  ]);

  res.json({ total, byStatus, overdue, recent, byPriority, recentAudit });
});

export default router;
