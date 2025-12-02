
import { db } from '@repo/db';

async function checkOrphans() {
    try {
        const zones = await db.shippingZone.findMany();
        const rates = await db.deliveryRate.findMany();

        const zoneIds = new Set(zones.map(z => z.id));
        const orphans = rates.filter(r => !zoneIds.has(r.zoneId));

        console.log(`Total Zones: ${zones.length}`);
        console.log(`Total Rates: ${rates.length}`);
        console.log(`Orphaned Rates: ${orphans.length}`);

        if (orphans.length > 0) {
            console.log('Orphaned Rates IDs:', orphans.map(r => r.id));
            console.log('Orphaned Rates ZoneIDs:', orphans.map(r => r.zoneId));
        } else {
            console.log('All rates are linked to valid zones.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkOrphans();
