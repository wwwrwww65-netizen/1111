
import { db } from '@repo/db';

async function checkRaw() {
    try {
        console.log('--- Shipping Zones (Raw) ---');
        const zones: any[] = await db.$queryRaw`SELECT id, name, "isActive", "createdAt" FROM "ShippingZone" ORDER BY "createdAt" DESC`;
        console.log(`Count: ${zones.length}`);
        zones.forEach(z => console.log(`- [${z.isActive ? 'ACTIVE' : 'INACTIVE'}] ${z.name} (${z.id})`));

        console.log('\n--- Delivery Rates (Raw) ---');
        const rates: any[] = await db.$queryRaw`SELECT id, "zoneId", "baseFee", "isActive" FROM "DeliveryRate"`;
        console.log(`Count: ${rates.length}`);

        const zoneIds = new Set(zones.map(z => z.id));
        const orphans = rates.filter(r => !zoneIds.has(r.zoneId));
        console.log(`Orphans: ${orphans.length}`);
        if (orphans.length > 0) {
            orphans.forEach(o => console.log(`  Orphan Rate: ${o.id} (Zone: ${o.zoneId})`));
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

checkRaw();
