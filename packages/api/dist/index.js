"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressApp = void 0;
// Optional dotenv preload for non-Render environments
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv/config');
}
catch { }
const express_1 = __importDefault(require("express"));
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const router_1 = require("./router");
const context_1 = require("./context");
const security_1 = require("./middleware/security");
const db_1 = require("@repo/db");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const admin_rest_1 = __importDefault(require("./routers/admin-rest"));
const webhooks_1 = __importDefault(require("./routers/webhooks"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
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
}
catch { }
const app = (0, express_1.default)();
// Ensure critical DB schema tweaks are applied (idempotent)
async function ensureSchema() {
    try {
        // Ensure Vendor table exists for admin vendor operations
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Vendor" (' +
            '"id" TEXT PRIMARY KEY,' +
            '"name" TEXT UNIQUE NOT NULL,' +
            '"contactEmail" TEXT NULL,' +
            '"phone" TEXT NULL,' +
            '"address" TEXT NULL,' +
            '"storeName" TEXT NULL,' +
            '"storeNumber" TEXT NULL,' +
            '"vendorCode" TEXT NULL,' +
            '"isActive" BOOLEAN DEFAULT TRUE,' +
            '"createdAt" TIMESTAMP DEFAULT NOW(),' +
            '"updatedAt" TIMESTAMP DEFAULT NOW()' +
            ')');
        // Ensure unique indexes for name and vendorCode
        await db_1.db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_name_key" ON "Vendor"("name")');
        await db_1.db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_vendorCode_key" ON "Vendor"("vendorCode")');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vendorId" TEXT');
        // Ensure FK from Product.vendorId -> Vendor.id
        await db_1.db.$executeRawUnsafe("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_vendorId_fkey') THEN ALTER TABLE \"Product\" ADD CONSTRAINT \"Product_vendorId_fkey\" FOREIGN KEY (\"vendorId\") REFERENCES \"Vendor\"(\"id\") ON DELETE SET NULL; END IF; END $$;");
        // Ensure Vendor columns exist for admin panel features
        await db_1.db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "phone" TEXT');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "address" TEXT');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "storeName" TEXT');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "storeNumber" TEXT');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "vendorCode" TEXT');
        await db_1.db.$executeRawUnsafe('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = "Vendor_vendorCode_key" AND n.nspname = current_schema()) THEN CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode"); END IF; END $$;');
        // RBAC core tables if not exist
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Role" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Permission" ("id" TEXT PRIMARY KEY, "key" TEXT UNIQUE NOT NULL, "description" TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "RolePermission" ("id" TEXT PRIMARY KEY, "roleId" TEXT NOT NULL, "permissionId" TEXT NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
        await db_1.db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_permission_key" ON "RolePermission"("roleId", "permissionId")');
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "UserRoleLink" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "roleId" TEXT NOT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
        await db_1.db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "UserRoleLink_user_role_key" ON "UserRoleLink"("userId", "roleId")');
        // FKs (ignore errors if already exist)
        await db_1.db.$executeRawUnsafe('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "RolePermission_roleId_fkey") THEN ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE; END IF; END $$;');
        await db_1.db.$executeRawUnsafe('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "RolePermission_permissionId_fkey") THEN ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE; END IF; END $$;');
        await db_1.db.$executeRawUnsafe('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "UserRoleLink_userId_fkey") THEN ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE; END IF; END $$;');
        await db_1.db.$executeRawUnsafe('DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = "UserRoleLink_roleId_fkey") THEN ALTER TABLE "UserRoleLink" ADD CONSTRAINT "UserRoleLink_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE; END IF; END $$;');
        // Ensure attribute tables exist (id TEXT primary key; Prisma will supply ids)
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AttributeColor" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE, "hex" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())');
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AttributeBrand" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE, "createdAt" TIMESTAMP DEFAULT NOW())');
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AttributeSizeType" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE, "createdAt" TIMESTAMP DEFAULT NOW())');
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AttributeSize" ("id" TEXT PRIMARY KEY, "name" TEXT UNIQUE, "typeId" TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
        // FK if not exists
        await db_1.db.$executeRawUnsafe("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AttributeSize_typeId_fkey') THEN ALTER TABLE \"AttributeSize\" ADD CONSTRAINT \"AttributeSize_typeId_fkey\" FOREIGN KEY (\"typeId\") REFERENCES \"AttributeSizeType\"(\"id\") ON DELETE SET NULL; END IF; END $$;");
        // Ensure composite uniqueness per type: (typeId, lower(name))
        await db_1.db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "AttributeSize_type_name_key" ON "AttributeSize"((LOWER("name")), COALESCE("typeId", \'__NONE__\'))');
        // Auth/session/audit tables & columns (idempotent bootstraps)
        await db_1.db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockUntil" TIMESTAMP NULL');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT NULL');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false');
        await db_1.db.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vendorId" TEXT NULL');
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "userAgent" TEXT NULL, "ip" TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW(), "expiresAt" TIMESTAMP NOT NULL)');
        await db_1.db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId")');
        await db_1.db.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT PRIMARY KEY, "userId" TEXT NULL, "action" TEXT NOT NULL, "module" TEXT NOT NULL, "details" JSONB NULL, "ip" TEXT NULL, "userAgent" TEXT NULL, "createdAt" TIMESTAMP DEFAULT NOW())');
    }
    catch (e) {
        console.warn('Schema ensure warning:', e.message);
    }
}
async function ensureBootstrap() {
    try {
        // Seed default color "أحمر" if not exists
        await db_1.db.attributeColor.upsert({ where: { name: 'أحمر' }, update: {}, create: { name: 'أحمر', hex: '#ff0000' } });
        // Ensure default admin user exists
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const bcrypt = require('bcryptjs');
        const existing = await db_1.db.user.findUnique({ where: { email: adminEmail } });
        if (!existing) {
            const hash = await bcrypt.hash(adminPassword, 10);
            await db_1.db.user.create({ data: { email: adminEmail, password: hash, name: 'Admin', role: 'ADMIN', isVerified: true, failedLoginAttempts: 0, lockUntil: null } });
            await db_1.db.auditLog.create({ data: { module: 'bootstrap', action: 'create_admin', details: { email: adminEmail } } });
        }
    }
    catch (e) {
        console.warn('Bootstrap warning:', e.message);
    }
}
// Behind Render proxy, trust proxy so secure cookies & protocol are detected correctly
app.set('trust proxy', 1);
// Stripe webhook MUST be registered BEFORE any body parser middlewares
app.post('/webhooks/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
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
        }
        catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        const { db } = require('@repo/db');
        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object;
            const paymentIntentId = intent.id;
            // Update payment + order, adjust inventory in a transaction
            await db.$transaction(async (tx) => {
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
            const paymentIntentId = intent.id;
            await require('@repo/db').db.payment.update({
                where: { stripeId: paymentIntentId },
                data: { status: 'FAILED' },
            });
        }
        return res.json({ received: true });
    }
    catch (e) {
        return res.status(500).json({ error: 'internal_error' });
    }
});
// Shipping webhook (raw) BEFORE json parsers too
app.use('/webhooks', webhooks_1.default);
// Apply security middleware AFTER webhook so JSON parser doesn't consume raw body
(0, security_1.applySecurityMiddleware)(app);
// Parse cookies
app.use((0, cookie_parser_1.default)());
// Swagger UI (docs)
try {
    const openapi = yamljs_1.default.load(require('path').join(__dirname, 'openapi.yaml').replace('/dist/', '/src/'));
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi));
}
catch { }
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
app.use('/api/admin', admin_rest_1.default);
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
app.use('/trpc', trpcExpress.createExpressMiddleware({
    router: router_1.appRouter,
    createContext: context_1.createContext,
}));
exports.expressApp = app;
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
//# sourceMappingURL=index.js.map