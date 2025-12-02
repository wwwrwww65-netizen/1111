
import { db } from '@repo/db';

async function checkData() {
    try {
        const zones = await db.shippingZone.findMany();
        console.log('Zones count:', zones.length);
        console.log('Zones:', JSON.stringify(zones, null, 2));

        const rates = await db.deliveryRate.findMany();
        console.log('Rates count:', rates.length);
        console.log('Rates:', JSON.stringify(rates, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

checkData();
