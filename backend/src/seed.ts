import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

async function main() {
  const adminPw = await bcrypt.hash('admin123', 10);
  const specPw = await bcrypt.hash('spec123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {},
    create: { email: 'admin@crm.local', name: 'Администратор', password: adminPw, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'manager@crm.local' },
    update: {},
    create: { email: 'manager@crm.local', name: 'Менеджер Иванов', password: specPw, role: 'MANAGER' },
  });
  await prisma.user.upsert({
    where: { email: 'spec@crm.local' },
    update: {},
    create: { email: 'spec@crm.local', name: 'Специалист Петров', password: specPw, role: 'SPECIALIST' },
  });
  await prisma.user.upsert({
    where: { email: 'head@crm.local' },
    update: {},
    create: { email: 'head@crm.local', name: 'Руководитель Сидоров', password: specPw, role: 'HEAD' },
  });

  const cats = ['Техническая поддержка', 'Биллинг', 'Консультация', 'Претензия', 'Другое'];
  for (const name of cats) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name, slaHours: 24 } });
  }

  const client = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'ООО Ромашка', email: 'info@romashka.ru', phone: '+7 (999) 123-45-67', company: 'ООО Ромашка', inn: '1234567890' },
  });

  const admin = await prisma.user.findUnique({ where: { email: 'admin@crm.local' } });
  const spec = await prisma.user.findUnique({ where: { email: 'spec@crm.local' } });

  await prisma.ticket.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Не работает личный кабинет',
      description: 'Клиент сообщает, что не может войти в личный кабинет с 10:00.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'Техническая поддержка',
      clientId: client.id,
      creatorId: admin!.id,
      assigneeId: spec!.id,
      slaDeadline: new Date(Date.now() + 2 * 3600000),
    },
  });

  console.log('✅ Seed complete');
  console.log('admin@crm.local / admin123');
  console.log('spec@crm.local / spec123');
  console.log('manager@crm.local / spec123');
  console.log('head@crm.local / spec123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
