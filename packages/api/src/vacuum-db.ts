
import { db } from '@repo/db';

async function vacuum() {
    try {
        console.log('Starting VACUUM FULL...');
        // VACUUM cannot run inside a transaction block. 
        // Prisma might wrap this, but let's try.
        await db.$executeRawUnsafe(`VACUUM FULL;`);
        console.log('VACUUM FULL completed.');
    } catch (e) {
        console.error('VACUUM failed:', e);
    }
}

vacuum()
    .catch(e => console.error(e))
    .finally(() => process.exit(0));
