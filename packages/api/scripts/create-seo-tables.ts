import { db } from '@repo/db';

async function main() {
    console.log('Creating SeoPage table...');
    await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SeoPage" (
      "id" TEXT PRIMARY KEY,
      "slug" TEXT UNIQUE NOT NULL,
      "titleSeo" TEXT,
      "metaDescription" TEXT,
      "focusKeyword" TEXT,
      "canonicalUrl" TEXT,
      "metaRobots" TEXT DEFAULT 'index, follow',
      "ogTags" JSONB,
      "twitterCard" JSONB,
      "schema" JSONB,
      "hiddenContent" TEXT,
      "isActive" BOOLEAN DEFAULT TRUE,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);

    console.log('Creating Redirect table...');
    await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Redirect" (
      "id" TEXT PRIMARY KEY,
      "from" TEXT UNIQUE NOT NULL,
      "to" TEXT NOT NULL,
      "code" INTEGER DEFAULT 301,
      "isActive" BOOLEAN DEFAULT TRUE,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );
  `);

    console.log('Done.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
