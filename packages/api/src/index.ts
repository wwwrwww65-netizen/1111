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
import cookieParser from 'cookie-parser';
import adminRest from './routers/admin-rest';
import shippingWebhooks from './routers/webhooks';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

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
    await db.$executeRawUnsafe('ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION');
    await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vendorId" TEXT');
    // Ensure Vendor columns exist for admin panel features
    await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT');
    await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "phone" TEXT');
    await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "address" TEXT');
    await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "storeName" TEXT');
    await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "storeNumber" TEXT');
    await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "vendorCode" TEXT');
    await db.$executeRawUnsafe('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = "Vendor_vendorCode_key" AND n.nspname = current_schema()) THEN CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode"); END IF; END $$;');
    // Ensure attribute tables exist (id TEXT primary key; Prisma will supply ids)
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AttributeColor" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE, "hex" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AttributeBrand" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE, "createdAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AttributeSizeType" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE, "createdAt" TIMESTAMP DEFAULT NOW())');
    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AttributeSize" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE, "typeId" TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
    // FK if not exists
    await db.$executeRawUnsafe("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AttributeSize_typeId_fkey') THEN ALTER TABLE \"AttributeSize\" ADD CONSTRAINT \"AttributeSize_typeId_fkey\" FOREIGN KEY (\"typeId\") REFERENCES \"AttributeSizeType\"(\"id\") ON DELETE SET NULL; END IF; END $$;");

    // Auth/session/audit tables & columns (idempotent bootstraps)
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0');
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockUntil" TIMESTAMP NULL');
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false');
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT NULL');
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false');
    await db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vendorId" TEXT NULL');

    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "userAgent" TEXT NULL, "ip" TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW(), "expiresAt" TIMESTAMP NOT NULL)');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")');

    await db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT PRIMARY KEY, "userId" TEXT NULL, "action" TEXT NOT NULL, "module" TEXT NOT NULL, "details" JSONB NULL, "ip" TEXT NULL, "userAgent" TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
  } catch (e) {
    console.warn('Schema ensure warning:', (e as Error).message);
  }
}

async function ensureBootstrap(): Promise<void> {
  try {
    // Seed default color "أحمر" if not exists
    await db.attributeColor.upsert({ where: { name: 'أحمر' }, update: {}, create: { name: 'أحمر', hex: '#ff0000' } });
    // Ensure default admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const bcrypt = require('bcryptjs');
    const existing = await db.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await db.user.create({ data: { email: adminEmail, password: hash, name: 'Admin', role: 'ADMIN', isVerified: true, failedLoginAttempts: 0, lockUntil: null } });
      await db.auditLog.create({ data: { module: 'bootstrap', action: 'create_admin', details: { email: adminEmail } } });
    }
  } catch (e) {
    console.warn('Bootstrap warning:', (e as Error).message);
  }
}

// Behind Render proxy, trust proxy so secure cookies & protocol are detected correctly
app.set('trust proxy', 1);

// Stripe webhook MUST be registered BEFORE any body parser middlewares
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
	try {
		const stripeSecret = process.env.STRIPE_SECRET_KEY;
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!stripeSecret || !webhookSecret) {
			return res.status(500).json({ error: 'Stripe secrets not configured' });
		}
		const Stripe = require('stripe');
		const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
		const sig = req.headers['stripe-signature'];
		let event;
		try {
			event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
		} catch (err) {
			return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
		}
		const { db } = require('@repo/db');
		if (event.type === 'payment_intent.succeeded') {
			const intent = event.data.object;
			const paymentIntentId = intent.id as string;
			// Update payment + order, adjust inventory in a transaction
			await db.$transaction(async (tx: any) => {
				const payment = await tx.payment.update({
					where: { stripeId: paymentIntentId },
					data: { status: 'COMPLETED' },
				});
				await tx.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
				const items = await tx.orderItem.findMany({ where: { orderId: payment.orderId } });
				for (const it of items) {
					await tx.product.update({
						where: { id: it.productId },
						data: { stockQuantity: { decrement: it.quantity } },
					});
				}
			});
		}
		if (event.type === 'payment_intent.payment_failed') {
			const intent = event.data.object;
			const paymentIntentId = intent.id as string;
			await require('@repo/db').db.payment.update({
				where: { stripeId: paymentIntentId },
				data: { status: 'FAILED' },
			});
		}
		return res.json({ received: true });
	} catch (e) {
		return res.status(500).json({ error: 'internal_error' });
	}
});

// Shipping webhook (raw) BEFORE json parsers too
app.use('/webhooks', shippingWebhooks);

// Apply security middleware AFTER webhook so JSON parser doesn't consume raw body
applySecurityMiddleware(app);
// Parse cookies
app.use(cookieParser());

// Swagger UI (docs)
try {
  const openapi = YAML.load(require('path').join(__dirname, 'openapi.yaml').replace('/dist/', '/src/'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
} catch {}

// Root endpoint for Render root URL
app.get('/', (req, res) => {
  res.json({
    name: 'E-commerce API',
    status: 'ok',
    endpoints: {
      health: '/health',
      trpc: '/trpc'
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin REST facade (RBAC-protected)
app.use('/api/admin', adminRest);

// Error test endpoint for monitoring
app.get('/error-test', (_req, _res) => {
  if (sentryEnabled) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    Sentry.captureException(new Error('Test error from /error-test'));
  }
  throw new Error('Test error endpoint hit');
});
// Informational handler for GET /trpc (tRPC expects JSON-RPC calls; this is a friendly message)
app.get('/trpc', (req, res) => {
  res.status(200).json({
    message: 'tRPC endpoint is live.',
    howToUse: 'Use a tRPC client (httpBatchLink) or POST JSON-RPC to /trpc with a procedure path (e.g., search.searchProducts).',
    example: {
      procedure: 'search.searchProducts',
      url: '/trpc',
      method: 'POST'
    }
  });
});

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
  await ensureSchema();
  // Skip bootstrap seeding during tests unless explicitly forced
  if (process.env.NODE_ENV !== 'test' || process.env.API_BOOTSTRAP_IN_TEST === '1') {
    await ensureBootstrap();
  }
  const forceListen = process.env.API_FORCE_LISTEN === '1';
  if (process.env.NODE_ENV !== 'test' || forceListen) {
    app.listen(port, () => {
      console.log(`🚀 API server listening on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔗 tRPC endpoint: http://localhost:${port}/trpc`);
    });
  }
})();

export type AppRouter = typeof appRouter;
