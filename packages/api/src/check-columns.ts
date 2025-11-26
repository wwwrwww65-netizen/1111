
import { db } from '@repo/db';

async function checkColumns() {
    try {
        const result = await db.$queryRaw`
      SELECT table_name, count(*) as column_count
      FROM information_schema.columns
      WHERE table_schema = 'public'
      GROUP BY table_name
      ORDER BY column_count DESC
      LIMIT 10;
    `;
        console.log('Top 10 tables by column count:', result);

        // Also check for dropped columns if possible (pg_attribute check)
        // attisdropped = true
        const dropped = await db.$queryRaw`
      SELECT relname as table_name, count(*) as dropped_column_count
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      WHERE a.attisdropped = true
      AND c.relnamespace = 'public'::regnamespace
      GROUP BY relname
      ORDER BY dropped_column_count DESC;
    `;
        console.log('Tables with dropped columns:', dropped);

    } catch (e) {
        console.error(e);
    }
}

checkColumns()
    .catch(e => console.error(e))
    .finally(() => process.exit(0));
