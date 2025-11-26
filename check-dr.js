
const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkDeliveryRate() {
    try {
        console.log('Checking DeliveryRate table columns...');
        const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'DeliveryRate';
    `;
        console.log('Columns:', result);
    } catch (e) {
        console.error('Error checking table:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkDeliveryRate();
