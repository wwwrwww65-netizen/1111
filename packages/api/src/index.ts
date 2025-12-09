// Optional dotenv preload for non-Render environments
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv/config');
} catch { }
// Attempt to load server-level env files (e.g., /var/www/ecom/.env.api) if present
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  const candidatePaths: Array<string | undefined> = [
    process.env.ENV_FILE,
    '/var/www/ecom/.env.api',
    '/srv/ecom/.env.api',
    '/var/www/ecom/.env',
    '/srv/ecom/.env'
  ];
  for (const p of candidatePaths) {
    if (!p) continue;
    try { if (fs.existsSync(p)) { dotenv.config({ path: p }); } } catch { }
  }
} catch { }
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
} catch { }

const app = express();
// Serve uploaded media
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), { maxAge: '365d', immutable: true }));
// Serve verification files (Google/Bing HTML files) from root
app.use('/', express.static(path.resolve(process.cwd(), 'verification')));
// Android App Links: serve assetlinks.json
app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.type('application/json').send([{
    relation: [
      'delegate_permission/common.handle_all_urls',
      'delegate_permission/common.get_login_creds'
    ],
    target: {
      namespace: 'android_app',
      package_name: 'com.jeeey.shopin',
      sha256_cert_fingerprints: [
        '40:44:5A:90:E0:A3:53:B0:B5:D5:F0:A7:E9:04:4B:EE:09:3A:23:32:8A:C6:65:42:2A:A1:BE:8E:A7:59:2B:21'
      ]
    }
  }]);
});
// OAuth callback shims (accept both /auth/* and /api/auth/*)
app.get('/auth/google/callback', (req, res) => {
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return res.redirect(302, `/api/auth/google/callback${qs}`);
});
app.get('/auth/facebook/callback', (req, res) => {
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return res.redirect(302, `/api/auth/facebook/callback${qs}`);
});
if (sentryEnabled && SentryRef) {
  try {
    app.use(SentryRef.Handlers.requestHandler());
    if (SentryRef.Handlers.tracingHandler) app.use(SentryRef.Handlers.tracingHandler());
  } catch { }
}
// Global JSON sanitizer: convert BigInt to Number to avoid serialization errors
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  (res as any).json = (payload: any) => {
    try {
      if (payload === undefined) return originalJson(payload);
      const safe = JSON.parse(JSON.stringify(payload, (_k, v) => typeof v === 'bigint' ? Number(v) : v));
      return originalJson(safe);
    } catch (e) {
      console.error('JSON serialization error:', e);
      // Fallback: try to send original payload, if that fails, send error
      try {
        return originalJson(payload);
      } catch (err) {
        console.error('Fallback JSON serialization failed:', err);
        return res.status(500).send('Internal Server Error: Serialization Failed');
      }
    }
  };
  next();
});
// Behind NGINX, trust only loopback to satisfy express-rate-limit without being overly permissive
app.set('trust proxy', 'loopback');
// Ensure cookies are parsed early so /api/me and auth flows can read tokens
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// Ensure critical DB schema tweaks are applied (idempotent)
async function ensureSchema(): Promise<void> {
  try {
    // Ensure Vendor table exists for admin vendor operations
    try {
      await db.$executeRawUnsafe('ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_productId_key"');
    } catch { }
    try {
      await db.$executeRawUnsafe('DROP INDEX IF EXISTS "CartItem_cartId_productId_key"');
    } catch { }
    try {
      await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "CartItem_cartId_productId_idx" ON "CartItem"("cartId", "productId")');
    } catch { }
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Vendor" (' +
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
      ')'
    );
    // Ensure vendorCode column exists before creating its index
    try { await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "vendorCode" TEXT'); } catch { }
    // Ensure loyaltyMultiplier exists for vendor-level loyalty config
    try { await db.$executeRawUnsafe('ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "loyaltyMultiplier" DOUBLE PRECISION'); } catch { }
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_name_key" ON "Vendor"("name")');
    try {
      await db.$executeRawUnsafe(`DO $$ BEGIN IF to_regclass('public."Vendor_vendorCode_key"') IS NULL THEN CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode"); END IF; END $$;`);
    } catch { }
    await db.$executeRawUnsafe('ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION');
    await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "vendorId" TEXT');
    // Ensure product-level loyalty columns exist to match Prisma schema
    try { await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pointsFixed" INTEGER'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pointsPercent" DOUBLE PRECISION'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "loyaltyMultiplier" DOUBLE PRECISION'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "excludeFromPoints" BOOLEAN DEFAULT FALSE'); } catch { }
    // Minimal Category compatibility: avoid broad DDL; guard against 1600 columns limit
    try {
      await db.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'Category' AND column_name = 'loyaltyMultiplier'
          ) AND (
            SELECT COALESCE(MAX(attnum),0)
            FROM pg_attribute
            WHERE attrelid = '"Category"'::regclass AND attnum > 0 AND NOT attisdropped
          ) < 1600 THEN
            ALTER TABLE "Category" ADD COLUMN "loyaltyMultiplier" DOUBLE PRECISION;
          END IF;
        END$$;`);
    } catch { }
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
      'CREATE TABLE IF NOT EXISTS "Driver" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"name" TEXT NOT NULL,' +
      '"phone" TEXT NULL,' +
      '"isActive" BOOLEAN DEFAULT TRUE,' +
      '"status" TEXT NULL,' +
      '"lat" DOUBLE PRECISION NULL,' +
      '"lng" DOUBLE PRECISION NULL,' +
      '"lastSeenAt" TIMESTAMP NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    // Ensure ShipmentLeg table exists for logistics flows
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "ShipmentLeg" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"orderId" TEXT NULL,' +
      '"poId" TEXT NULL,' +
      '"legType" TEXT NOT NULL,' +
      '"status" TEXT NOT NULL,' +
      '"driverId" TEXT NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShipmentLeg_orderId_idx" ON "ShipmentLeg"("orderId")');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShipmentLeg_poId_idx" ON "ShipmentLeg"("poId")');
    // Ensure Package table exists for warehouse pages
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Package" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"barcode" TEXT UNIQUE NULL,' +
      '"status" TEXT NOT NULL DEFAULT \'' + "PENDING" + '\',' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Package_status_idx" ON "Package"("status")');
    // Speed up product name/sku search used by admin suggest (ensure extension exists)
    try { await db.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm'); } catch { }
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin (name gin_trgm_ops)'); } catch { }
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Product_sku_idx" ON "Product"(sku)'); } catch { }
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Product_created_idx" ON "Product"("createdAt")'); } catch { }
    // Speed up trending aggregation reads
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ProductAnalytics_date_productId_idx" ON "ProductAnalytics"("date","productId")'); } catch { }

    // Performance indexes for Coupons
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Coupon_active_valid_idx" ON "Coupon"("isActive","validFrom","validUntil")'); } catch { }
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "CouponUsage_usedAt_idx" ON "CouponUsage"("usedAt")'); } catch { }
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "CouponUsage_coupon_user_idx" ON "CouponUsage"("couponId","userId")'); } catch { }

    // Ensure ProductCategory (link table for additional categories) exists without breaking existing schema
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "ProductCategory" (' +
      '"productId" TEXT NOT NULL,' +
      '"categoryId" TEXT NOT NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      'PRIMARY KEY ("productId","categoryId")' +
      ')'
    );
    // Add indexes and FKs if missing
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId")');
    await db.$executeRawUnsafe(
      'DO $$ BEGIN ' +
      'IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = \'ProductCategory_productId_fkey\') THEN ' +
      'ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE; ' +
      'END IF; ' +
      'END $$;'
    );
    await db.$executeRawUnsafe(
      'DO $$ BEGIN ' +
      'IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = \'ProductCategory_categoryId_fkey\') THEN ' +
      'ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE; ' +
      'END IF; ' +
      'END $$;'
    );

    // Ensure PointsCampaign exists (Prisma model) to avoid runtime errors before migrations
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "PointsCampaign" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"name" TEXT NOT NULL,' +
      '"multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,' +
      '"startsAt" TIMESTAMP NULL,' +
      '"endsAt" TIMESTAMP NULL,' +
      '"enabled" BOOLEAN NOT NULL DEFAULT TRUE,' +
      '"conditions" JSONB NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "PointsCampaign_enabled_idx" ON "PointsCampaign"("enabled","startsAt","endsAt")');

    // Ensure Postgres enum for LedgerStatus exists (align with Prisma enum)
    try {
      await db.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerStatus') THEN
            CREATE TYPE "LedgerStatus" AS ENUM ('PENDING','CONFIRMED','EXPIRED','REVOKED');
          END IF;
        END$$;`);
    } catch { }

    // Tab Page Builder tables (idempotent)
    // Ensure Postgres ENUM types expected by Prisma exist
    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeviceType') THEN
          CREATE TYPE "DeviceType" AS ENUM ('MOBILE','DESKTOP');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TabPageStatus') THEN
          CREATE TYPE "TabPageStatus" AS ENUM ('DRAFT','SCHEDULED','PUBLISHED','ARCHIVED');
        END IF;
      END$$;
    `);
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "TabPage" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"slug" TEXT UNIQUE NOT NULL,' +
      '"label" TEXT NOT NULL,' +
      '"device" "DeviceType" NOT NULL DEFAULT ' + "'MOBILE'" + ',' +
      '"status" "TabPageStatus" NOT NULL DEFAULT ' + "'DRAFT'" + ',' +
      '"scheduledAt" TIMESTAMP NULL,' +
      '"publishedAt" TIMESTAMP NULL,' +
      '"theme" JSONB NULL,' +
      '"permissions" JSONB NULL,' +
      '"currentVersionId" TEXT NULL,' +
      '"createdByUserId" TEXT NULL,' +
      '"updatedByUserId" TEXT NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    // If table pre-existed with TEXT columns, coerce to ENUM types
    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'TabPage' AND column_name = 'device'
        ) THEN
          BEGIN
            ALTER TABLE "TabPage" ALTER COLUMN "device" TYPE "DeviceType" USING "device"::"DeviceType";
          EXCEPTION WHEN others THEN NULL;
          END;
          BEGIN
            ALTER TABLE "TabPage" ALTER COLUMN "device" SET DEFAULT 'MOBILE'::"DeviceType";
          EXCEPTION WHEN others THEN NULL;
          END;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'TabPage' AND column_name = 'status'
        ) THEN
          BEGIN
            ALTER TABLE "TabPage" ALTER COLUMN "status" TYPE "TabPageStatus" USING "status"::"TabPageStatus";
          EXCEPTION WHEN others THEN NULL;
          END;
          BEGIN
            ALTER TABLE "TabPage" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"TabPageStatus";
          EXCEPTION WHEN others THEN NULL;
          END;
        END IF;
      END$$;
    `);
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "TabPage_device_status_idx" ON "TabPage"("device","status")');
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "TabPageVersion" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"tabPageId" TEXT NOT NULL,' +
      '"version" INTEGER NOT NULL,' +
      '"title" TEXT NULL,' +
      '"content" JSONB NOT NULL,' +
      '"notes" TEXT NULL,' +
      '"createdByUserId" TEXT NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      'CONSTRAINT "TabPageVersion_tabPageId_fkey" FOREIGN KEY ("tabPageId") REFERENCES "TabPage"("id") ON DELETE CASCADE' +
      ')'
    );
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "TabPageVersion_unique" ON "TabPageVersion"("tabPageId","version")');
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "TabPageStat" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"tabPageId" TEXT NOT NULL,' +
      '"date" DATE NOT NULL,' +
      '"impressions" INTEGER NOT NULL DEFAULT 0,' +
      '"clicks" INTEGER NOT NULL DEFAULT 0,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW(),' +
      'CONSTRAINT "TabPageStat_tabPageId_fkey" FOREIGN KEY ("tabPageId") REFERENCES "TabPage"("id") ON DELETE CASCADE' +
      ')'
    );
    await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "TabPageStat_unique" ON "TabPageStat"("tabPageId","date")');

    // Ensure Wishlist table exists for user favorites
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Wishlist" (' +
      '"userId" TEXT NOT NULL,' +
      '"productId" TEXT NOT NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      'PRIMARY KEY ("userId","productId")' +
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Wishlist_userId_idx" ON "Wishlist"("userId")');
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
import seoRouter from './routers/seo';
app.use('/api/admin/seo', seoRouter);
import { mediaRouter } from './routers/media';
app.use('/api/admin/media', mediaRouter);
import { publicSeoRouter } from './routers/public-seo';
app.use('/', publicSeoRouter);
app.use('/api', publicSeoRouter); // Support /api/seo/meta calls from frontend


// Mobile Remote Config endpoints (tokens/home) for RN apps
app.get('/mobile/config/tokens.json', async (_req, res) => {
  // Basic default tokens; override later from DB/settings if needed
  const out = {
    colors: {
      primary: '#000000',
      background: '#ffffff',
      text: '#0f172a',
      muted: '#6b7280'
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    radius: { sm: 6, md: 10, lg: 16 },
    typography: { body: { fontFamily: 'System', fontSize: 16 } }
  };
  res.json(out);
});

app.get('/mobile/config/home.json', async (_req, res) => {
  // Minimal manifest; mweb changes can be reflected here to sync RN UI
  const out = {
    version: '1',
    sections: [
      { type: 'banner', id: 'hero', imageUrl: 'https://jeeey.com/hero.jpg', link: '/products' },
      {
        type: 'carousel', id: 'for-you', title: 'من أجلك',
        items: [
          { imageUrl: 'https://jeeey.com/img/1.jpg', link: '/p?id=1' },
          { imageUrl: 'https://jeeey.com/img/2.jpg', link: '/p?id=2' }
        ]
      }
    ]
  };
  res.json(out);
});

// Navigation (header/tabs) manifest
app.get('/mobile/config/nav.json', (_req, res) => {
  const out = {
    header: {
      title: 'Jeeey',
      actions: [{ icon: 'search', link: '/search' }, { icon: 'cart', link: '/cart' }]
    },
    tabs: [
      { key: 'home', title: 'الرئيسية', icon: 'home', link: '/' },
      { key: 'categories', title: 'التصنيفات', icon: 'grid', link: '/categories' },
      { key: 'wishlist', title: 'المفضلة', icon: 'heart', link: '/wishlist' },
      { key: 'account', title: 'حسابي', icon: 'user', link: '/account' },
      { key: 'cart', title: 'السلة', icon: 'shopping-bag', link: '/cart' }
    ]
  };
  res.json(out);
});

// PDP blocks manifest
app.get('/mobile/config/pdp.json', (_req, res) => {
  const out = {
    blocks: [
      { type: 'images' },
      { type: 'title-price' },
      { type: 'variants', options: { color: true, sizeLetters: true, sizeNumbers: true } },
      { type: 'inventory' },
      { type: 'description' },
      { type: 'actions', options: { addToCart: true, buyNow: true } }
    ]
  };
  res.json(out);
});

// Categories manifest (layout/filters)
app.get('/mobile/config/categories.json', (_req, res) => {
  const out = {
    layout: { columns: 3, gap: 8 },
    showImages: true,
    filters: ['price', 'brand', 'size', 'color']
  };
  res.json(out);
});

// Cart manifest
app.get('/mobile/config/cart.json', (_req, res) => {
  const out = {
    showThumb: true,
    showVendor: false,
    totals: ['subtotal', 'shipping', 'discounts', 'total']
  };
  res.json(out);
});

// Checkout manifest
app.get('/mobile/config/checkout.json', (_req, res) => {
  const out = {
    steps: ['address', 'shipping', 'payment', 'review'],
    paymentProviders: ['stripe'],
    successLink: '/pay/success',
    failureLink: '/pay/failure'
  };
  res.json(out);
});

// Offers/placements manifest
app.get('/mobile/config/offers.json', (_req, res) => {
  const out = {
    placements: {
      homeTop: [{ bannerId: 'hero' }],
      homeMid: [{ campaign: 'weekly-deals' }],
      pdpBottom: [{ campaign: 'related' }]
    }
  };
  res.json(out);
});

// Pages manifest (arbitrary screens by path)
app.get('/mobile/config/pages.json', (_req, res) => {
  const out = {
    '/account': { path: '/account', title: 'حسابي', blocks: [{ type: 'heading', text: 'الحساب' }, { type: 'button', text: 'تسجيل الدخول / OTP', props: { action: 'openLogin' } }] },
    '/settings': { path: '/settings', title: 'الإعدادات', blocks: [{ type: 'heading', text: 'الإعدادات' }] },
    '/address': { path: '/address', title: 'العناوين', blocks: [{ type: 'heading', text: 'العنوان' }, { type: 'addressForm' }] },
    '/search': { path: '/search', title: 'بحث', blocks: [{ type: 'searchBar' }, { type: 'searchResults' }] },
  };
  res.json(out);
});

try {
  const swaggerDoc = YAML.load(__dirname + '/../openapi.yaml');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch { }

app.get('/health', (_req, res) => res.json({ ok: true }));

// Basic process metrics (non-prometheus), safe to expose
app.get('/metrics/basic', (_req, res) => {
  try {
    const mem = process.memoryUsage();
    const out: any = {
      pid: process.pid,
      uptime_s: Math.round(process.uptime()),
      rss_mb: Math.round((mem.rss || 0) / 1024 / 1024),
      heap_used_mb: Math.round((mem.heapUsed || 0) / 1024 / 1024),
      heap_total_mb: Math.round((mem.heapTotal || 0) / 1024 / 1024),
      external_mb: Math.round((mem.external || 0) / 1024 / 1024),
      timestamp: new Date().toISOString()
    };
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: 'metrics_failed', message: e?.message || 'failed' });
  }
});
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve Frontend Static Files (BFF Pattern)
// This allows the API to serve the SPA + SSR for specific routes
const mwebDist = path.resolve(process.cwd(), '../../apps/mweb/dist');
const mwebIndex = path.resolve(mwebDist, 'index.html');

// 1. Static Assets (js, css, images) - check if dist exists
if (require('fs').existsSync(mwebDist)) {
  app.use(express.static(mwebDist, { index: false })); // index:false to let SSR handle / and others
}

// 2. SPA Fallback for non-API routes (and non-SSR routes)
// Note: publicSeoRouter (SSR) is already mounted at '/' via line 423, so /p/:slug is handled there.
// However, express might match '*' before specific routes if not careful.
// Explicitly handle known SSR paths here to ensure they hit the router
// actually they are handled by publicSeoRouter because it is app.use('/', publicSeoRouter) above.
// BUT app.use is middleware. The handlers in publicSeoRouter are .get().
// If they are not matched, it falls through to here. That is correct.
// Wait, app.use('/', publicSeoRouter) is at line 423.
// publicSeoRouter defines .get('/p/:slug').
// So it should take precedence.

// Everything else that isn't /api/* or a static file should return index.html
app.get('*', (req, res, next) => {
  // If request matches known SSR pattern but wasn't caught (e.g. query param mismatch? no),
  // actually publicSeoRouter handles /p/:slug. 
  // If I access /p/123, publicSeoRouter should catch it.
  // If it didn't, maybe express order matters? 
  // publicSeoRouter is mounted at line 423. content above is at line 434+. 
  // So publicSeoRouter IS before this wildcard.

  if (req.path.startsWith('/api') || req.path.startsWith('/trpc') || req.path.startsWith('/uploads') || req.path.startsWith('/webhooks')) {
    return next();
  }
  if (require('fs').existsSync(mwebIndex)) {
    res.sendFile(mwebIndex);
  } else {
    // Fallback if built frontend not found (e.g. dev mode without build)
    next();
  }
});

export const expressApp = app;
const port = Number(process.env.PORT || 4000);
// Health for local reverse-proxy sanity check
app.get('/api/admin/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
(async () => {
  // Skip Category runtime DDL to prevent Postgres 54011 on large/legacy databases
  await ensureCategoryColumnsAlways();
  // Always ensure logistics tables exist (safe, idempotent) even in production
  try {
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Driver" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"name" TEXT NOT NULL,' +
      '"phone" TEXT NULL,' +
      '"isActive" BOOLEAN DEFAULT TRUE,' +
      '"status" TEXT NULL,' +
      '"lat" DOUBLE PRECISION NULL,' +
      '"lng" DOUBLE PRECISION NULL,' +
      '"lastSeenAt" TIMESTAMP NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "ShipmentLeg" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"orderId" TEXT NULL,' +
      '"poId" TEXT NULL,' +
      '"legType" TEXT NOT NULL,' +
      '"status" TEXT NOT NULL,' +
      '"driverId" TEXT NULL,' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShipmentLeg_orderId_idx" ON "ShipmentLeg"("orderId")');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ShipmentLeg_poId_idx" ON "ShipmentLeg"("poId")');
    await db.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Package" (' +
      '"id" TEXT PRIMARY KEY,' +
      '"barcode" TEXT UNIQUE NULL,' +
      '"status" TEXT NOT NULL DEFAULT \'' + "PENDING" + '\',' +
      '"createdAt" TIMESTAMP DEFAULT NOW(),' +
      '"updatedAt" TIMESTAMP DEFAULT NOW()' +
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
      'CREATE TABLE IF NOT EXISTS "NotificationLog" (' +
      '"id" TEXT PRIMARY KEY,' +
      'channel TEXT NOT NULL,' +
      'target TEXT,' +
      'title TEXT,' +
      'body TEXT,' +
      'status TEXT NOT NULL DEFAULT \'SENT\',' +
      'error TEXT,' +
      '"messageId" TEXT,' +
      'meta JSONB,' +
      '"updatedAt" TIMESTAMP DEFAULT NOW(),' +
      '"createdAt" TIMESTAMP DEFAULT NOW()' +
      ')'
    );
    // Backfill/compatibility: ensure columns exist and quietly map from legacy lowercase if they exist
    try { await db.$executeRawUnsafe('ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "messageId" TEXT'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "NotificationLog" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()'); } catch { }
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
    } catch { }
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "NotificationLog_created_idx" ON "NotificationLog"("createdAt")');
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "NotificationLog_messageId_idx" ON "NotificationLog"("messageId")'); } catch { }
    // Legacy loyalty table compatibility: ensure raw PointLedger exists for old reports/APIs
    try {
      await db.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "PointLedger" (' +
        '"id" TEXT PRIMARY KEY,' +
        '"userId" TEXT NOT NULL,' +
        'points INTEGER NOT NULL,' +
        'reason TEXT NULL,' +
        '"createdAt" TIMESTAMP DEFAULT NOW()' +
        ')'
      );
    } catch { }
    // Ensure Postgres enum for LedgerStatus exists in production as well
    try {
      await db.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerStatus') THEN
            CREATE TYPE "LedgerStatus" AS ENUM ('PENDING','CONFIRMED','EXPIRED','REVOKED');
          END IF;
        END$$;`);
    } catch { }
    // Ensure Prisma PointsLedger and WalletLedger exist for loyalty/wallet features
    try {
      await db.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "PointsLedger" (' +
        '"id" TEXT PRIMARY KEY,' +
        '"userId" TEXT NOT NULL,' +
        'points INTEGER NOT NULL,' +
        'status TEXT NOT NULL DEFAULT \'' + "CONFIRMED" + '\',' +
        '"orderId" TEXT NULL,' +
        '"campaignId" TEXT NULL,' +
        '"eventId" TEXT NULL,' +
        'reason TEXT NULL,' +
        '"expiresAt" TIMESTAMP NULL,' +
        'meta JSONB NULL,' +
        '"createdAt" TIMESTAMP DEFAULT NOW(),' +
        '"updatedAt" TIMESTAMP DEFAULT NOW()' +
        ')'
      );
      await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "PointsLedger_eventId_key" ON "PointsLedger"("eventId") WHERE "eventId" IS NOT NULL');
      await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "PointsLedger_user_status_created_idx" ON "PointsLedger"("userId","status","createdAt")');
      // Coerce legacy TEXT status to Postgres enum LedgerStatus if needed
      try {
        await db.$executeRawUnsafe(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'PointsLedger' AND column_name = 'status' AND data_type = 'text'
            ) THEN
              -- Drop default before changing type to avoid 42804
              BEGIN
                ALTER TABLE "PointsLedger" ALTER COLUMN "status" DROP DEFAULT;
              EXCEPTION WHEN others THEN NULL;
              END;
              ALTER TABLE "PointsLedger" ALTER COLUMN "status" TYPE "LedgerStatus"
              USING CASE WHEN "status" IN ('PENDING','CONFIRMED','EXPIRED','REVOKED') THEN "status"::"LedgerStatus" ELSE 'CONFIRMED'::"LedgerStatus" END;
              ALTER TABLE "PointsLedger" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED'::"LedgerStatus";
            END IF;
          END$$;`);
      } catch { }
    } catch { }
    try {
      await db.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "WalletLedger" (' +
        '"id" TEXT PRIMARY KEY,' +
        '"userId" TEXT NOT NULL,' +
        'amount DOUBLE PRECISION NOT NULL,' +
        'status TEXT NOT NULL DEFAULT \'' + "CONFIRMED" + '\',' +
        '"orderId" TEXT NULL,' +
        '"eventId" TEXT NULL,' +
        'reason TEXT NULL,' +
        '"expiresAt" TIMESTAMP NULL,' +
        'currency TEXT NULL,' +
        'meta JSONB NULL,' +
        '"createdAt" TIMESTAMP DEFAULT NOW(),' +
        '"updatedAt" TIMESTAMP DEFAULT NOW()' +
        ')'
      );
      await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "WalletLedger_eventId_key" ON "WalletLedger"("eventId") WHERE "eventId" IS NOT NULL');
      await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "WalletLedger_user_status_created_idx" ON "WalletLedger"("userId","status","createdAt")');
      // Coerce legacy TEXT status to Postgres enum LedgerStatus if needed
      try {
        await db.$executeRawUnsafe(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'WalletLedger' AND column_name = 'status' AND data_type = 'text'
            ) THEN
              -- Drop default before changing type to avoid 42804
              BEGIN
                ALTER TABLE "WalletLedger" ALTER COLUMN "status" DROP DEFAULT;
              EXCEPTION WHEN others THEN NULL;
              END;
              ALTER TABLE "WalletLedger" ALTER COLUMN "status" TYPE "LedgerStatus"
              USING CASE WHEN "status" IN ('PENDING','CONFIRMED','EXPIRED','REVOKED') THEN "status"::"LedgerStatus" ELSE 'CONFIRMED'::"LedgerStatus" END;
              ALTER TABLE "WalletLedger" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED'::"LedgerStatus";
            END IF;
          END$$;`);
      } catch { }
    } catch { }
    // CategoryMeta fallback storage for legacy DBs lacking SEO columns on Category
    try {
      await db.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "CategoryMeta" (' +
        '"id" TEXT PRIMARY KEY,' +
        'meta JSONB NULL,' +
        'CONSTRAINT "CategoryMeta_id_fkey" FOREIGN KEY ("id") REFERENCES "Category"("id") ON DELETE CASCADE' +
        ')'
      );
    } catch { }
    // Ensure MediaAsset checksum unique (idempotent)
    try { await db.$executeRawUnsafe('ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS checksum TEXT'); } catch { }
    try { await db.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_checksum_key" ON "MediaAsset"(checksum) WHERE checksum IS NOT NULL'); } catch { }
    // Ensure uploads dir exists next to API process for alias ${PROJECT_DIR}/uploads
    try { const fs = require('fs'); const path = require('path'); const root = process.cwd(); fs.mkdirSync(path.join(root, 'uploads'), { recursive: true }); } catch { }
    // DeliveryRate may exist without carrierId in some legacy installs
    try { await db.$executeRawUnsafe('ALTER TABLE "DeliveryRate" ADD COLUMN IF NOT EXISTS "carrierId" TEXT'); } catch { }
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
    } catch { }
    // Ensure modern columns and indexes for guest cart items (cartId-based)
    try { await db.$executeRawUnsafe('ALTER TABLE "GuestCartItem" ADD COLUMN IF NOT EXISTS "cartId" TEXT'); } catch { }
    try { await db.$executeRawUnsafe('UPDATE "GuestCartItem" SET "cartId"="guestCartId" WHERE "cartId" IS NULL AND "guestCartId" IS NOT NULL'); } catch { }
    // Remove unique constraint to allow variants
    try { await db.$executeRawUnsafe('DROP INDEX IF EXISTS "GuestCartItem_cartId_productId_key"'); } catch { }
    try { await db.$executeRawUnsafe('DROP INDEX IF EXISTS "GuestCartItem_guestCartId_productId_key"'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "GuestCartItem" DROP CONSTRAINT IF EXISTS "GuestCartItem_cartId_productId_key"'); } catch { }
    try { await db.$executeRawUnsafe('ALTER TABLE "GuestCartItem" DROP CONSTRAINT IF EXISTS "GuestCartItem_guestCartId_productId_key"'); } catch { }
    // Add non-unique index for performance
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "GuestCartItem_cartId_productId_idx" ON "GuestCartItem"("cartId","productId")');
    await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "GuestCartItem_productId_idx" ON "GuestCartItem"("productId")');
    // Seed default accounts
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'CASH','Cash','ASSET') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as () => string)()); } catch { }
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'REVENUE','Sales Revenue','REVENUE') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as () => string)()); } catch { }
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'REFUND_EXPENSE','Refunds','EXPENSE') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as () => string)()); } catch { }
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'FEES_EXPENSE','Payment Fees','EXPENSE') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as () => string)()); } catch { }
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'AR','Accounts Receivable','ASSET') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as () => string)()); } catch { }
    try { await db.$executeRawUnsafe("INSERT INTO \"Account\" (id, code, name, type) VALUES ($1,'AP','Accounts Payable','LIABILITY') ON CONFLICT (code) DO NOTHING", (require('crypto').randomUUID as () => string)()); } catch { }
  } catch { }
  // Run ensureSchema only when explicitly allowed or in development
  // Always run non-breaking safe ensures even in production
  try { await ensureSchemaSafe(); } catch { }
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
      } catch { }
    }, 10000);

    // Expire loyalty points periodically (hourly)
    setInterval(async () => {
      try {
        await db.$executeRawUnsafe("UPDATE \"PointsLedger\" SET status='EXPIRED' WHERE status='CONFIRMED' AND \"expiresAt\" IS NOT NULL AND \"expiresAt\" < NOW()");
      } catch { }
    }, 3600 * 1000);

    const host =
      process.env.HOST ||
      (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0');
    server.listen(port, host, () => {
      console.log(`🚀 API server listening on http://${host}:${port}`);
      console.log(`📊 Health check: http://${host}:${port}/health`);
      console.log(`🔗 tRPC endpoint: http://${host}:${port}/trpc`);
    });
  }
})();

// Sentry error handler at the end
if (sentryEnabled && SentryRef) {
  try { (app as any).use(SentryRef.Handlers.errorHandler()); } catch { }
}

export type AppRouter = typeof appRouter;
