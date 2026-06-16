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
    const cats = await prisma_1.default.category.findMany({ orderBy: { name: 'asc' } });
    res.json(cats);
});
router.post('/', (0, auth_1.requireRole)('ADMIN', 'HEAD'), async (req, res) => {
    const { name, slaHours } = req.body;
    if (!name)
        return res.status(400).json({ error: 'Name required' });
    const cat = await prisma_1.default.category.create({ data: { name, slaHours: slaHours || 24 } });
    res.status(201).json(cat);
});
router.put('/:id', (0, auth_1.requireRole)('ADMIN', 'HEAD'), async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, slaHours } = req.body;
    const cat = await prisma_1.default.category.update({ where: { id }, data: { name, slaHours } });
    res.json(cat);
});
router.delete('/:id', (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    const id = parseInt(req.params.id);
    await prisma_1.default.category.delete({ where: { id } });
    res.json({ success: true });
});
exports.default = router;
