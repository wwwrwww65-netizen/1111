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
  console.log('Verifying DeliveryRate access...');
  try {
    const rates = await prisma.deliveryRate.findMany({ take: 1 });
    console.log('Successfully fetched rates:', rates);
    
    // Try to create a dummy rate to verify write access for new columns
    // We need a valid zoneId. Let's fetch one first.
    const zone = await prisma.shippingZone.findFirst();
    if (zone) {
        console.log('Found zone:', zone.id);
        // We won't actually create to avoid pollution, or we can create and delete.
        // Just fetching is enough to prove the column mapping is correct for reading.
        // The error "The column ... does not exist" happens on read too if select * is used.
    } else {
        console.log('No zones found, skipping write test.');
    }
    
  } catch (e) {
    console.error('Verification failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
