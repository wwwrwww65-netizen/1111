
import { db } from '@repo/db';

async function fixConstraint() {
    try {
        console.log('Attempting to drop constraint Order_code_key...');
        await db.$executeRawUnsafe(`ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_code_key";`);
        console.log('Constraint dropped (if it existed).');

        console.log('Attempting to drop index Order_code_key...');
        await db.$executeRawUnsafe(`DROP INDEX IF EXISTS "Order_code_key";`);
        console.log('Index dropped (if it existed).');

        console.log('Fix complete. You can now run db push.');
    } catch (e) {
        console.error('Error fixing constraint:', e);
    }
}

fixConstraint()
    .catch(e => console.error(e))
    .finally(() => process.exit(0));
