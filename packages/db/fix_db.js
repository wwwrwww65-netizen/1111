const { PrismaClient } = require('@prisma/client');

const url = "postgresql://jeeey:Abc1234567890XYZ@127.0.0.1:5432/jeeey?schema=public&connection_limit=15&pool_timeout=30&connect_timeout=5&sslmode=disable";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url,
    },
  },
});

async function main() {
  console.log('Connecting to DB...');
  try {
    console.log('Adding carrier column...');
    await prisma.$executeRawUnsafe('ALTER TABLE "DeliveryRate" ADD COLUMN IF NOT EXISTS "carrier" TEXT;');
    console.log('Adding excludedZoneIds column...');
    await prisma.$executeRawUnsafe('ALTER TABLE "DeliveryRate" ADD COLUMN IF NOT EXISTS "excludedZoneIds" TEXT[] DEFAULT ARRAY[]::TEXT[];');
    console.log('Success!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
