# 🛒 E-commerce Platform Monorepo 

Monorepo for a full‑stack e‑commerce platform (Web, Admin, API, Mobile) using Next.js 14, tRPC, Prisma, PostgreSQL, and Turborepo.

## 🏗️ Architecture

This monorepo contains a complete e‑commerce solution with: 

- **🌐 Web App** (`apps/web`): Next.js 14 (App Router) with Tailwind, tRPC client
- **🛠️ Admin App** (`apps/admin`): Next.js 14 (App Router) with tRPC client
- **🔧 API** (`packages/api`): tRPC + Express.js (cookies auth, CORS, Helmet, rate‑limit)
- **🗄️ Database** (`packages/db`): Prisma ORM + PostgreSQL (migrations/seed)
- **🎨 UI Components** (`packages/ui`): Shared React components
- **🏗️ Infrastructure** (`infra`): Docker & deployment configs

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (User/Admin)
- Rate limiting & CORS protection
- Security headers with Helmet
- Admin SSO (OIDC-ready): `/api/admin/auth/sso/login|callback`
- RBAC موسع وتدقيق (Audit Log) للأعمال الحساسة
- WS/Socket.IO مع ضبط CORS والمصادقة عبر كوكي/Token

### 📈 Analytics & Facebook

- GA4 + GTM (Web): `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`
- Facebook Pixel (Web) + Conversions API (Server):
  - الويب: سكربت البكسل مع أحداث قياسية (PageView, AddToCart, Purchase)
  - الخادم: `services/fb.ts` يرسل Server Events (requires `FB_PIXEL_ID`, `FB_ACCESS_TOKEN`)
- Search Console & sitemaps/robots مفعّلة في Web (`app/robots.ts`, `app/sitemap.ts`)

### 🛍️ E-commerce Features
- Product catalog with categories
- Shopping cart management
- Order processing
- Payment integration (Stripe ready)
- User reviews & ratings
- Inventory management

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Type-safe components with TypeScript
- State management with Zustand
- Optimized for performance

### 🧪 Quality
- Jest test setup (API/UI), TypeScript across the stack
- ESLint + Prettier
- API documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (optional for local Postgres/Redis/MinIO)

### 1. Clone & Install

```bash
git clone <repository_url>
cd ecom-platform
pnpm install
```

### 2. Environment Setup (overview)

Set these variables (locally via shell or .env files per package, and on Render via dashboard):

- API (`packages/api`):
  - DATABASE_URL, DIRECT_URL
  - JWT_SECRET
  - NEXT_PUBLIC_APP_URL (web URL), NEXT_PUBLIC_ADMIN_URL (admin URL)
  - STRIPE_SECRET_KEY (optional), STRIPE_WEBHOOK_SECRET (optional)
  - CLOUDINARY_URL (اختياري لرفع الوسائط)
- Web/Admin (`apps/web`, `apps/admin`):
  - NEXT_PUBLIC_TRPC_URL (e.g. https://<api>/trpc)
  - NEXT_PUBLIC_API_BASE_URL (للنداءات المطلقة في الواجهة الإدارية)

### 3. (Optional) Local infrastructure

```bash
docker compose -f infra/dev-docker-compose.yml up -d
```

### 4. Database Setup

```bash
# Run migrations
pnpm --filter @repo/db db:migrate

# Seed with sample data (optional)
pnpm --filter @repo/db db:seed

# Open Prisma Studio
pnpm --filter @repo/db db:studio
```

### 4. Start Development

```bash
# Run all services
pnpm dev

# Or run individually:
pnpm web      # Web app (http://localhost:3000)
pnpm mobile   # Mobile app (Expo)
pnpm api      # API server (http://localhost:4000)
```

## 📚 Documentation

- Database Schema: `packages/db/prisma/schema.prisma`
- UI Components: `packages/ui/src`
- OpenAPI (Admin REST): `packages/api/src/openapi.yaml` (Swagger UI at `/docs` when API runs)
- Product Generator Endpoints:
  - `POST /api/admin/products/parse` — ينظّف النص ويستخرج الاسم/الوصف/المقاسات/الألوان والأسعار ويقترح variants ويعيد palette مبسّطة
  - `POST /api/admin/products/generate` — ينشئ المنتج والتباينات والوسائط والمخزون استناداً إلى المخرجات المراجَعة

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## 🏗️ Project Structure

```
ecom-platform/
├── 📁 apps/
│   ├── 📁 web/                 # Next.js web application
│   ├── 📁 admin/               # Next.js admin application
│   └── 📁 mobile/              # React Native (Expo)
├── 📁 packages/
│   ├── 📁 api/                # tRPC + Express API
│   │   ├── src/
│   │   │   ├── routers/       # API routes
│   │   │   ├── middleware/    # Auth & security
│   │   │   └── __tests__/     # API tests
│   ├── 📁 db/                 # Database & Prisma
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Database schema
│   └── 📁 ui/                 # Shared UI components
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── store/         # Zustand stores
│       │   └── __tests__/     # Component tests
├── 📁 infra/                  # Infrastructure configs
├── 📁 docs/                   # Documentation
└── 📁 .github/               # CI/CD workflows
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React Native** - Cross-platform mobile development
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management

### Backend
- **tRPC** - End-to-end typesafe APIs
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching & sessions
- **JWT** - Authentication

### Development
- **pnpm** - Package manager
- **Turborepo** - Monorepo build system
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Docker** - Containerization

### Infrastructure
- Docker Compose (local)
- Render (deployment)
- GitHub Actions (CI/CD)

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build   # runs prisma generate + builds API/Web/Admin via turbo

# Run linting
pnpm lint

# Run tests
pnpm test

# Format code
pnpm format

# Database operations
pnpm --filter @repo/db db:migrate
pnpm --filter @repo/db db:studio
pnpm --filter @repo/db db:seed
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@yourapp.com
- 📖 Documentation: [docs/](./docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

## ⚙️ Admin App (Next.js)

- Dev: `pnpm --filter admin dev`
- Build: `pnpm --filter admin build && pnpm --filter admin start`
- Auth (seed): admin@example.com / admin123

## 🌐 Web App (Next.js)

- Dev: `pnpm --filter web dev`
- Build: `pnpm --filter web build`
- Start (Render): `node .next/standalone/server.js` or `node render-start.js` (fallback)
- Key pages: `/` المنتجات، `/products/[id]`، `/cart`، `/checkout`، `/account`، `/categories`، `/search`

## 🧩 API (tRPC + Express)

- Dev: `pnpm --filter @repo/api dev`
- Build: `pnpm --filter @repo/api build`
- Endpoint: `${NEXT_PUBLIC_TRPC_URL}` (e.g. http://localhost:4000/trpc)

### Media & PDF endpoints

- Media upload: `POST /api/admin/media/upload`
  - Uses S3 presigned upload when `S3_BUCKET`/`S3_REGION`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` are set; falls back to direct Cloudinary upload when `CLOUDINARY_URL` is set.
- Invoice PDF: `GET /api/admin/orders/:id/invoice.pdf`
- Shipping label PDF: `GET /api/admin/shipments/:id/label.pdf` (4×6 inch)

### Categories SEO & Translations

- Extended `Category` with: `slug` (unique), `sortOrder`, `seoTitle`, `seoDescription`, `seoKeywords` (string[]), and `translations` (JSONB).
- Admin UI supports editing these fields and image upload via the media endpoint.

## 🗄️ Database (Prisma + Postgres)

- Migrate: `pnpm --filter @repo/db db:migrate`
- Seed: `pnpm --filter @repo/db db:seed`

## 📱 Mobile (Expo)

- Dev (Expo): `pnpm --filter mobile start`
- Public env: `EXPO_PUBLIC_TRPC_URL` (مُعرّف في app.json)
- EAS preview (اختياري):
  - Android: `pnpm --filter mobile dlx eas-cli build -p android --profile preview`
  - iOS: `pnpm --filter mobile dlx eas-cli build -p ios --profile preview`

## 📱 m.jeeey.com (Figma 1:1 Sync)

- Generator syncs Figma → Vue (Vite) with:
  - Design Tokens → `tokens.css` (colors/spacing/typography as CSS vars)
  - Auto Layout/Constraints → Flex/Grid
  - Assets auto-download and linking (images/icons/backgrounds)
  - Component detection → reusable Vue components
  - Fonts (weights/props), RTL, responsive breakpoints
- Scripts:
  - Extract mapping: `pnpm -w mweb:figma:extract` → writes `infra/figma/mapping.json`
  - Generate/update UI: `pnpm -w mweb:figma:generate`
  - Build/deploy via CI: “Figma Extract Mapping” → “Deploy to VPS (SSH)” workflows
  

## 🧭 CI (GitHub Actions)

- للفرع `feature/admin-non-product-modules` يوجد وركفلو خاص: `.github/workflows/ci-admin.yml` يقوم بـ migration-run-check و seed-run-check (admin-only) ثم build/lint/tests/E2E (Placeholder).
- تشغيل يدوي: Actions > CI / CD > CI - Admin Modules.

### CI E2E Flow (logistics→finance→notifications)

- Script: `scripts/ci/e2e-flow.mjs`
- What it does:
  - Logs in (or registers) an admin user and captures cookie.
  - Creates shipment legs for a test order (PICKUP → INBOUND → DELIVERY).
  - Pings a driver (WS-backed endpoint) and updates last-seen.
  - Marks last leg COMPLETED, records a test payment, enqueues a test notification.
  - Verifies order visibility endpoint.
- Wired in `.github/workflows/ci-cd.yml` after API/Admin build and smoke checks.

### Ops Runbooks (quick)

- Start API locally: `pnpm -C packages/api build && node packages/api/dist/index.js`
- Ensure schema (CI/Local): `pnpm -C packages/db db:push:force`
- Seed minimal admin: `pnpm -C packages/db db:seed:admin-only`
- NGINX reload on VPS: `sudo nginx -t && sudo systemctl reload nginx`
- Systemd logs: `journalctl -u ecom-api -n 200 --no-pager`

### CI database strategy (Postgres + Prisma)

- Postgres service runs in CI (`postgres:15`).
- Database URL is pinned to `postgresql://user:password@localhost:5432/ecom_db?schema=public` unless overridden by `CI_DB_URL`.
- Before any Prisma push:
  - Proactively drop lingering `Category_slug_key` (if it exists).
  - Hard reset schema: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`.
- Single authoritative Prisma push step: `pnpm --filter @repo/db db:push:force`.
- On main with `CLONE_PROD_DB=1`, Prisma push is skipped (to avoid conflicts with mirrored prod schema).

### إصلاحات تسجيل الدخول والتوجيه ونتائج النشر

- منع إعادة كتابة الروابط إلى 0.0.0.0:
  - Web (`apps/web`): بعد نجاح التسجيل/الدخول نعيد التوجيه لمسار مطلق آمن باستخدام `window.location.origin` إلى `/account`.
  - Admin (`apps/admin`): بعد النجاح نضبط الكوكي عبر نقطة داخلية `POST /api/auth/set` ثم نوجّه داخلياً إلى `/` (إزالة أي توجيه خارجي/bridge محتمل).
  - تنقية `next` بحيث يسمح بمسارات نفس الأصل فقط.
  - `resolveApiBase()` يزيل لاحقة `/trpc` إن وُجدت في `NEXT_PUBLIC_API_BASE_URL`.

#### CSP/CORS وPWA (اعتمادات نهائية لنجاح تسجيل الدخول في mweb)

- CORS (Nginx + API):
  - تمرير رأس التوثيق إلى الـ API: `proxy_set_header Authorization $http_authorization;` ضمن كتلة خادم API في `infra/nginx/jeeey.conf.tpl`.
  - السماح للرأس المخصص في الـ preflight: `add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Shop-Client" always;` لمنع خطأ: "Request header field x-shop-client is not allowed...".

- CSP (سياسة أمان المحتوى):
  - ملاحظة: التوجيه `frame-ancestors` في `<meta http-equiv="Content-Security-Policy">` يتجاهله المتصفح؛ يجب ضبطه كرأس HTTP في Nginx عند الحاجة.
  - السماح بتحميل `web-vitals` من CDN عبر إضافة `https://unpkg.com` إلى `script-src` في `apps/mweb/index.html`.

- PWA (الأيقونات):
  - تصحيح المسارات في `apps/mweb/public/manifest.webmanifest` إلى `/icon-192.png` و`/icon-512.png` وإضافة الملفات لمنع 404 من المتصفح.

- mweb التوكن والهيدرز:
  - الواجهة ترسل `Authorization: Bearer <token>` دائماً من `localStorage.shop_token`.
  - `/api/me` تقرأ التوكن من `Authorization` أو الكوكيز (`shop_auth_token`/`auth_token`) أو بارامتر `t` بعد عودة Google.

- Service Worker:
  - أخطاء مثل `Failed to convert value to 'Response'` تختفي بعد نجاح CORS. لفرض التحديث امسح الكاش أو نفّذ Hard Refresh.

- النشر (Deploy to VPS) يتحقق تلقائياً من:
  - صحة `/register` (200) وخلو HTML/مخرجات build من أي روابط `0.0.0.0`.
  - مسار دخول الأدمن end-to-end (تسجيل الدخول، ضبط الكوكي، whoami).
  - فحص CRUD للأدمن: `ensure-rbac` و`grant-admin` ثم `users/list` وإنشاء Vendor/User تجريبيين. أي فشل يوقف النشر ويطبع السبب.

- Secrets المطلوبة في GitHub:
  - `JWT_SECRET`, `MAINTENANCE_SECRET`
  - `DATABASE_URL`, `DIRECT_URL`
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
  - `SSH_PRIVATE_KEY`, `VPS_HOST`, `VPS_PORT`, `VPS_USER`
  - (اختياري) `SENTRY_DSN`, `STRIPE_*`, `CLOUDINARY_URL`

- Variables (vars) المفضّلة لغير الحساسة:
  - `COOKIE_DOMAIN`, `CORS_ALLOW_ORIGINS`
  - `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_TRPC_URL`

بعد ضبط القيم أعلاه، يصبح ضبط الدخول والإنشاء عبر لوحة التحكم مستقراً ومتوافقاً مع الإنتاج، ويتم التقاط الأخطاء تلقائياً في ورْكفلو النشر.

### DeepSeek — التحليل الذكي للمنتجات (معاينة + إنتاج)

- ملفات أساسية:
  - `packages/api/src/utils/deepseek.ts`: استدعاء DeepSeek (معاينة/إنتاج) مع مهلة 12–20s، محاولات متعددة لنقاط نهاية، واستخراج JSON من أي تغليف.
  - `packages/api/src/routers/admin-rest.ts`: نقطة `/api/admin/products/analyze` مع قواعد ما بعد المعالجة لضمان الاسم والوصف والسعر والألوان والمقاسات حتى مع نصوص فوضوية.
  - `scripts/ci/smoke-analyze.mjs`: فحص دخاني حقيقي (يسجل دخول API) ويتأكد من: استخدام DeepSeek، الاسم/الوصف موجودين، السعر يساوي 3500 (أولوية القديم)، عدم وجود أرقام عربية، والحفاظ على عبارة ألوان عامة.
  - `scripts/ci/e2e-deepseek.spec.mjs`: اختبار Playwright E2E يسجل دخول الواجهة الإدارية، يذهب إلى `products/new`، يلصق النص، يضغط “تحليل/معاينة”، يعترض طلب الشبكة ويتحقق أن `meta.deepseekUsed === true` وأن النتيجة سليمة على الواجهة.

- تهيئة المفاتيح:
  - المصدر: لوحة التحكم (Integrations > AI) أو Secrets في Actions.
  - المفتاح: `DEEPSEEK_API_KEY` (الأولوية لإعداد لوحة التحكم، ثم بيئة النظام). التأكد من تحميله ضمن خدمة systemd عبر `EnvironmentFile`.

- قواعد السعر الذكية (سارية على المعاينة والإنتاج):
  1) أولوية “عمله قديم/سعر شمال/ريال قديم”.
  2) ثم “سعر الشراء”.
  3) ثم أول سعر ظاهر أو الأدنى > 100.
  4) تتجاهل أرقام الوزن (مثل 80 عند “يلبس إلى وزن 80”).

- الألوان:
  - إذا وردت عبارة عامة في النص مثل “4 ألوان/أربعة ألوان/ألوان متعددة”، تُحفظ كما هي ولا تُستبدل بألوان محددة.
  - خلاف ذلك تُستخرج الألوان المذكورة بصيغها.

- المقاسات:
  - تدعم X‑sizes حتى 6X (مثل `XXXXXL`)، “فري سايز/مقاس واحد”، ونطاقات رقمية مثل “38 إلى 44” توسّع إلى قائمة.

- الاسم والوصف:
  - الاسم 8–12 كلمة، يضيف النوع + صفات أساسية من النص ويمنع الأسماء العامة (مثل “لانجري” فقط).
  - الوصف بصيغة جدول عربي ثابت: الخامة/الصناعة/التصميم/الألوان/المقاسات/الميزات/الاستخدام.

- CI (وركفلو):
  - `.github/workflows/deepseek.yml`: يشغّل `scripts/ci/smoke-analyze.mjs` على push/جدولة/يدويًا.
  - `.github/workflows/deepseek-e2e.yml`: يشغّل E2E Playwright على الواجهة الإدارية؛ يعتمد `ADMIN_BASE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` من Secrets.

نماذج مخرجات CI (smoke):
```
price_low debug: 3500
analyze smoke OK: { name: '...', low: 3500, colors: [ '...' ] }
📏 المقاسات: [ '...' ]
🔑 الكلمات المفتاحية: [...]
✅ analyze smoke OK (summary): { name: '...', low: 3500, colors: [...], sizes: [...], deepseek_used: true }
```

### 🗂️ Categories: Production-safe fixes (Sep 2025)

- عالجنا أعطال إنشاء/عرض التصنيفات في الإنتاج الناتجة عن اختلاف مخطط قاعدة البيانات (أعمدة مثل `seoTitle`/`sortOrder`/`translations`).
- API الآن يضمن الأعمدة بأمان عند الإقلاع وعبر نقطة الصيانة:
  - `POST /api/admin/maintenance/ensure-category-seo` (يتطلب `x-maintenance-secret`).
  - يقوم بإنشاء الأعمدة عند الحاجة، وتخفيف قيود NOT NULL القديمة، وضبط قيم افتراضية آمنة.
- إنشاء التصنيف يستخدم إدراج SQL مباشر بحدٍ أدنى من الحقول (id, name) لتفادي انتقاء أعمدة مفقودة.
- نقاط القائمة/tree أُعيدت كتابتها لتُرجع حقولًا دنيا فقط (`id`, `name`, `parentId`, `slug`) عبر SQL خام، مع ترتيب مناسب، لضمان ظهور الفئات الجديدة فورًا.
- تم تحديث ورْكفلو النشر لإجراء smoke تلقائي: تسجيل دخول API، ضمان الأعمدة، إنشاء فئة، ثم سردها.

ملاحظات تشغيلية:
- إذا ظهرت رسالة "تمت الإضافة" ولم تظهر الفئة، فذلك كان بسبب محاولة الواجهة قراءة أعمدة غير موجودة في مخطط قديم. الإصلاحات أعلاه تعالج ذلك، ولا يلزم تحديث المتصفح سوى إعادة تحميل الصفحة.

## 🔐 Admin Credentials (Seed)

- Email: `admin@example.com`
- Password: `admin123`

## 📜 Admin REST & API Docs

- REST الإداري (RBAC): `/api/admin/*` (Authorization: Bearer أو HttpOnly cookie)
- OpenAPI/Swagger: `packages/api/src/openapi.yaml`
- Postman: `docs/Postman_Collection_Admin.json`
 - Swagger UI: `/docs` أثناء التشغيل (API)

### Backups: Retention & Schedule & Restore

- Endpoints:
  - `POST /api/admin/backups/run` — تشغيل نسخة احتياطية جديدة، يطبق تنظيف النسخ الأقدم من 30 يومًا (retention) قبل الإرجاع/العرض.
  - `GET /api/admin/backups/list` — عرض النسخ (بعد تطبيق retention تلقائيًا).
  - `POST /api/admin/backups/{id}/restore` — استعادة عملية (تحدّث `backup.last_restore` وتُنشئ Vendor تجريبي للتأكيد).
  - `POST /api/admin/backups/schedule` — ضبط الجدولة (daily/off) محفوظة في إعدادات النظام.

- تشغيل محليًا:
```bash
pnpm --filter @repo/api dev # API على http://localhost:4000
# Swagger UI: http://localhost:4000/docs

# تجربة سريعة (Bearer ADMIN مطلوب)
curl -H "Authorization: Bearer <TOKEN>" -X POST http://localhost:4000/api/admin/backups/run
curl -H "Authorization: Bearer <TOKEN>" http://localhost:4000/api/admin/backups/list
curl -H "Authorization: Bearer <TOKEN>" -X POST http://localhost:4000/api/admin/backups/<id>/restore
curl -H "Authorization: Bearer <TOKEN>" -H 'content-type: application/json' -d '{"schedule":"daily"}' -X POST http://localhost:4000/api/admin/backups/schedule
```

## 🧪 Seeds (Admin-only)

- لتشغيل seed بدون منتجات:
```
pnpm --filter @repo/db db:seed:admin-only
```

## 🧪 CI Checks (فرع الميزة)

- migration-run-check: `scripts/ci/migration-run-check.sh`
- seed-run-check: `scripts/ci/seed-run-check.sh`
- build/lint/tests: عبر Workflow `ci-admin.yml`
- e2e-admin-check: `scripts/ci/e2e-admin-check.sh`
- security scan: `npm audit` (تحذيري)

## 🚀 Render Deployment (recommended)

Services and suggested configuration:

- API (Root: `packages/api`)
  - Build: `pnpm install --no-frozen-lockfile && pnpm --filter @repo/db build && pnpm --filter @repo/api build`
  - Start: `node dist/index.js`
  - Node: 20
- Web (Root: `apps/web`)
  - Build: `pnpm install --no-frozen-lockfile && pnpm build && [ -d public ] && cp -r public .next/standalone/ || echo "skip"`
  - Start: `node .next/standalone/server.js` (or `node render-start.js`)
  - Node: 20
- Admin (Root: `apps/admin`)
  - Build: `pnpm install --no-frozen-lockfile && pnpm build && [ -d public ] && cp -r public .next/standalone/ || echo "skip"`
  - Start: `node .next/standalone/server.js`
  - Node: 20

Tips:
- Clear Build Cache before redeploying when switching Start/Build commands.
- Ensure `NEXT_PUBLIC_TRPC_URL`, `NEXT_PUBLIC_APP_URL`, `JWT_SECRET`, `DATABASE_URL` are set.
- للتتبع اللحظي: Socket.IO مفعّل في الـ API ويُبث `driver:locations` كل 10 ثوانٍ؛ الواجهة تتصل باستخدام CDN للعميل.

## 📌 What's New (Production Parity & Logistics)

- Fixed login/redirect issues causing 0.0.0.0 by moving admin cookie setting to an internal endpoint and enforcing absolute URLs on web login/register.
- Hardened CI/CD deploy with server smoke checks, 0.0.0.0 scans, admin E2E login, and CRUD smokes (RBAC/roles/users/vendors).
- Implemented Logistics pages inside Admin (Arabic, RTL):
  - التوصيل من المورد (Pickup): تبويبات انتظار/تنفيذ/مكتمل + تصدير CSV/PDF/XLS.
  - المستودع: المعالجة والاستلام (Warehouse): الاستلام/الفرز/جاهز للتسليم + تصدير CSV/PDF/XLS.
  - التوصيل إلى العميل (Delivery): الطلبات الجاهزة/قيد التوصيل/مكتمل/مرتجعات + خريطة حية (MapLibre) + إثبات التسليم (توقيع وصورة) + تصدير CSV/PDF/XLS.
- Finance: صفحة "المصروفات" CRUD كاملة مع نموذج Prisma وREST endpoints.
- Drivers:
  - تبويبات وسطية (قائمة/خريطة/إضافة) مع بحث وفلاتر وتصدير CSV/XLS/PDF.
  - خريطة MapLibre مباشرة مع بطاقات جانبية وتركيز على السائق.
  - تتبع لحظي عبر Socket.IO (API يبث driver:locations كل 10 ثوانٍ؛ الواجهة تستمع وتحدّث "آخر ظهور").
  - تفاصيل السائق: حالة/تفعيل، تعيين طلب، مكتمل مؤخراً، Ledger مالي، وثائق (رفع وصلاحية).
  - صلابة تشغيلية: تهيئة جداول وأعمدة السائقين تلقائياً لمنع أخطاء 500.

### 🧭 PWA (Web/Admin)

- Web (`apps/web`):
  - Added `public/manifest.webmanifest` and `public/sw.js` with runtime registration in `src/app/providers.tsx`.
  - Next headers expose `Service-Worker-Allowed: /`.
- Admin (`apps/admin`):
  - Added `public/manifest.webmanifest` and `public/sw.js` with registration in `src/app/layout.tsx`.

### 🔐 Admin SSO (OIDC-ready)

- API endpoints:
  - `GET /api/admin/auth/sso/login` → يوجّه إلى موفر OIDC.
  - `GET /api/admin/auth/sso/callback` → يستبدل الكود بـ id_token ويُصدر JWT ويعيد إلى `/bridge?token=...` على `admin`.
- زر "تسجيل الدخول عبر المؤسسة" مضاف إلى صفحة دخول الأدمن (مشروط بـ `NEXT_PUBLIC_SSO_ISSUER`).

### 🚚 Logistics DB Compatibility

- نقاط الصيانة والتهيئة تضمن جداول/أعمدة اللوجستيات دون هجرة مخصّصة:
  - `POST /api/admin/maintenance/ensure-logistics`
    - جداول: `Driver`, `ShipmentLeg`, `Package` + فهارس.
    - ENUMs: `ShipmentLegType`, `ShipmentLegStatus` وإنفاذ الأعمدة.
    - أعمدة إضافية متوافقة: `fromLocation`, `toLocation`, `scheduledAt`, `startedAt`, `completedAt` على `ShipmentLeg`، و`orderId`, `poId`, `weight`, `dimensions`, `priority` على `Package`.
- استعلامات قائمة الالتقاط تم تحويلها إلى SQL خام بانتقاء أعمدة مضمونة الوجود لمنع أخطاء CI على قواعد قديمة.

## 🔐 Production Parity: Secrets & Vars (GitHub)

Set these in GitHub repository Settings → Secrets and Variables → Actions:

- Secrets (required):
  - `JWT_SECRET`
  - `MAINTENANCE_SECRET`
  - `DATABASE_URL`, `DIRECT_URL`
  - `SSH_PRIVATE_KEY` (private key for VPS SSH)
  - `VPS_HOST`, `VPS_PORT` (22), `VPS_USER` (root)
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
  - Optional: `SENTRY_DSN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDINARY_URL`
- Variables (vars) for non-sensitive configuration:
  - `COOKIE_DOMAIN` (e.g. `.jeeey.com`)
  - `CORS_ALLOW_ORIGINS` (e.g. `https://jeeey.com,https://www.jeeey.com,https://admin.jeeey.com,https://api.jeeey.com`)
  - `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`
  - `NEXT_PUBLIC_API_BASE_URL` (e.g. `https://api.jeeey.com`)
  - `NEXT_PUBLIC_TRPC_URL` (e.g. `https://api.jeeey.com/trpc`)

The deploy workflow `.github/workflows/deploy-vps.yml` will fail early with a clear message if `VPS_HOST` is missing, preventing the "missing server host" error.

### Network resilience & SSH reachability

- pnpm/corepack steps include retries to mitigate transient ECONNRESET during `corepack prepare pnpm@8.6.10 --activate`.
- SSH reachability is checked before deploy; if port 22 is unreachable, deployment is skipped safely instead of failing the whole pipeline.

## 🚀 CI/CD: Deploy to VPS (SSH)

Workflow: `.github/workflows/deploy-vps.yml`

Steps overview:
- Pre-deploy build verification for API/Admin in CI to catch TypeScript errors early.
- Archive the repo, upload to server.
- Prepare `.env.api` and `.env.web` remotely from Secrets/Vars. Existing `JWT_SECRET`/`MAINTENANCE_SECRET` are preserved (no random regeneration unless absent).
- Run `infra/scripts/deploy.sh` to install, migrate Prisma, build, and restart `systemd` services.
- Install/reload NGINX from `infra/nginx/jeeey.conf.tpl`.
- Post-deploy smoke tests:
  - API health on localhost.
  - Admin startup on 3001 and static chunk availability.
  - Web on 3000.
  - Verify `https://jeeey.com/register` returns 200 and no `0.0.0.0` in HTML/builds.
  - Admin login E2E via `https://admin.jeeey.com/api/admin/auth/login`, verify cookie and whoami.
  - Admin CRUD smoke: `ensure-rbac`, `grant-admin`, users list, create vendor/user.
  - External HTTPS smokes for web/admin/mweb/api.

Services on VPS (systemd): `ecom-api`, `ecom-admin`, `ecom-web`. Use `journalctl -u <svc> -n 200 --no-pager` to inspect.

### Data safety during deploy

- The deploy script (`infra/scripts/deploy.sh`) never seeds data by default. To allow controlled seeding, set `DEPLOY_ALLOW_SEEDING=1`. Otherwise, any admin/user/product/category/order seeding is skipped. This prevents accidental test data creation on production.

## 🔐 Admin Login: Final Flow

- Web (`apps/web`): redirects use absolute origin after login/register.
- Admin (`apps/admin`):
  - Sanitizes `next` to same-origin paths.
  - Sets auth cookie by calling internal route `POST /api/auth/set` with token; then `window.location.assign('/')`.
  - API base resolver strips `/trpc` if leaked into `NEXT_PUBLIC_API_BASE_URL`.

## 🚚 Logistics Inside Admin

- التوصيل من المورد: تبويبات "قيد الانتظار/قيد التنفيذ/مكتمل"، تعيين سائق، تغيير حالة، تصدير CSV/PDF/XLS.
- المستودع: تبويبات "الاستلام من السائق/الفرز والجرد/جاهز للتسليم"، أزرار تأكيد/توثيق/تقارير، مؤقتات ومؤشرات.
- التوصيل إلى العميل: "الطلبات الجاهزة/قيد التوصيل/مكتمل/مرتجعات"، خريطة حية (MapLibre CDN) تعرض مواقع السائقين، واجهة إثبات تسليم:
  - SignaturePad (canvas) + رفع صورة (Base64).
  - Endpoint: `POST /api/admin/logistics/delivery/proof` { orderId, signatureBase64?, photoBase64? }.
  - عند النجاح: يحدّث الطلب إلى `DELIVERED` ويكمل أرجل الشحن `DELIVERY`.

Exports: CSV + XLS (CSV بامتداد .xls) + PDF placeholders لكلٍ من pickup/warehouse/delivery.

RBAC: تمت إضافة صلاحيات `logistics.read`, `logistics.update`, `logistics.dispatch`, `logistics.scan`.

### تفاصيل إضافية (UI/UX)

- نظام ألوان للحالات: أخضر (مكتمل) / أصفر (قيد التنفيذ) / أحمر (متوقف/مشكلة) / أزرق (معلّق).
- تبسيط تغيير الحالة من الجداول مباشرة، مؤشرات زمنية (الوقت المنقضي)، صور مصغّرة للمنتجات، وتصدير PDF/Excel/CSV.

## 🧷 Vendors (الموردون)

- Invoices/Payments tab: قائمة/فلترة/تصدير، stub لمطابقة PO ↔ GRN.
- Catalog upload: CSV/XLS مع واجهة ربط SKU (mapping) والتحقق من الأعمدة.
- Orders workflow: تبويب أوامر المورد مع PO/GRN وخطوط الأصناف، حالات الاستلام الجزئي.
- Scorecard & Notifications: مؤشرات أداء (KPIs) ورسوم بيانية وتنبيهات/مراسلات من لوحة المورد.

## 💵 Finance

- المصروفات: REST
  - `GET /api/admin/finance/expenses`
  - `POST /api/admin/finance/expenses`
  - `PATCH /api/admin/finance/expenses/:id`
  - `DELETE /api/admin/finance/expenses/:id`
  - `GET /api/admin/finance/expenses/export/csv`
- تقارير: `/api/admin/finance/pnl`, `/cashflow`, `/revenues`, `/invoices` + settle.

- الحسابات والدليل المحاسبي (Chart of Accounts):
  - `GET /api/admin/finance/accounts`
  - `POST /api/admin/finance/accounts` (إضافة/تحديث)
  - قيود اليومية (Journal):
    - `GET /api/admin/finance/journal`
    - `GET /api/admin/finance/trial-balance`
- الفواتير الدائنة/المدينة (AP/AR):
  - `POST /api/admin/finance/invoices`
  - `GET /api/admin/finance/invoices`
  - مواعيد الاستحقاق والتنبيهات مفعّلة (idempotent schema ensure)

## 🏷️ Discounts & Campaigns

- Campaigns (تقسيم/جدولة/كوبونات):
  - `POST /api/admin/marketing/campaigns`
  - `GET /api/admin/marketing/campaigns`
- Coupons (إنشاء/قائمة/تقرير الأداء):
  - `POST /api/admin/marketing/coupons`
  - `GET /api/admin/marketing/coupons`
  - `GET /api/admin/marketing/coupons/:code/performance`

## 🏆 Jeeey Points, Badges, Jeeey Club (Subscriptions), Wallet, FX, Affiliate

- نقاط (Ledger):
  - `POST /api/admin/points/accrue`
  - `POST /api/admin/points/redeem`
- الشارات (Badges):
  - `POST /api/admin/badges` (تعريف)
  - `POST /api/admin/badges/grant` (إسناد)
- Jeeey Club (الاشتراكات):
  - `POST /api/admin/subscriptions/plans`
  - `POST /api/admin/subscriptions`
  - `GET /api/admin/subscriptions/:userId` (قائمة المستخدم)
- المحفظة (Wallet):
  - `GET /api/admin/wallet/:userId/balance`
  - `POST /api/admin/wallet/entries`
- العملات وأسعار الصرف (FX):
  - `GET /api/admin/fx/convert?from=USD&to=SAR&amount=100`
- الإحالات (Affiliate):
  - `POST /api/admin/affiliate` (إنشاء رمز)
  - `GET /api/admin/affiliate/stats?code=...`

### Loyalty & Affiliate & Preferences — mweb/API wiring (Sep 2025)

- Loyalty settlement on order pay (API): upon `POST /api/orders/:id/pay` accrues points (1 per 10 SAR) into `PointLedger`.
- Coupons apply endpoint for checkout: `POST /api/coupons/apply` validates code and schedule; advanced rules saved with coupons (JSON) via admin editor.
- User notification preferences: `GET/PUT /api/me/preferences` (email/sms/whatsapp/webpush) with mweb page `/prefs`.
- Affiliate ledger & payouts: on order create/pay, records commission in `AffiliateLedger` and exposes `GET /api/admin/affiliates/ledger` and `POST /api/admin/affiliates/payouts`.
- mweb points: page `/points` shows balance/log and redeem-to-coupon flow.

### Payments/Webhooks/Shipping/Search

- Payment session: `POST /api/payments/session` (Stripe ready when keys are set via Integrations page; HyperPay placeholder). mweb checkout redirects to 3DS/success/failure pages.
- Stripe webhook: `POST /webhooks/stripe` (extend signature validation with `STRIPE_WEBHOOK_SECRET`).
- Shipping quote: `GET /api/shipping/quote?city=...&method=std|fast` used by mweb checkout to show dynamic shipping cost.
- Search suggestions: `GET /api/search/suggest?q=...` used by mweb search.

ملاحظة: كل نقطة من النقاط أعلاه مضمّنة بـ ensure‑schema داخلي idempotent لتهيئة الجداول تلقائياً على قواعد قديمة/فارغة.

## 🛠️ Troubleshooting (CI/CD & Runtime)

- Build error: TS property not found (e.g., `deliveredAt` on `Order`)
  - Ensure fields exist in `packages/db/prisma/schema.prisma`. Adjust API updates to schema fields only, then re-run build.
- appleboy/ssh-action: `missing server host`
  - Define `VPS_HOST` (Secret or Var). The workflow now fails fast if missing.
- 0.0.0.0 redirects after login/register
  - Confirm `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_TRPC_URL` are correct.
  - Admin uses internal `/api/auth/set` to set cookie, avoiding cross-origin bridge.
- Facebook CAPI signature/403
  - تأكد من `FB_PIXEL_ID` و`FB_ACCESS_TOKEN` و`FB_TEST_EVENT_CODE` (اختياري) في Secrets.
  - تحقق من السجلات في `packages/api/src/services/fb.ts` عند الفشل.
- SSO provider errors
  - اضبط `SSO_ISSUER`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, `SSO_REDIRECT_URI`, و`ADMIN_BASE_URL`.
  - تحقق من سجلات `/api/admin/auth/sso/callback` لإرجاع مزوّد OIDC.
- Admin CRUD smoke unauthorized
  - Set `MAINTENANCE_SECRET` Secret. The workflow calls `ensure-rbac` and `grant-admin` post-deploy.
- Services not ready
  - Check `journalctl -u ecom-api/ecom-admin/ecom-web -n 200 --no-pager` on VPS.
- DB permissions/roles missing
  - Trigger `/api/admin/maintenance/ensure-rbac` and `/grant-admin` with header `x-maintenance-secret`.
- Prisma db push: `ERROR: relation "Category_slug_key" already exists`
  - The CI now drops any lingering `Category_slug_key` index and resets the `public` schema before push.
  - Ensure no custom SQL creates that index in tests. We avoid creating it in `packages/api/src/setupTests.ts`.
  - On `main` with `CLONE_PROD_DB=1`, Prisma push is skipped to prevent conflicts with mirrored prod DB.

## 🔧 Reference: Key Files

- Admin login fixes: `apps/admin/src/app/(auth)/login/page.tsx`, `apps/admin/src/app/api/auth/set/route.ts`
- API Logistics/Finance: `packages/api/src/routers/admin-rest.ts`
- Prisma models: `packages/db/prisma/schema.prisma`
- Admin Logistics UI:
  - Pickup: `apps/admin/src/app/logistics/pickup/page.tsx`
  - Warehouse: `apps/admin/src/app/logistics/warehouse/page.tsx`
  - Delivery: `apps/admin/src/app/logistics/delivery/page.tsx`
- CI/CD: `.github/workflows/deploy-vps.yml`
- NGINX template: `infra/nginx/jeeey.conf.tpl`
- Deploy script: `infra/scripts/deploy.sh`
  - Seeding is disabled by default. To opt-in for controlled bootstrap set `DEPLOY_ALLOW_SEEDING=1`.

This README is the source of truth for configuration and recovery steps for production parity, deployments, and admin logistics features.

## 🔁 CI Dev Mirror (jeeey.local over HTTPS)

Workflow: `.github/workflows/dev-mirror.yml`

What it does:
- Spins up Postgres (service) and builds API/Web/Admin.
- Starts API on :4000, Web on :3000, Admin on :3001.
- Generates a self-signed certificate for `jeeey.local` and subdomains (`api.jeeey.local`, `admin.jeeey.local`, `www.jeeey.local`, `m.jeeey.local`).
- Runs NGINX in Docker mapping 8443→443 (and 8080→80) to proxy these domains to the local services.
- Executes HTTPS smoke checks via `curl --resolve` to validate cookies/CORS/domains similar to production.

Environment mapping used by the mirror job:
- `COOKIE_DOMAIN=.jeeey.local`
- `NEXT_PUBLIC_APP_URL=https://jeeey.local`
- `NEXT_PUBLIC_ADMIN_URL=https://admin.jeeey.local`
- `NEXT_PUBLIC_API_BASE_URL=https://api.jeeey.local`
- `NEXT_PUBLIC_TRPC_URL=https://api.jeeey.local/trpc`
- `VITE_API_BASE=https://api.jeeey.local`
- `EXPO_PUBLIC_TRPC_URL=https://api.jeeey.local/trpc`
- `DATABASE_URL`, `DIRECT_URL` → CI Postgres service
- `JWT_SECRET`, `MAINTENANCE_SECRET` → Secrets if available, else CI defaults

Trigger: Dispatch “Dev Mirror (HTTPS + NGINX + jeeey.local)” or push to `main`.
