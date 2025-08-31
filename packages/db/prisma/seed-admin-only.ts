import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin-only fixtures...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: 'ADMIN', isVerified: true },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });
  // Basic categories without products
  await prisma.category.upsert({
    where: { id: 'seed-electronics' },
    update: {},
    create: { id: 'seed-electronics', name: 'Electronics' },
  });
  await prisma.category.upsert({
    where: { id: 'seed-operations' },
    update: {},
    create: { id: 'seed-operations', name: 'Operations' },
  });
  console.log('✅ Admin-only seed completed');
}

main().finally(async () => prisma.$disconnect());

