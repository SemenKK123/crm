import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res: Response) => {
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(cats);
});

router.post('/', requireRole('ADMIN', 'HEAD'), async (req: AuthRequest, res: Response) => {
  const { name, slaHours } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const cat = await prisma.category.create({ data: { name, slaHours: slaHours || 24 } });
  res.status(201).json(cat);
});

router.put('/:id', requireRole('ADMIN', 'HEAD'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, slaHours } = req.body;
  const cat = await prisma.category.update({ where: { id }, data: { name, slaHours } });
  res.json(cat);
});

router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  await prisma.category.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
