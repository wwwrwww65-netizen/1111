// Optional dotenv preload for non-Render environments
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv/config');
} catch {}
import express from 'express';
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
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import http from 'http';
import { Server as IOServer } from 'socket.io';

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
    // Ensure unique indexes for name and vendorCode
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_name_key" ON "Vendor"("name")');
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_vendorCode_key" ON "Vendor"("vendorCode")');
    await db.$executeRawUnsafe('ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION');
    await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vendorId" TEXT');
    // Ensure FK from Product.vendorId -> Vendor.id
    await db.$executeRawUnsafe(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_vendorId_fkey') THEN ALTER TABLE \"Product\" ADD CONSTRAINT \"Product_vendorId_fkey\" FOREIGN KEY (\"vendorId\") REFERENCES \"Vendor\"(\"id\") ON DELETE SET NULL; END IF; END $$;"
    );
    // Ensure Vendor columns exist for admin panel features
    await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priority" TEXT');

    // Ensure Category SEO/structure columns exist (idempotent)
    try { await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "slug" TEXT'); } catch {}
    try { await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category" ("slug") WHERE slug IS NOT NULL'); } catch {}
    for (const col of [
      'seoTitle TEXT',
      'seoDescription TEXT',
      'seoKeywords TEXT[]',
      'translations JSONB',
      'sortOrder INTEGER DEFAULT 0',
      'image TEXT',
      'parentId TEXT'
    ]) {
      try { await db.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS ${col}`); } catch {}
    }
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
  } catch (e) {
    console.error('[ensureSchema] warning:', e);
  }
}

// Always-ensure Category columns exist in ANY environment (safe, idempotent)
async function ensureCategoryColumnsAlways(): Promise<void> {
  try {
    // Minimal columns referenced by runtime code and smoke tests
    await db.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "slug" TEXT');
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category" ("slug") WHERE "slug" IS NOT NULL');
    for (const col of [
      'seoTitle TEXT',
      'seoDescription TEXT',
      'seoKeywords TEXT[]',
      'translations JSONB',
      'sortOrder INTEGER DEFAULT 0',
      'image TEXT',
      'parentId TEXT'
    ]) {
      try { await db.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS ${col}`); } catch {}
    }
    // Ensure FK for parentId
    await db.$executeRawUnsafe(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CategoryHierarchy_parentId_fkey') THEN ALTER TABLE \"Category\" ADD CONSTRAINT \"CategoryHierarchy_parentId_fkey\" FOREIGN KEY (\"parentId\") REFERENCES \"Category\"(\"id\") ON DELETE SET NULL; END IF; END $$;"
    );
  } catch (e) {
    console.error('[ensureCategoryColumnsAlways] warning:', e);
  }
}

applySecurityMiddleware(app);
app.use(cookieParser());
app.use('/api/admin', adminRest);
app.use('/api/admin', adminExtra);
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
  // Always ensure runtime-critical Category columns before serving traffic
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
    // Re-ensure Category columns at runtime before serving requests (synchronous)
    try {
      const cols = [
        'seoTitle TEXT',
        'seoDescription TEXT',
        'seoKeywords TEXT[]',
        'translations JSONB',
        'sortOrder INTEGER DEFAULT 0',
        'image TEXT',
        'parentId TEXT'
      ];
      for (const col of cols) {
        try { await db.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS ${col}`); } catch {}
      }
    } catch {}
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
      }
    });
    io.on('connection', (socket) => {
      socket.emit('hello', { ok: true });
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
