#!/usr/bin/env node
// Ensure Category SEO/structure columns exist in the connected DB (idempotent)
require('dotenv/config');
const { db } = require('@repo/db');

async function ensure() {
  try {
    // Create columns if missing
    await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "slug" TEXT');
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category" ("slug") WHERE "slug" IS NOT NULL');
    const cols = [
      'seoTitle TEXT',
      'seoDescription TEXT',
      'seoKeywords TEXT[]',
      'translations JSONB',
      'sortOrder INTEGER DEFAULT 0',
      'image TEXT',
      'parentId TEXT',
    ];
    for (const col of cols) {
      try { await db.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS ${col}`); } catch {}
    }
    // Ensure FK for parentId
    await db.$executeRawUnsafe(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CategoryHierarchy_parentId_fkey') THEN ALTER TABLE \"Category\" ADD CONSTRAINT \"CategoryHierarchy_parentId_fkey\" FOREIGN KEY (\"parentId\") REFERENCES \"Category\"(\"id\") ON DELETE SET NULL; END IF; END $$;"
    );
    console.log('[ensure-category-seo] ok');
  } catch (e) {
    console.error('[ensure-category-seo] failed:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    try { await db.$disconnect(); } catch {}
  }
}

ensure();

