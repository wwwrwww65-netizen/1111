
import { db } from '@repo/db';

async function dropTable() {
    try {
        console.log('Dropping DeliveryRate table to fix column limit issue...');
        await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "DeliveryRate" CASCADE;`);
        console.log('Table dropped.');
    } catch (e) {
        console.error('Drop failed:', e);
    }
}

dropTable()
    .catch(e => console.error(e))
    .finally(() => process.exit(0));
