const { PrismaClient } = require('@prisma/client');

// Hardcode DATABASE_URL
process.env.DATABASE_URL = "postgresql://jeeey:Abc1234567890XYZ@127.0.0.1:55432/jeeey?schema=public&connection_limit=15&pool_timeout=30&connect_timeout=5&sslmode=disable";

const db = new PrismaClient();

async function main() {
  console.log('Migrating PAID -> PROCESSING...');
  try {
    const r1 = await db.$executeRawUnsafe(`UPDATE "Order" SET "status"='PROCESSING' WHERE "status"='PAID'`);
    console.log(`Updated ${r1} orders from PAID to PROCESSING.`);
  } catch (e) {
    console.log('Error updating PAID:', e.message);
  }

  console.log('Migrating SHIPPED -> OUT_FOR_DELIVERY...');
  try {
    const r2 = await db.$executeRawUnsafe(`UPDATE "Order" SET "status"='OUT_FOR_DELIVERY' WHERE "status"='SHIPPED'`);
    console.log(`Updated ${r2} orders from SHIPPED to OUT_FOR_DELIVERY.`);
  } catch (e) {
    console.log('Error updating SHIPPED:', e.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await db.$disconnect();
  });
