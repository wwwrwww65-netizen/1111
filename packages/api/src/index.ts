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
import shippingWebhooks from './routers/webhooks';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import http from 'http';
import { Server as IOServer } from 'socket.io';

// Optional Sentry init
let sentryEnabled = false;
try {
  // Dynamically require to avoid build-time errors if missing
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    sentryEnabled = true;
  }
} catch {}

const app = express();
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
  } catch (e) {
    console.error('[ensureSchema] warning:', e);
  }
}

applySecurityMiddleware(app);
app.use(cookieParser());
app.use('/api/admin', adminRest);

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
(async () => {
  // Run ensureSchema only when explicitly allowed or in development
  const allowEnsure = process.env.API_RUN_ENSURE_SCHEMA === '1' || process.env.NODE_ENV !== 'production';
  if (allowEnsure) {
    await ensureSchemaSafe();
    await ensureSchema();
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

export type AppRouter = typeof appRouter;
