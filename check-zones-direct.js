
const path = require('path');
require('./packages/api/node_modules/dotenv').config({ path: path.join(__dirname, 'packages/api/.env') });

if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace('55432', '5432');
}

const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting...');
        const zones = await prisma.$queryRaw`SELECT * FROM "ShippingZone"`;
        console.log('Zones found:', zones.length);
        zones.forEach(z => console.log(`- [${z.isActive ? 'ACTIVE' : 'INACTIVE'}] ${z.name} (${z.id})`));

        console.log('\nChecking DeliveryRate...');
        const rates = await prisma.$queryRaw`SELECT * FROM "DeliveryRate"`;
        console.log('Rates found:', rates.length);

        const zoneIds = new Set(zones.map(z => z.id));
        const orphans = rates.filter(r => !zoneIds.has(r.zoneId));

        if (orphans.length > 0) {
            console.log('WARNING: Found orphaned rates:', orphans.length);
            orphans.forEach(o => console.log(`- Rate ${o.id} has invalid zoneId: ${o.zoneId}`));
        } else {
            console.log('No orphaned rates found.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
