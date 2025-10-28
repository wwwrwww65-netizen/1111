// Optional dotenv preload for non-Render environments
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv/config');
} catch {}
// Attempt to load server-level env files (e.g., /var/www/ecom/.env.api) if present
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  const candidatePaths: Array<string|undefined> = [
    process.env.ENV_FILE,
    '/var/www/ecom/.env.api',
    '/srv/ecom/.env.api',
    '/var/www/ecom/.env',
    '/srv/ecom/.env'
  ];
  for (const p of candidatePaths) {
    if (!p) continue;
    try { if (fs.existsSync(p)) { dotenv.config({ path: p }); } } catch {}
  }
} catch {}
import express from 'express';
import path from 'path';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './context';
import { applySecurityMiddleware } from './middleware/security';
import { db } from '@repo/db';
import { ensureSchemaSafe } from './db/ensure';
import cookieParser from 'cookie-parser';
import adminRest from './routers/admin-rest';
import { adminExtra } from './routers/admin-extra';
import shippingWebhooks from './routers/webhooks';
import rbac from './routers/rbac';
import shop from './routers/shop';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { setIo } from './io';

// Optional Sentry init (guarded by env)
let sentryEnabled = false;
let SentryRef: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SentryRef = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    SentryRef.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
      environment: process.env.NODE_ENV || 'production',
    });
    sentryEnabled = true;
  }
} catch {}

const app = express();
// Serve uploaded media as static files with long-term cache
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), { maxAge: '365d', immutable: true }));
if (sentryEnabled && SentryRef) {
  try {
    app.use(SentryRef.Handlers.requestHandler());
    if (SentryRef.Handlers.tracingHandler) app.use(SentryRef.Handlers.tracingHandler());
  } catch {}
}
// Global JSON sanitizer: convert BigInt to Number to avoid serialization errors
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  (res as any).json = (payload: any) => {
    try {
      const safe = JSON.parse(JSON.stringify(payload, (_k, v) => typeof v === 'bigint' ? Number(v) : v));
      return originalJson(safe);
    } catch {
      return originalJson(payload);
    }
  };
  next();
});
// Behind NGINX, trust only loopback to satisfy express-rate-limit without being overly permissive
app.set('trust proxy', 'loopback');
// Ensure cookies are parsed early so /api/me and auth flows can read tokens
app.use(cookieParser());
// Ensure critical DB schema tweaks are applied (idempotent)
async function ensureSchema(): Promise<void> {
  try {
    // Ensure Vendor table exists for admin vendor operations
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Vendor" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"name" TEXT UNIQUE NOT NULL,'+
      '"contactEmail" TEXT NULL,'+
      '"phone" TEXT NULL,'+
      '"address" TEXT NULL,'+
      '"storeName" TEXT NULL,'+
      '"storeNumber" TEXT NULL,'+
      '"vendorCode" TEXT NULL,'+
      '"isActive" BOOLEAN DEFAULT TRUE,'+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    // Ensure vendorCode column exists before creating its index
    try { await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "vendorCode" TEXT'); } catch {}
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_name_key" ON "Vendor"("name")');
    try {
      await db.$executeRawUnsafe(`DO $$ BEGIN IF to_regclass('public."Vendor_vendorCode_key"') IS NULL THEN CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode"); END IF; END $$;`);
    } catch {}
    await db.$executeRawUnsafe('ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION');
    await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vendorId" TEXT');
    // Ensure FK from Product.vendorId -> Vendor.id
    await db.$executeRawUnsafe(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_vendorId_fkey') THEN ALTER TABLE \"Product\" ADD CONSTRAINT \"Product_vendorId_fkey\" FOREIGN KEY (\"vendorId\") REFERENCES \"Vendor\"(\"id\") ON DELETE SET NULL; END IF; END $$;"
    );
    // Ensure Vendor columns exist for admin panel features
    await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priority" TEXT');

    // Category runtime DDL disabled to avoid 54011 (too many columns) on some DBs.
    // Use optional reads with information_schema in admin-rest instead.
    // Ensure Driver table exists for logistics/WS features
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Driver" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"name" TEXT NOT NULL,'+
      '"phone" TEXT NULL,'+
      '"isActive" BOOLEAN DEFAULT TRUE,'+
      '"status" TEXT NULL,'+
      '"lat" DOUBLE PRECISION NULL,'+
      '"lng" DOUBLE PRECISION NULL,'+
      '"lastSeenAt" TIMESTAMP NULL,'+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    // Ensure ShipmentLeg table exists for logistics flows
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "ShipmentLeg" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"orderId" TEXT NULL,'+
      '"poId" TEXT NULL,'+
      '"legType" TEXT NOT NULL,'+
      '"status" TEXT NOT NULL,'+
      '"driverId" TEXT NULL,'+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShipmentLeg_orderId_idx" ON "ShipmentLeg"("orderId")');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShipmentLeg_poId_idx" ON "ShipmentLeg"("poId")');
    // Ensure Package table exists for warehouse pages
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Package" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"barcode" TEXT UNIQUE NULL,'+
      '"status" TEXT NOT NULL DEFAULT \''+"PENDING"+'\','+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Package_status_idx" ON "Package"("status")');
    // Speed up product name/sku search used by admin suggest (ensure extension exists)
    try { await db.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm'); } catch {}
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin (name gin_trgm_ops)'); } catch {}
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Product_sku_idx" ON "Product"(sku)'); } catch {}
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Product_created_idx" ON "Product"("createdAt")'); } catch {}

    // Tab Page Builder tables (idempotent)
    // Ensure Postgres ENUM types expected by Prisma exist
    await db.$executeRawUnsafe(
      'DO $$ BEGIN '\
      +'IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ' + "'DeviceType'" + ') THEN '\
      +'  CREATE TYPE "DeviceType" AS ENUM (' + "'MOBILE','DESKTOP'" + '); '\
      +'END IF; '\
      +'IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ' + "'TabPageStatus'" + ') THEN '\
      +'  CREATE TYPE "TabPageStatus" AS ENUM (' + "'DRAFT','SCHEDULED','PUBLISHED','ARCHIVED'" + '); '\
      +'END IF; '\
      +'END $$;'
    );
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "TabPage" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"slug" TEXT UNIQUE NOT NULL,'+
      '"label" TEXT NOT NULL,'+
      '"device" "DeviceType" NOT NULL DEFAULT ' + "'MOBILE'" + ','+
      '"status" "TabPageStatus" NOT NULL DEFAULT ' + "'DRAFT'" + ','+
      '"scheduledAt" TIMESTAMP NULL,'+
      '"publishedAt" TIMESTAMP NULL,'+
      '"theme" JSONB NULL,'+
      '"permissions" JSONB NULL,'+
      '"currentVersionId" TEXT NULL,'+
      '"createdByUserId" TEXT NULL,'+
      '"updatedByUserId" TEXT NULL,'+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    // If table pre-existed with TEXT columns, coerce to ENUM types
    await db.$executeRawUnsafe(
      'DO $$ BEGIN '\
      +'IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = ' + "'TabPage'" + ' AND column_name = ' + "'device'" + ') THEN '\
      +'  BEGIN '\
      +'    ALTER TABLE "TabPage" ALTER COLUMN "device" TYPE "DeviceType" USING "device"::"DeviceType"; '\
      +'  EXCEPTION WHEN others THEN NULL; '\
      +'  END; '\
      +'  BEGIN '\
      +'    ALTER TABLE "TabPage" ALTER COLUMN "device" SET DEFAULT ' + "'MOBILE'" + '::"DeviceType"; '\
      +'  EXCEPTION WHEN others THEN NULL; '\
      +'  END; '\
      +'END IF; '\
      +'IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = ' + "'TabPage'" + ' AND column_name = ' + "'status'" + ') THEN '\
      +'  BEGIN '\
      +'    ALTER TABLE "TabPage" ALTER COLUMN "status" TYPE "TabPageStatus" USING "status"::"TabPageStatus"; '\
      +'  EXCEPTION WHEN others THEN NULL; '\
      +'  END; '\
      +'  BEGIN '\
      +'    ALTER TABLE "TabPage" ALTER COLUMN "status" SET DEFAULT ' + "'DRAFT'" + '::"TabPageStatus"; '\
      +'  EXCEPTION WHEN others THEN NULL; '\
      +'  END; '\
      +'END IF; '\
      +'END $$;'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "TabPage_device_status_idx" ON "TabPage"("device","status")');
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "TabPageVersion" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"tabPageId" TEXT NOT NULL,'+
      '"version" INTEGER NOT NULL,'+
      '"title" TEXT NULL,'+
      '"content" JSONB NOT NULL,'+
      '"notes" TEXT NULL,'+
      '"createdByUserId" TEXT NULL,'+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      'CONSTRAINT "TabPageVersion_tabPageId_fkey" FOREIGN KEY ("tabPageId") REFERENCES "TabPage"("id") ON DELETE CASCADE'+
      ')'
    );
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "TabPageVersion_unique" ON "TabPageVersion"("tabPageId","version")');
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "TabPageStat" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"tabPageId" TEXT NOT NULL,'+
      '"date" DATE NOT NULL,'+
      '"impressions" INTEGER NOT NULL DEFAULT 0,'+
      '"clicks" INTEGER NOT NULL DEFAULT 0,'+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW(),'+
      'CONSTRAINT "TabPageStat_tabPageId_fkey" FOREIGN KEY ("tabPageId") REFERENCES "TabPage"("id") ON DELETE CASCADE'+
      ')'
    );
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "TabPageStat_unique" ON "TabPageStat"("tabPageId","date")');
  } catch (e) {
    console.error('[ensureSchema] warning:', e);
  }
}

// Disabled: Category DDL at runtime
async function ensureCategoryColumnsAlways(): Promise<void> { return; }

applySecurityMiddleware(app);
app.use(cookieParser());
app.use('/api/admin', adminRest);
app.use('/api/admin', adminExtra);
// Public shop API for mweb
app.use('/api', shop);
// Mount shipping webhooks (required by tests hitting /webhooks/shipping)
app.use('/webhooks', shippingWebhooks);
app.use('/api/admin', rbac);

try {
  const swaggerDoc = YAML.load(__dirname + '/../openapi.yaml');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch {}

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export const expressApp = app;
const port = process.env.PORT || 4000;
// Health for local reverse-proxy sanity check
app.get('/api/admin/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
(async () => {
  // Skip Category runtime DDL to prevent Postgres 54011 on large/legacy databases
  await ensureCategoryColumnsAlways();
  // Always ensure logistics tables exist (safe, idempotent) even in production
  try {
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Driver" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"name" TEXT NOT NULL,'+
      '"phone" TEXT NULL,'+
      '"isActive" BOOLEAN DEFAULT TRUE,'+
      '"status" TEXT NULL,'+
      '"lat" DOUBLE PRECISION NULL,'+
      '"lng" DOUBLE PRECISION NULL,'+
      '"lastSeenAt" TIMESTAMP NULL,'+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "ShipmentLeg" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"orderId" TEXT NULL,'+
      '"poId" TEXT NULL,'+
      '"legType" TEXT NOT NULL,'+
      '"status" TEXT NOT NULL,'+
      '"driverId" TEXT NULL,'+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShipmentLeg_orderId_idx" ON "ShipmentLeg"("orderId")');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShipmentLeg_poId_idx" ON "ShipmentLeg"("poId")');
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Package" ('+
      '"id" TEXT PRIMARY KEY,'+
      '"barcode" TEXT UNIQUE NULL,'+
      '"status" TEXT NOT NULL DEFAULT \''+"PENDING"+'\','+
      '"createdAt" TIMESTAMP DEFAULT NOW(),'+
      '"updatedAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Package_status_idx" ON "Package"("status")');
    // Finance: minimal chart of accounts and journal tables
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Account" ("id" TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "JournalEntry" ("id" TEXT PRIMARY KEY, ref TEXT NULL, memo TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW(), "postedAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "JournalLine" ("id" TEXT PRIMARY KEY, "entryId" TEXT NOT NULL, "accountCode" TEXT NOT NULL, debit DOUBLE PRECISION DEFAULT 0, credit DOUBLE PRECISION DEFAULT 0)');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "JournalLine_entry_idx" ON "JournalLine"("entryId")');
    // Notifications: log table for outbound messages
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "NotificationLog" ('+
      '"id" TEXT PRIMARY KEY,'+
      'channel TEXT NOT NULL,'+
      'target TEXT,'+
      'title TEXT,'+
      'body TEXT,'+
      'status TEXT NOT NULL DEFAULT \'SENT\','+
      'error TEXT,'+
      '"messageId" TEXT,'+
      'meta JSONB,'+
      '"updatedAt" TIMESTAMP DEFAULT NOW(),'+
      '"createdAt" TIMESTAMP DEFAULT NOW()'+
      ')'
    );
    // Backfill/compatibility: ensure columns exist and quietly map from legacy lowercase if they exist
    try { await db.$executeRawUnsafe('ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "messageId" TEXT'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()'); } catch {}
    try { await db.$executeRawUnsafe('ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()'); } catch {}
    try {
      await db.$executeRawUnsafe(
        `DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'NotificationLog' AND table_schema = 'public' AND column_name = 'createdat'
          ) THEN
            EXECUTE 'UPDATE "NotificationLog" SET "createdAt" = createdat WHERE "createdAt" IS NULL';
          END IF;
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'NotificationLog' AND table_schema = 'public' AND column_name = 'updatedat'
          ) THEN
            EXECUTE 'UPDATE "NotificationLog" SET "updatedAt" = updatedat WHERE "updatedAt" IS NULL';
          END IF;
        END$$;`
      );
    } catch {}
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "NotificationLog_created_idx" ON "NotificationLog"("createdAt")');
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "NotificationLog_messageId_idx" ON "NotificationLog"("messageId")'); } catch {}
    // Ensure MediaAsset checksum unique (idempotent)
    try { await db.$executeRawUnsafe('ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS checksum TEXT'); } catch {}
    try { await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_checksum_key" ON "MediaAsset"(checksum) WHERE checksum IS NOT NULL'); } catch {}
    // Ensure uploads dir exists next to API process for alias ${PROJECT_DIR}/uploads
    try { const fs = require('fs'); const path = require('path'); const root = process.cwd(); fs.mkdirSync(path.join(root,'uploads'), { recursive: true }); } catch {}
    // DeliveryRate may exist without carrierId in some legacy installs
    try { await db.$executeRawUnsafe('ALTER TABLE "DeliveryRate" ADD COLUMN IF NOT EXISTS "carrierId" TEXT'); } catch {}
    // Ensure Currency table exists (Prisma-compatible)
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Currency" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "code" TEXT NOT NULL, "symbol" TEXT NOT NULL, "precision" INTEGER NOT NULL DEFAULT 2, "rateToBase" DOUBLE PRECISION NOT NULL DEFAULT 1, "isBase" BOOLEAN NOT NULL DEFAULT FALSE, "isActive" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Currency_code_key" ON "Currency"("code")');
    // Ensure AddressBook for multi-address per user (separate from Prisma Address single-record)
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AddressBook" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "fullName" TEXT, "phone" TEXT, "altPhone" TEXT, "country" TEXT, "state" TEXT, "city" TEXT, "street" TEXT, "details" TEXT, "postalCode" TEXT, "lat" DOUBLE PRECISION NULL, "lng" DOUBLE PRECISION NULL, "isDefault" BOOLEAN NOT NULL DEFAULT FALSE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "AddressBook_user_idx" ON "AddressBook"("userId")');
    // Harden columns for legacy deployments
    await db.$executeRawUnsafe(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns WHERE table_name = 'AddressBook' AND column_name = 'lat'
         ) THEN
           ALTER TABLE "AddressBook" ADD COLUMN "lat" DOUBLE PRECISION;
         END IF;
       END$$;`
    );
    await db.$executeRawUnsafe(
      `DO $$
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns WHERE table_name = 'AddressBook' AND column_name = 'lng'
         ) THEN
           ALTER TABLE "AddressBook" ADD COLUMN "lng" DOUBLE PRECISION;
         END IF;
       END$$;`
    );
    // Ensure OrderItem has attributes JSONB for variant meta (color/size)
    await db.$executeRawUnsafe('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = \'OrderItem\' AND column_name = \'attributes\') THEN ALTER TABLE "OrderItem" ADD COLUMN "attributes" JSONB; END IF; END $$;');
    // Ensure Shipping/Payments/Carts tables exist (Prisma-compatible)
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "ShippingZone" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "countryCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "regionCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "cityNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "zipCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "isActive" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "ShippingZone_name_key" ON "ShippingZone"("name")');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "DeliveryRate" ("id" TEXT PRIMARY KEY, "zoneId" TEXT NOT NULL, "carrierId" TEXT NULL, "minWeightKg" DOUBLE PRECISION NULL, "maxWeightKg" DOUBLE PRECISION NULL, "baseFee" DOUBLE PRECISION NOT NULL DEFAULT 0, "perKgFee" DOUBLE PRECISION NULL DEFAULT 0, "minSubtotal" DOUBLE PRECISION NULL, "freeOverSubtotal" DOUBLE PRECISION NULL, "etaMinHours" INTEGER NULL, "etaMaxHours" INTEGER NULL, "offerTitle" TEXT NULL, "activeFrom" TIMESTAMP NULL, "activeUntil" TIMESTAMP NULL, "isActive" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "DeliveryRate_zoneId_carrierId_idx" ON "DeliveryRate"("zoneId","carrierId")');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "PaymentGateway" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "provider" TEXT NOT NULL, "mode" TEXT NOT NULL DEFAULT \'TEST\', "fixedFee" DOUBLE PRECISION NOT NULL DEFAULT 0, "percentageFee" DOUBLE PRECISION NOT NULL DEFAULT 0, "minAmount" DOUBLE PRECISION NULL, "maxAmount" DOUBLE PRECISION NULL, "credentials" JSONB NULL, "isActive" BOOLEAN NOT NULL DEFAULT TRUE, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "PaymentGateway_name_key" ON "PaymentGateway"("name")');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "GuestCart" ("id" TEXT PRIMARY KEY, "sessionId" TEXT UNIQUE NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "GuestCartItem" ("id" TEXT PRIMARY KEY, "guestCartId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())');
    // Backward-compatibility: fix legacy lowercase columns if present
    try {
      await db.$executeRawUnsafe(
        `DO $$
         BEGIN
           IF EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = 'GuestCartItem' AND column_name = 'guestcartid'
           ) AND NOT EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = 'GuestCartItem' AND column_name = 'guestCartId'
           ) THEN
             ALTER TABLE "GuestCartItem" RENAME COLUMN guestcartid TO "guestCartId";
           END IF;
           IF EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = 'GuestCartItem' AND column_name = 'productid'
           ) AND NOT EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = 'GuestCartItem' AND column_name = 'productId'
           ) THEN
             ALTER TABLE "GuestCartItem" RENAME COLUMN productid TO "productId";
           END IF;
           IF NOT EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = 'GuestCartItem' AND column_name = 'guestCartId'
           ) THEN
             ALTER TABLE "GuestCartItem" ADD COLUMN "guestCartId" TEXT;
           END IF;
           IF NOT EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = 'GuestCartItem' AND column_name = 'productId'
           ) THEN
             ALTER TABLE "GuestCartItem" ADD COLUMN "productId" TEXT;
           END IF;
         END$$;`
      );
    } catch {}
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "GuestCartItem_guestCartId_productId_key" ON "GuestCartItem"("guestCartId","productId")');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "GuestCartItem_productId_idx" ON "GuestCartItem"("productId")');
    // Seed default accounts
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'CASH','Cash','ASSET') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as ()=>string)()); } catch {}
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'REVENUE','Sales Revenue','REVENUE') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as ()=>string)()); } catch {}
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'REFUND_EXPENSE','Refunds','EXPENSE') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as ()=>string)()); } catch {}
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'FEES_EXPENSE','Payment Fees','EXPENSE') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as ()=>string)()); } catch {}
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'AR','Accounts Receivable','ASSET') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as ()=>string)()); } catch {}
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'AP','Accounts Payable','LIABILITY') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as ()=>string)()); } catch {}
  } catch {}
  // Run ensureSchema only when explicitly allowed or in development
  const allowEnsure = process.env.API_RUN_ENSURE_SCHEMA === '1' || process.env.NODE_ENV !== 'production';
  if (allowEnsure) {
    await ensureSchemaSafe();
    await ensureSchema();
    // Skip Category runtime DDL entirely to avoid 54011 (too many columns) on mirrored/legacy DBs
  }
  // Skip bootstrap seeding during tests unless explicitly forced
  const allowBootstrap = (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') || process.env.API_ALLOW_BOOTSTRAP === '1';
  if (allowBootstrap) {
    // placeholder
  }
  const forceListen = process.env.API_FORCE_LISTEN === '1';
  if (process.env.NODE_ENV !== 'test' || forceListen) {
    const server = http.createServer(app);
    const io = new IOServer(server, {
      cors: {
        origin: [process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.jeeey.com'],
        credentials: true
      },
      path: '/socket.io'
    });
    setIo(io);
    io.on('connection', (socket) => {
      socket.emit('hello', { ok: true });
      // Join user rooms if provided (userId or sessionId)
      const { userId, sessionId } = socket.handshake.auth || {};
      if (userId) socket.join(`user:${userId}`);
      if (sessionId) socket.join(`guest:${sessionId}`);
    });
    // Broadcast drivers live locations every 10s
    setInterval(async () => {
      try {
        const drivers = await db.driver.findMany({ where: { lat: { not: null }, lng: { not: null } }, select: { id: true, name: true, lat: true, lng: true, status: true, isActive: true, lastSeenAt: true } });
        io.emit('driver:locations', { drivers });
      } catch {}
    }, 10000);

    server.listen(port, () => {
      console.log(`🚀 API server listening on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔗 tRPC endpoint: http://localhost:${port}/trpc`);
    });
  }
})();

// Sentry error handler at the end
if (sentryEnabled && SentryRef) {
  try { (app as any).use(SentryRef.Handlers.errorHandler()); } catch {}
}

export type AppRouter = typeof appRouter;
