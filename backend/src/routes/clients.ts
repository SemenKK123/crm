import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  inn: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const { search } = req.query;
  const clients = await prisma.client.findMany({
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

router.get('/:id', async (req, res: Response) => {
  const id = parseInt(req.params.id);
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      tickets: {
        include: { assignee: { select: { name: true } }, creator: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!client) return res.status(404).json({ error: 'Not found' });
  res.json(client);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const client = await prisma.client.create({ data: parsed.data });
  await prisma.auditLog.create({ data: { action: `Created client ${client.name}`, userId: req.user!.id } });
  res.status(201).json(client);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const client = await prisma.client.update({ where: { id }, data: parsed.data });
  res.json(client);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  await prisma.client.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
