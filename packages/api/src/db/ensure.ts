import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const db = prisma;

export async function ensureSchemaSafe(): Promise<void> {
  try {
    // Remove unsafe DEFAULT expressions that reference columns (Postgres 0A000)
    await prisma.$executeRawUnsafe(`
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
}

