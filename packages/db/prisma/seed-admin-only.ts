import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin-only fixtures...');
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPassword = await bcrypt.hash(rawPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', isVerified: true, twoFactorEnabled: false, password: adminPassword },
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      twoFactorEnabled: false,
    },
  });
  // RBAC base roles/permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Full access' },
  });
  const perms = ['inventory.read','inventory.write','orders.manage','payments.manage','users.manage','coupons.manage','settings.manage'];
  for (const key of perms) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }
  const allPerms = await prisma.permission.findMany({ where: { key: { in: perms } } });
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } }, update: {}, create: { roleId: adminRole.id, permissionId: p.id } });
  }
  const adminUser = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (adminUser) {
    await prisma.userRoleLink.upsert({ where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } }, update: {}, create: { userId: adminUser.id, roleId: adminRole.id } });
  }
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

