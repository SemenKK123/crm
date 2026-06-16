import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'SPECIALIST', 'HEAD']),
});

router.get('/', async (_req, res: Response) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } });
  res.json(users);
});

router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const { name, email, password, role } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already in use' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hashed, role }, select: { id: true, name: true, email: true, role: true, isActive: true } });

  await prisma.auditLog.create({ data: { action: `Created user ${email}`, userId: req.user!.id } });
  res.status(201).json(user);
});

router.put('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, role, isActive } = req.body;
  const user = await prisma.user.update({ where: { id }, data: { name, role, isActive }, select: { id: true, name: true, email: true, role: true, isActive: true } });
  await prisma.auditLog.create({ data: { action: `Updated user ${user.email}`, userId: req.user!.id } });
  res.json(user);
});

router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  res.json({ success: true });
});

export default router;
