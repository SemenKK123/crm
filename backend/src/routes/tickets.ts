import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: z.string().min(1),
  clientId: z.number(),
  assigneeId: z.number().optional(),
  slaHours: z.number().optional(),
});

const ticketInclude = {
  client: { select: { id: true, name: true, company: true } },
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true } },
  comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' as const } },
};

router.get('/', async (req: AuthRequest, res: Response) => {
  const { status, priority, assigneeId, search } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = parseInt(String(assigneeId));
  if (search) where.OR = [
    { title: { contains: String(search), mode: 'insensitive' } },
    { description: { contains: String(search), mode: 'insensitive' } },
  ];

  const tickets = await prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: { createdAt: 'desc' },
  });
  res.json(tickets);
});

router.get('/:id', async (req, res: Response) => {
  const id = parseInt(req.params.id);
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  res.json(ticket);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const { slaHours, ...data } = parsed.data;
  let slaDeadline: Date | undefined;
  if (slaHours) {
    slaDeadline = new Date(Date.now() + slaHours * 3600000);
  } else {
    const cat = await prisma.category.findFirst({ where: { name: data.category } });
    if (cat) slaDeadline = new Date(Date.now() + cat.slaHours * 3600000);
  }

  const ticket = await prisma.ticket.create({
    data: { ...data, creatorId: req.user!.id, slaDeadline },
    include: ticketInclude,
  });
  await prisma.auditLog.create({ data: { action: 'Created ticket', details: ticket.title, userId: req.user!.id, ticketId: ticket.id } });
  res.status(201).json(ticket);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { title, description, priority, category, assigneeId, status } = req.body;

  const old = await prisma.ticket.findUnique({ where: { id } });
  if (!old) return res.status(404).json({ error: 'Not found' });

  const data: Record<string, unknown> = { title, description, priority, category, assigneeId, status };
  if (status === 'RESOLVED' && old.status !== 'RESOLVED') data.resolvedAt = new Date();

  const ticket = await prisma.ticket.update({ where: { id }, data, include: ticketInclude });
  await prisma.auditLog.create({ data: { action: `Updated ticket status to ${status || old.status}`, userId: req.user!.id, ticketId: id } });
  res.json(ticket);
});

router.post('/:id/comments', async (req: AuthRequest, res: Response) => {
  const ticketId = parseInt(req.params.id);
  const { text, isInternal } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  const comment = await prisma.comment.create({
    data: { text, isInternal: !!isInternal, ticketId, authorId: req.user!.id },
    include: { author: { select: { id: true, name: true } } },
  });
  await prisma.auditLog.create({ data: { action: 'Added comment', userId: req.user!.id, ticketId } });
  res.status(201).json(comment);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  await prisma.comment.deleteMany({ where: { ticketId: id } });
  await prisma.auditLog.deleteMany({ where: { ticketId: id } });
  await prisma.ticket.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
