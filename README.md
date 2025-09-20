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

## 🗄️ Database (Prisma + Postgres)

- Migrate: `pnpm --filter @repo/db db:migrate`
- Seed: `pnpm --filter @repo/db db:seed`

## 📱 Mobile (Expo)

- Dev (Expo): `pnpm --filter mobile start`
- Public env: `EXPO_PUBLIC_TRPC_URL` (مُعرّف في app.json)
- EAS preview (اختياري):
  - Android: `pnpm --filter mobile dlx eas-cli build -p android --profile preview`
  - iOS: `pnpm --filter mobile dlx eas-cli build -p ios --profile preview`

## 🧭 CI (GitHub Actions)

- للفرع `feature/admin-non-product-modules` يوجد وركفلو خاص: `.github/workflows/ci-admin.yml` يقوم بـ migration-run-check و seed-run-check (admin-only) ثم build/lint/tests/E2E (Placeholder).
- تشغيل يدوي: Actions > CI / CD > CI - Admin Modules.

### إصلاحات تسجيل الدخول والتوجيه ونتائج النشر

- منع إعادة كتابة الروابط إلى 0.0.0.0:
  - Web (`apps/web`): بعد نجاح التسجيل/الدخول نعيد التوجيه لمسار مطلق آمن باستخدام `window.location.origin` إلى `/account`.
  - Admin (`apps/admin`): بعد النجاح نضبط الكوكي عبر نقطة داخلية `POST /api/auth/set` ثم نوجّه داخلياً إلى `/` (إزالة أي توجيه خارجي/bridge محتمل).
  - تنقية `next` بحيث يسمح بمسارات نفس الأصل فقط.
  - `resolveApiBase()` يزيل لاحقة `/trpc` إن وُجدت في `NEXT_PUBLIC_API_BASE_URL`.

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

## 💵 Finance

- المصروفات: REST
  - `GET /api/admin/finance/expenses`
  - `POST /api/admin/finance/expenses`
  - `PATCH /api/admin/finance/expenses/:id`
  - `DELETE /api/admin/finance/expenses/:id`
  - `GET /api/admin/finance/expenses/export/csv`
- تقارير: `/api/admin/finance/pnl`, `/cashflow`, `/revenues`, `/invoices` + settle.

## 🛠️ Troubleshooting (CI/CD & Runtime)

- Build error: TS property not found (e.g., `deliveredAt` on `Order`)
  - Ensure fields exist in `packages/db/prisma/schema.prisma`. Adjust API updates to schema fields only, then re-run build.
- appleboy/ssh-action: `missing server host`
  - Define `VPS_HOST` (Secret or Var). The workflow now fails fast if missing.
- 0.0.0.0 redirects after login/register
  - Confirm `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_TRPC_URL` are correct.
  - Admin uses internal `/api/auth/set` to set cookie, avoiding cross-origin bridge.
- Admin CRUD smoke unauthorized
  - Set `MAINTENANCE_SECRET` Secret. The workflow calls `ensure-rbac` and `grant-admin` post-deploy.
- Services not ready
  - Check `journalctl -u ecom-api/ecom-admin/ecom-web -n 200 --no-pager` on VPS.
- DB permissions/roles missing
  - Trigger `/api/admin/maintenance/ensure-rbac` and `/grant-admin` with header `x-maintenance-secret`.

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

This README is the source of truth for configuration and recovery steps for production parity, deployments, and admin logistics features.
