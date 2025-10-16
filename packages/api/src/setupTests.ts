process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret_for_tests';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/app';
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}
// Force NODE_ENV=test for predictable server behavior in tests
process.env.NODE_ENV = 'test';

// Repair any stray test DB URL overrides from previous builds
if (process.env.DATABASE_URL && /postgresql:\/\/test:test@localhost/.test(process.env.DATABASE_URL)) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/app';
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Ensure Category SEO/sort columns exist for tests without running full migrations
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { db } = require('@repo/db');
  const ensure = async () => {
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "slug" TEXT'); } catch {}
    // Do NOT create the unique index here to avoid conflicts with Prisma db push
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT[]'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "translations" JSONB'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "image" TEXT'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT'); } catch {}
    // Ensure Currency table exists for tests
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Currency" (
          "id" TEXT PRIMARY KEY,
          "code" TEXT UNIQUE NOT NULL,
          "name" TEXT NOT NULL,
          "symbol" TEXT NOT NULL,
          "precision" INTEGER NOT NULL DEFAULT 2,
          "rateToBase" DOUBLE PRECISION NOT NULL DEFAULT 1,
          "isBase" BOOLEAN NOT NULL DEFAULT FALSE,
          "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ShippingZone" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "countryCodes" TEXT[] NOT NULL,
          "regions" JSONB,
          "cities" JSONB,
          "areas" JSONB,
          "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DeliveryRate" (
          "id" TEXT PRIMARY KEY,
          "zoneId" TEXT NOT NULL REFERENCES "ShippingZone"("id") ON DELETE CASCADE,
          "carrier" TEXT,
          "minWeightKg" DOUBLE PRECISION,
          "maxWeightKg" DOUBLE PRECISION,
          "baseFee" DOUBLE PRECISION NOT NULL,
          "perKgFee" DOUBLE PRECISION,
          "minSubtotal" DOUBLE PRECISION,
          "freeOverSubtotal" DOUBLE PRECISION,
          "etaMinHours" INTEGER,
          "etaMaxHours" INTEGER,
          "offerTitle" TEXT,
          "activeFrom" TIMESTAMP,
          "activeUntil" TIMESTAMP,
          "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PaymentGateway" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "provider" TEXT NOT NULL,
          "mode" TEXT NOT NULL DEFAULT 'TEST',
          "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "feesFixed" DOUBLE PRECISION,
          "feesPercent" DOUBLE PRECISION,
          "minAmount" DOUBLE PRECISION,
          "maxAmount" DOUBLE PRECISION,
          "credentials" JSONB,
          "options" JSONB,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GuestCart" (
          "id" TEXT PRIMARY KEY,
          "sessionId" TEXT UNIQUE NOT NULL,
          "userAgent" TEXT,
          "ip" TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GuestCartItem" (
          "id" TEXT PRIMARY KEY,
          "cartId" TEXT NOT NULL REFERENCES "GuestCart"("id") ON DELETE CASCADE,
          "productId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "addedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
    } catch {}
  };
  // Ensure schema is ready before tests start
  beforeAll(async () => {
    try { await ensure(); } catch {}
  });
} catch {}