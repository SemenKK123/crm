import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { from, to, assigneeId } = req.query;
  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(String(from));
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(String(to));
  }
  if (assigneeId) where.assigneeId = parseInt(String(assigneeId));

  const [tickets, byStatus, byPriority, byCategory, byAssignee] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        client: { select: { name: true, company: true } },
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.ticket.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ['priority'], where, _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ['category'], where, _count: { _all: true } }),
    prisma.ticket.groupBy({ by: ['assigneeId'], where, _count: { _all: true } }),
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

export default router;
