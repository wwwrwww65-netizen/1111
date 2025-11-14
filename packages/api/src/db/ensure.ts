import { db } from '@repo/db';

export async function ensureSchemaSafe(): Promise<void> {
  try {
    // Remove unsafe DEFAULT expressions that reference columns (Postgres 0A000)
    await db.$executeRawUnsafe(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN SELECT table_name, column_name, column_default
                 FROM information_schema.columns
                 WHERE table_schema = 'public' AND column_default IS NOT NULL
        LOOP
          IF position(r.column_name in r.column_default) > 0 THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', r.table_name, r.column_name);
          END IF;
        END LOOP;
      END$$;
    `);
  } catch (_) {}
  // Ensure analytics/Event optional columns exist (forward/backward compatible)
  try { await db.$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "utmContent" TEXT'); } catch {}
  try { await db.$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT'); } catch {}
}

// Re-export db for other modules importing from this file
export { db };

