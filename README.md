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

### ♻️ Variants End-to-End (إنشاء/حفظ/عرض) — الإصلاحات النهائية

هذا القسم يوثّق بشكل عملي كيف نولّد التباينات (ألوان/مقاسات)، نحفظها في قاعدة البيانات بلا فقدان، ونضمن عرضًا صحيحًا في الويب والموبايل، مع معالجة مشكلة النقص/اختلاط الصفوف.

1) لوحة التحكم — إنشاء المنتج
- صفحة الإنشاء (`apps/admin/src/app/products/new/page.tsx`):
  - توليد مصفوفة كاملة عند اختيار مجموعتي مقاس: “مقاسات بالأحرف” × “مقاسات بالأرقام” × الألوان. كل صف تباين يتضمّن:
    - `size`: قد يكون مركّبًا مثل `مقاسات بالأحرف:M|مقاسات بالأرقام:96`.
    - `color`: اسم اللون.
    - `option_values`: قائمة منظّمة تحفظ كل جزء: `{ name:'size', value:'مقاسات بالأحرف:M' }`, `{ name:'size', value:'مقاسات بالأرقام:96' }`, `{ name:'color', value:'أسود' }`.
  - عند الإرسال إلى الخادم، تبقى `option_values` المصدر الموثوق لاستخراج المقاس/اللون لاحقًا (لا نعتمد على parsing حر من `name/value`).

2) الخادم — حفظ/استكمال التباينات
- نقطة `POST /api/admin/products/:id/variants` (ملف `packages/api/src/routers/admin-rest.ts`):
  - تستخرج `size/color/option_values` وتخزنها داخل `value` كـ JSON قياسي: `{ label, size, color, option_values }` لتجنّب أي فَقْد لاحقًا.
  - في حال كانت المجموعة ناقصة مع سيناريو (أحرف × أرقام × ألوان)، الخادم يستكمل تلقائيًا التركيبات الناقصة ليضمن كامل المصفوفة (مثلاً 4×4×6 = 96 دائمًا).
  - معالجة `SKU` داخل الدفعة: يمنع دمج تباينات متعددة عن طريق تجاهل `SKU` المكرر ضمن نفس الطلب والاكتفاء بالتحديث حسب `SKU` داخل نفس المنتج فقط.

3) لوحة التحكم — التعديل
- عند الفتح للتعديل، الخادم يعيد التباينات مع `size` و`color` المستخرجة من JSON أو `option_values`. هذا يمنع “اختزال الألوان إلى لون واحد” ويضمن أن قيمة المقاس المركّبة تبقى واضحة.

4) واجهة الويب (سطح المكتب)
- صفحة المنتج (`apps/web/src/app/products/[id]/page.tsx`):
  - تفضّل المجموعات المسماة التي يوفّرها الخادم (`attributes`: `key=size|color`, `label`, `values`).
  - إذا كانت هناك مجموعات مسماة (مثل “مقاسات بالأحرف” و“مقاسات بالأرقام”) تُخفي صف “المقاس” العام وتعرض صفين منفصلين.
  - فقط عند غياب المجموعات المسماة بالكامل، يظهر صف “المقاس” العام كـ fallback.

5) واجهة الموبايل (m.jeeey.com)
- صفحة المنتج (`apps/mweb/src/pages/Product.vue`):
  - إخفاء صف المقاس العام حتى انتهاء تحميل السمات `attrsLoaded` لمنع الوميض/اختلاط الأزرار.
  - عند وجود مجموعتي مقاس، تُعرض كصفّين منفصلين دائمًا، ولا يظهر الصف العام إطلاقًا.
  - يُبنى `variantByKey` من الألوان + المقاس المركّب لضبط السعر/المخزون بدقة على اختيار المستخدم.

6) فحوص CI لضمان المصفوفة الكاملة
- سكربت `scripts/ci/verify-full-matrix.mjs`:
  - ينشئ منتجًا، يرفع 64 تباينًا (4 ألوان × 4 أحرف × 4 أرقام)، ويتحقق أن واجهة الإدارة تعرض العدد نفسه.
  - هذا يمنع تراجعًا إلى 16/32/48 تباين عند أي تغيير مستقبلي.

7) خلاصة المشاكل التي تم حلّها
- نقص التباينات بعد الحفظ (ظهور ~16 فقط): الخادم بات يستكمل المصوفة الناقصة تلقائيًا ويُخزّن `option_values` في JSON.
- ضياع الألوان على التعديل: القراءة أصبحت من JSON/`option_values` وليس من `name/value` فقط.
- دمج تباينات بسبب `SKU` مكرر: تجاهل الـ SKU المكرر داخل الدفعة ومنع التحديث عبر `SKU` إلا داخل نفس المنتج.
- ظهور صف “المقاس” الإضافي على الويب: أخفينا الصف العام عندما تتوفر مجموعات مقاس مسماة.
- وميض/اختلاط صف المقاسات على الموبايل: إخفاء الصف العام حتى جاهزية السمات، ثم عرض صفّي الأحرف/الأرقام منفصلين.

مواقع التغيير الرئيسية:
- Admin: `apps/admin/src/app/products/new/page.tsx`
- API (Admin REST): `packages/api/src/routers/admin-rest.ts`
- Web PDP: `apps/web/src/app/products/[id]/page.tsx`
- Mobile Web PDP: `apps/mweb/src/pages/Product.vue`

### 🛒 Cart Variant Handling (Fixes) — معالجة التباينات في السلة

تم إصلاح مشكلة دمج التباينات المختلفة (مثل نفس المنتج بألوان مختلفة) في سطر واحد في السلة. الإصلاح شمل المستخدمين المسجلين والزوار (Guest).

#### 1. قاعدة البيانات (Database)
- **إزالة القيود الفريدة (Unique Constraints):**
  - تم حذف القيد `@@unique([cartId, productId])` من جدول `CartItem`.
  - تم حذف القيود الفريدة من جدول `GuestCartItem`.
  - تم استبدالها بفهارس (Indexes) غير فريدة `@@index([cartId, productId])` لتحسين الأداء والسماح بتكرار المنتج بخصائص مختلفة.

#### 2. المنطق الخلفي (Backend Logic)
- **مقارنة الخصائص (Attributes Comparison):**
  - تم تحديث دوال `addItem`, `updateItem`, `removeItem` في `packages/api/src/routers/cart.ts` (للمسجلين) و `shop.ts` (للزوار).
  - بدلاً من البحث عن المنتج بـ `productId` فقط، يتم الآن جلب جميع العناصر لنفس المنتج ومقارنة حقل `attributes` (مثل `color`, `size`) بدقة.
  - يتم دمج الكميات فقط إذا تطابقت جميع الخصائص تماماً.

#### 3. البرمجيات الوسيطة (Middleware)
- **تحليل الطلبات (Body Parsing):**
  - تم إضافة `app.use(express.json())` و `app.use(express.urlencoded())` في `packages/api/src/index.ts`.
  - هذا كان السبب الرئيسي في وصول `attributes` كـ `undefined` سابقاً، مما أدى لدمج المنتجات خطأً.

#### 4. سلة الزوار (Guest Cart)
- **إصلاح شامل:**
  - تم تطبيق نفس منطق مقارنة الخصائص على نقاط `POST /cart/add`, `/cart/update`, `/cart/remove`.
  - تم تحديث دالة `mergeGuestIntoUserIfPresent` لضمان انتقال التباينات بشكل صحيح عند تسجيل الدخول، دون دمجها عشوائياً.

### 🤖 DeepSeek (محلي) — وضع صارم 100% لحقول النص

زر "تحليل عبر DeepSeek (محلي)" في لوحة التحكم أصبح يعمل وفق وضع صارم يعتمد حصراً على DeepSeek لاستخراج الحقول النصية (الاسم، جدول الوصف، السعر القديم/للشمال، الألوان، المقاسات، الكلمات المفتاحية). معالجة الصور فقط تبقى محليّة لاستخلاص لوحات الألوان. لا يوجد أي توليد محلي بديل عند تفعيل هذا الوضع.

- **المسار**: `POST /api/admin/products/analyze?deepseekOnly=1`
- **الملفات**:
  - الخادم: `packages/api/src/routers/admin-rest.ts` (فرع deepseekOnly الصارم)
  - مرافِق DeepSeek: `packages/api/src/utils/deepseek.ts` (callDeepseekPreviewStrict)
  - الواجهة (Admin): `apps/admin/src/app/products/new/page.tsx` (زر DeepSeek محلي)

#### القواعد الصارمة (مطبّقة داخل Prompt)
1) **تنظيف النص**: حذف الإيموجي/الزخارف/العبارات الترويجية تماماً؛ نعتمد النص الوصفي فقط.
2) **اسم المنتج**: 8–12 كلمة بالضبط، يضمّ النوع + الخامة + الميزة الأبرز + الفئة، دون رموز أو تسويق.
3) **وصف المنتج كجدول**: `description_table` من صفوف `{label,value}` فقط؛ يُضاف المقاسات/الألوان/الوزن/وصف المقاس إذا ذُكرت. ممنوع الأسعار/العروض في الجدول.
4) **السعر**: استخراج سعر الشراء القديم/للشمال فقط؛ تجاهُل "ريال جديد/جنوبي/سعودي/قعيطي" تماماً.
5) **المقاسات/الألوان/المخزون**: تُستخرج فقط إذا ذُكرت بوضوح. الألوان يجب أن تكون أسماء صريحة؛ تُرفض العبارات العامة (مثل "ألوان متعددة"). عند "فري سايز" تكون `sizes:["فري سايز"]` والوزن في صف بالجدول إن وجد. إذا وُجدت مجموعتا مقاس (أحرف وأرقام) معًا، تُدرجان في `sizes` وتُضاف صفّان منفصلان في الجدول: "المقاسات بالأحرف" و"المقاسات بالأرقام".
6) **SEO**: 8–12 كلمة/عبارة مرتبطة فعلياً بمواصفات المنتج.

#### ضمانات التنفيذ
- لا توجد أي بدائل محليّة: إن لم تُرجِع DeepSeek حقلاً فلن نولِّده محلياً في هذا الوضع.
- تم **إلغاء تقليم الاسم** (لا `slice(0,60)`): الاسم يمرّ كما أعادته DeepSeek.
- في الواجهة الإدارية، يتم عرض جدول الوصف فقط إن عاد من DeepSeek؛ وإلا نعرض الوصف النصّي من DeepSeek كما هو، بلا بناء جدول محلي.
- الألوان العامة لا تُستَخدم في هذا الوضع؛ تُقبل فقط أسماء الألوان الصريحة التي أعادتها DeepSeek.

#### مفاتيح/تجهيز
- `DEEPSEEK_API_KEY` (من Integrations > AI أو Secrets).
- اختيار الموديل عبر `DEEPSEEK_MODEL` (الافتراضي: `deepseek-chat`).

#### تأثيرات على التجربة
- الاسم لن يُقص بعد الآن، والوصف سيكون جدولاً منسقاً عندما يوفّره DeepSeek، والأسعار/الألوان/المقاسات تُملأ فقط إذا أعادتها DeepSeek وبحسب القواعد بالأعلى. عند وجود نوعي مقاسات (أحرف/أرقام) تظهر المجموعتان في الحقول والجدول. كما يتم تطبيع أحجام X المتكررة: XXL→2XL، XXXL→3XL … (حتى 6XL). الصور تُستخدم فقط لاستخراج لوحات ألوان استرشادية دون تغيير ناتج DeepSeek.

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

### Home (Mobile Web) — UI guarantees (Oct 2025)

- For You masonry: variable card heights follow the natural image height (no fixed aspect wrappers). Implementation uses CSS columns with `break-inside: avoid` and plain `<img class="w-full h-auto">`.
- Categories: unified 3-row horizontal scroller (no title card), each item `w-[96px]` with `68×68` circular image and text below, identical to `/j`.
- Header/tabs spacing: tabs bar sticks exactly under the header using `headerRef` measurement to eliminate any top gap.

Minimal snippet from `apps/mweb/src/pages/Home.vue`:

```vue
<section class="px-3 py-3" aria-label="من أجلك">
  <div class="columns-2 gap-1 [column-fill:_balance]">
    <div v-for="(p,i) in forYouShein" :key="'fy-'+i" class="mb-1 break-inside-avoid">
      <div class="w-full border border-gray-200 rounded bg-white overflow-hidden">
        <div class="relative w-full">
          <img :src="p.image" :alt="p.title" class="w-full h-auto object-cover block" />
        </div>
        <!-- meta/title/price ... -->
      </div>
    </div>
  </div>
</section>
```

Regression checklist:
- Ensure no `aspect-*` wrappers around For You images on Home.
- Confirm categories use the 3-row unified scroller and no title heading is rendered.
- Verify tabs bar `top` equals measured header height on scroll/resize.

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

## 🔁 VPS جديد / تبديل السيرفر بخطوة واحدة

إذا أردت تبديل الـ VPS (مع بقاء الدومين `jeeey.com` كما هو)، كل ما تحتاجه عادةً هو تحديث مفاتيح الوصول في أسرار Actions ثم الدفع إلى الفرع `main`.

### الخطوات المختصرة

1) حدّث أسرار/متغيّرات Actions في المستودع (Repository Settings → Secrets and variables → Actions):
- **VPS_HOST / VPS_USER / VPS_PORT / SSH_PRIVATE_KEY**: بيانات الوصول إلى الـ VPS الجديد (المفتاح الخاص بصيغة OpenSSH، مستخدم بصلاحيات sudo، المنفذ غالباً 22)
- **DATABASE_URL / DIRECT_URL**: اتصال Postgres صالح (محلّي على الخادم أو قاعدة مُدارة)
- **JWT_SECRET / MAINTENANCE_SECRET**: مفاتيح التطبيق
- **ADMIN_EMAIL / ADMIN_PASSWORD**: لحساب الأدمن الذي تُجري به فحوصات ما بعد النشر
- (اختياري) `CERTBOT_EMAIL`, `CLOUDINARY_URL`, `STRIPE_*`, مفاتيح الذكاء الاصطناعي

2) DNS: أبقِ `jeeey.com`, `admin.jeeey.com`, `api.jeeey.com` موجّهة إلى الـ VPS الجديد (سجلات A/AAAA). لا حاجة لتعديل أسماء الدومين في القوالب.

3) أطلق النشر:
- إمّا ادفع إلى `main`
- أو من GitHub → Actions → "Deploy to VPS (SSH)" → Run workflow

4) ما الذي سيحدث تلقائياً:
- يبني المشروع ويتحقق مبكراً من TypeScript
- يؤرشف الكود وينسخه إلى الخادم
- يكتب **`.env.api`** و**`.env.web`** على الـ VPS من أسرارك (لا يولّد أسراراً عشوائية)
- يشغّل `infra/scripts/deploy.sh`: تثبيت/بناء، Prisma migrate deploy (إن توفّرت `DATABASE_URL/DIRECT_URL`)، تهيئة/تحديث وحدات systemd وتعيين `ExecStart/WorkingDirectory` بدقّة، وإعادة تشغيل الخدمات
- يثبت/يحدّث إعداد Nginx لـ `jeeey.com` ويعيد تحميله
- يجري فحوصات دخانية: صحة API محلياً، بدء admin/web، صفحة `/register` عامّة، تسجيل دخول أدمن، CRUD إداري، فحوص HTTPS خارجية

### تحقق سريع بعد النشر

- سجلات الخدمات:
```bash
journalctl -u ecom-api   -n 200 --no-pager
journalctl -u ecom-admin -n 200 --no-pager
journalctl -u ecom-web   -n 200 --no-pager
```
- صحة المنافذ محلياً على الخادم:
```bash
curl -sSI http://127.0.0.1:4000/health | head -n1   # API
curl -sSI http://127.0.0.1:3001/login | head -n1    # Admin
curl -sSI http://127.0.0.1:3000/ | head -n1         # Web
```

### ملاحظات مهمّة

- لا يقوم الـ Workflow بإنشاء Postgres. يجب أن يشير `DATABASE_URL` إلى قاعدة جاهزة (محلّية أو مُدارة). إن رغبت بإعداد قاعدة محلّية على الـ VPS الجديد يمكنك استخدام سكربت المساعدة (يدوياً):
  - `infra/deploy/vps_local_db_setup.sh` (يتطلب `DB_PASS`, وكذلك `JWT_SECRET`, `MAINTENANCE_SECRET`)
- خطوة SSL تُدار عبر سكربتات `infra/deploy/enable-https.sh`/`ensure-https.sh` عند تفعيل `CERTBOT_EMAIL` في الأسرار.
- يكفي عادةً عند تبديل الخادم: تحديث `VPS_HOST/VPS_USER/VPS_PORT/SSH_PRIVATE_KEY` وبقاء بقية الأسرار كما هي ثم دفع إلى `main`.

## 🔐 Admin Login: Final Flow

## 🛡️ Production hardening (Oct 2025) — Web/Admin (Next.js)

- Standalone server.js selection fixed in deploy script to prefer:
  1) `apps/<app>/.next/standalone/apps/<app>/server.js`
  2) fallback: `apps/<app>/.next/standalone/server.js`
  3) fallback: `next start` within `apps/<app>` (ensures node_modules exists via `pnpm install` at app level)

- Systemd units (created/updated by `infra/scripts/deploy.sh`):
  - `ecom-web.service` and `ecom-admin.service` write logs to `/var/log/ecom-web.{out,err}` and `/var/log/ecom-admin.{out,err}`.
  - WorkingDirectory is set to the directory of `server.js` for standalone, or the app folder for `next start`.

- Next.js images & sharp:
  - Avoid next/image optimizer for critical images on web; use plain `<img>` and set `images.unoptimized=true` to remove sharp dependency in standalone.
  - Added placeholders under `apps/web/public/images/*` to prevent invalid resource errors.

- Web/Admin node_modules presence on server:
  - Deploy script ensures `pnpm install` runs in `apps/web` and `apps/admin` so `node_modules/next/dist/bin/next` is always available if `next start` is used.

- NGINX/frontend 502 prevention:
  - Server-side health checks verify `127.0.0.1:3000/3001` are serving before concluding deploy.
  - If services are not yet ready, deploy restarts them via systemd and prints the last logs rather than failing silently.

- .env hygiene on VPS:
  - Removes any stray CI control lines (e.g., `DRONE_SSH_PREV_COMMAND_EXIT_CODE`) from `.env.api`.
  - Ensures `GOOGLE_REDIRECT_URI=https://api.jeeey.com/api/auth/google/callback` to avoid redirect mismatches.

### Commands (VPS quick ops)

```bash
# Logs
journalctl -u ecom-web   -n 200 --no-pager
journalctl -u ecom-admin -n 200 --no-pager
journalctl -u ecom-api   -n 200 --no-pager

# Health
curl -sSI http://127.0.0.1:3000/ | head -n1   # web
curl -sSI http://127.0.0.1:3001/login | head -n1   # admin

# Restart
systemctl restart ecom-web ecom-admin ecom-api
```

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

- Campaigns (تقسيم/جدولة/Popups):
  - `GET /api/admin/promotions/campaigns`
  - `POST /api/admin/promotions/campaigns`
  - `PUT /api/admin/promotions/campaigns/:id`
  - `DELETE /api/admin/promotions/campaigns/:id`
- Coupons (إنشاء/قائمة/قواعد/تحليلات) — موحّدة مع Prisma:
  - `GET /api/admin/coupons/list`
  - `POST /api/admin/coupons`
  - `GET /api/admin/coupons/:code`
  - `PATCH /api/admin/coupons/:code`
  - `PATCH /api/admin/coupons/:id/activate`
  - `GET /api/admin/coupons/:code/rules`
  - `PUT /api/admin/coupons/:code/rules`
  - `POST /api/admin/coupons/:code/test`
  - `GET /api/admin/coupons/analytics?code=CODE&days=30`

Frontend/mweb:
- `GET /api/me/coupons` — قائمة الكوبونات المؤهلة للمستخدم (audience + صلاحية).
- `POST /api/coupons/apply` — فحص وتطبيق الكوبون في الدفع (يفرض القيود والجداول).

### Audience semantics (الجمهور المستهدف) — Coupons

- Values stored canonically in rules at `Setting key=coupon_rules:CODE`: `audience.target` ∈ `all | users | new | guest | club`.
- UI mapping (admin radios → stored target):
  - الجميع → `all`
  - الزوار (غير المسجلين) → `guest`
  - المستخدمون الجدد → `new`
  - المستخدمون (مسجلون) → `users`
  - أعضاء JEEEY CLUB → `club` (مستقبلاً عند الحاجة)
- Accepted synonyms on server (backward-compatible): `new_user`, `new_users`, `first`, `first_order` → normalize to `new`. Also `everyone`, `*` → `all`, and `registered`, `existing` → `users`.
- New user definition (configurable):
  - User qualifies as "new" if within window OR has 0 orders.
  - Window days controlled by env `COUPON_NEW_USER_WINDOW_DAYS` (default: 30).
- Registered audience edge-case (users):
  - For audience `users`, eligibility additionally requires that the user's `createdAt` ≤ coupon `createdAt` (المستخدم مسجّل قبل إصدار الكوبون)، لضمان عدم ظهور كوبونات المسجلين لحديثي التسجيل.
- Feature flag (safe rollout):
  - `COUPONS_AUDIENCE_ENFORCE=1` (default): يفعّل فرض الأودينس الصارم في مسارات التطبيق.

### Admin UI behavior — Coupons/new

- التحرير عبر الرابط `.../coupons/new?code=CODE` يقوم بقراءة القواعد (Setting) وتطبيع `audience` تلقائياً إلى مفتاح الراديو الصحيح (everyone/new_user/users/guest/club) حتى لو خُزنت القيم بالمرادفات.
- عند الحفظ:
  - يتم تطبيع اختيار "المستخدمون الجدد" إلى القيمة المعيارية `new` قبل إرسالها لـ API.
  - يتم التحقق بصارمة (Zod) لهيكل القواعد مع رفض أي JSON غير صالح برسالة واضحة.

### API behavior — eligibility and apply

- `GET /api/me/coupons`:
  - يعيد الكوبونات الفعالة (isActive=true) ضمن الفترة الزمنية، مع تصفية audience وفق تعريف المستخدم (new/users/all/guest).
  - يستثني الكوبونات التي استخدمها المستخدم سابقاً (حسب `CouponUsage`).
  - يلتقط المرادفات المذكورة أعلاه للأودينس.
- `POST /api/coupons/apply` و`tRPC applyCoupon`:
  - يطبّقان نفس تحقق `audience` والجدولة، ويستخدمان معاملة ذرّية لمنع سباقات استخدام الكوبون (`currentUses` ≤ `maxUses`).
  - رسائل الرفض تشمل: `not_started`, `expired`, `disabled`, `out_of_schedule`, `audience_new_only`, `audience_registered_before_only`, `usage_limit`, إلخ.

### Operational checks (تشغيل آمن)

- إنشاء كوبون جديد للمستخدمين الجدد:
  1) من لوحة التحكم: حدّد "المستخدمون الجدد" واحفظ.
  2) تأكّد أن `GET /api/admin/coupons/CODE/rules` يحتوي: `"audience": { "target": "new" }`.
  3) بحساب mweb جديد (أو بدون طلبات/ضمن النافذة): `GET /api/me/coupons` يجب أن يُظهر الكوبون.
- إيقاف أي تضارب:
  - المسارات القديمة (marketing/coupons) تمت إزالتها. إن ظهر توثيق قديم، يُعتبر غير فعّال.
  - `GET /api/admin/coupons` يعيد 410 ويوجّه إلى `/api/admin/coupons/list`.

### Common pitfalls (أسباب عدم الظهور)

- الحساب ليس "جديداً": لدى المستخدم طلبات سابقة، أو تجاوز نافذة الأيام المحددة.
- `validFrom/validUntil` خارج النطاق الحالي، أو `isActive=false`.
- تم ضبط audience إلى `users` والمستخدم مسجّل بعد تاريخ إصدار الكوبون.
- JSON القواعد غير صالح ولم يُحفظ (تتحقق Zod الآن وتُرجِع سبب الرفض).

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

## 📞 WhatsApp (Cloud API) — الإعداد والاختبارات الحية

- المتغيرات المطلوبة (Secrets/Vars):
  - WHATSAPP_TOKEN (توكن الوصول من Meta Cloud)
  - WHATSAPP_PHONE_ID (معرّف رقم واتساب السحابي)
  - WHATSAPP_BUSINESS_ACCOUNT_ID (WABA)
  - FB_APP_ID و APP_SECRET (للاشتراك على مستوى التطبيق)
  - اختيارية للاختبار: WHATSAPP_TEST_PHONE (E.164 أو msisdn بدون +)
  - اختيارية: WHATSAPP_TEMPLATE (اسم القالب، الافتراضي: otp_verification_code)
  - التحقق من الويبهوك: WHATSAPP_VERIFY_TOKEN (يُخزن على الخادم)

- ربط الويبهوك (Webhook):
  1) نقطة التحقق: GET `https://api.jeeey.com/api/webhooks/whatsapp` تدعم `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`.
  2) ورْكفلو جاهز: `Bind WhatsApp Webhook` (يدويًا من Actions).
     - أدخل `verify_token` وسيقوم بما يلي:
       - حقن `WHATSAPP_VERIFY_TOKEN` في خدمة `ecom-api` وإعادة التشغيل.
       - الاشتراك على مستوى التطبيق: `/{APP_ID}/subscriptions` (يتطلب `APP_ID|APP_SECRET`).
       - تفعيل `/{WABA_ID}/subscribed_apps` (باستخدام `WHATSAPP_TOKEN`).
       - التحقق الآلي بأن GET verify يعيد 200.

- تنسيق الرقم:
  - الإرسال يستخدم msisdn (أرقام فقط بدون +). مثال: `+967739632892` يصبح `967739632892`.

- إرسال القالب (Strict):
  - REST إداري: `POST /api/admin/whatsapp/send`
    - الحقول: `phone`, `template`, `languageCode`, `bodyParams`, `buttonSubType`, `buttonIndex`, `buttonParam`, `strict`.
    - عند `strict: true` يفشل الطلب إذا كانت اللغة/القالب/الزر غير مطابقة (لا يسقط لنص).
    - قيود Meta: زر `url` يتطلب `buttonParam` ≤ 15 حرفًا. زر `quick_reply` بدون parameters.
  - تشخيص: `POST /api/admin/whatsapp/diagnose` يعيد `wa_id` و`status` من Contacts API.

- لُب الإرسال للمستخدم (OTP):
  - `/api/auth/otp/request` يرسل عبر واتساب، وإن ضبطت `OTP_SMS_WITH_WA=1` سيُرسل أيضًا SMS بالتوازي لضمان الوصول (تأكد من مفاتيح Twilio/Vonage).

- سجلات التسليم:
  - `NotificationLog` يخزّن `messageId` و`status`. عند ربط الويبهوك ستُحدّث الحالات إلى `DELIVERED/READ`.

- اختبارات حية في CI/CD:
  - `Full Live E2E`: خطوة “WhatsApp test (live)” تُرسل القالب باسم/لغة صحيحين وتتحقق من `messageId`، وتتحرى `DELIVERED/READ` إذا الويبهوك مفعّل.
  - `Deploy to VPS (SSH)`: فعِّل سر `WHATSAPP_TEST_PHONE` لتعمل خطوة “WhatsApp live smoke (strict)” تلقائيًا بعد النشر.

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

## 📞 WhatsApp OTP — إعداد مضمون وخالٍ من الأخطاء

- الإعداد (Secrets/Vars):
  - WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_BUSINESS_ACCOUNT_ID
  - WHATSAPP_TEMPLATE (الافتراضي: otp_login_code), WHATSAPP_LANGUAGE (الافتراضي: ar)
  - DEFAULT_COUNTRY_CODE (مثال: +967) لضبط تحويل الأرقام المحلية إلى E.164
  - WA_OTP_STRICT=1 لتعطيل سقوط النص إذا فشل القالب
  - OTP_SMS_WITH_WA=1 لإرسال SMS بالتوازي عند نجاح واتساب (اختياري)

- قواعد الرقم (بدون تكرار كود الدولة):
  - الواجهة (mweb) ترسل `phone` على شكل E.164 مرة واحدة:
    - إذا أدخل المستخدم محلياً (مثل 777310606) مع اختيار +967: تحوَّل إلى `967777310606` وتُرسل كـ `+967777310606`.
    - إذا كان الرقم يبدأ بمقدمة الدولة أصلاً (967...): يُضاف `+` فقط دون إلحاق المقدمة مرة ثانية.
  - الخادم (API) يطبق normalizeE164 ذكي:
    - إن كانت الأرقام تبدأ بمقدمة الدولة، يعيد `+<digits>` مباشرة (لا يضيف المقدمة مرة أخرى).
    - إن بدأت بصفر، يزيل الأصفار ويضيف المقدمة مرة واحدة فقط.

- الإرسال:
  - نقطة المستخدم: `POST /api/auth/otp/request` { phone: "+9677...", channel: "whatsapp|sms|both" }
  - الخادم يفحص صلاحية جهة الاتصال عبر Contacts API ثم يرسل القالب `otp_login_code` (لغة ar) بمكوّنات تتطابق بالضبط مع تعريف WABA.
  - لا يحدث سقوط إلى نص إذا WA_OTP_STRICT=1 (موصى به).

- التحقق:
  - `POST /api/auth/otp/verify` { phone, code } يعيد كوكي/توكن جلسة للمستخدم. الموبايل يكتب كوكي `shop_auth_token` على الجذر والنطاق `api.` لتجنب مشاكل الطرف الثالث.

- سجلات ومتابعة التسليم:
  - جدول `NotificationLog` يخزن `messageId`/`status`. عند ربط Webhook، ستتحدّث الحالات إلى `SENT/DELIVERED/READ` تلقائياً.
  - تشخيص مباشر: `POST /api/admin/whatsapp/diagnose` يعيد حالة الوصول (valid/invalid) عبر Contacts API، مع محاولة بديلة لـ `phone_numbers` الخاصة بـ WABA.

- فحوص ما بعد النشر (CI):
  - خطوة “WhatsApp live smoke (strict)” تعمل إذا كان `WHATSAPP_TEST_PHONE` مضبوطاً، وتفشل النشر فقط عند وجود خطأ حقيقي في الإرسال.

- استكشاف أخطاء شائعة:
  - «تكرار كود الدولة» في صفحة التحقق: تم حلّه عبر `displayPhone`؛ لا يؤثر على الإرسال، فقط العرض. تأكد من تحديث mweb.
  - «accepted ولا تصل الرسالة»: فعِّل التشخيص؛ غالباً القالب/اللغة/المكوّنات لا تطابق تعريف WABA. استخدم `send-smart` أو صحّح اسم القالب واللغة إلى `otp_login_code` و`ar`.
  - «Unsupported (code 100 subcode 33)»: تحقّق من صلاحيات `phone_id`/`waba_id` والاشتراكات، واستخدم قائمة `phone_numbers` لاختيار معرف صحيح تلقائياً.

### OTP Verify & Complete Profile — تدفق مضمون بعد التحقق

- التحقق من الرمز:
  1) `POST /api/auth/otp/verify` { phone, code } يعيد `{ ok, token, newUser }`.
  2) العميل (mweb) يحفظ التوكن فوراً:
     - كوكي `shop_auth_token` (domain الجذر و`api.`)
     - localStorage: `shop_token`
     - sessionStorage (احتياطي مؤقت)
  3) يقرأ `/api/me` ثم يقرر الوجهة:
     - إن `newUser === true` أو الاسم ناقص → `/complete-profile?return=...`
     - غير ذلك → `/account`

- إكمال إنشاء الحساب:
  - `POST /api/me/complete` { fullName, password?, confirm? } مع رأس `Authorization: Bearer <token>`.
  - عند النجاح يعود `{ ok:true }` ويُحوِّل العميل إلى `/account`.

- سلوك المصادقة على الخادم (منع الدورات و401):
  - يتم تفضيل Authorization header على الكوكيز عند قراءة التوكن (لتجنب ظلّ كوكي قديم للتوكن الحديث).
  - `/api/me`: إذا تعذّر التحقق بالتوقيع لحظياً، يُفك شفرة الـ JWT من الهيدر كحلٍ مؤقت لتفادي دورة إعادة تسجيل الدخول.
  - `/api/me/complete`: يتحقق من الهيدر أولاً، وإن تعذّر، يفك الشفرة كحلٍ مؤقت لإتمام الإجراء بنجاح مباشرة بعد OTP.

- NGINX/CORS:
  - يسمح بالطرق: `GET, POST, PUT, PATCH, DELETE, OPTIONS` والرؤوس: `Content-Type, Authorization, X-Shop-Client` ويُعيد 204 للـ OPTIONS.

- استكشاف 401/405 بعد التحقق:
  - 401 على `/api/me/complete`: تأكد أن الطلب إلى `https://api.jeeey.com` وبرأس Authorization الحديث (من `/otp/verify`). تمت تهيئة الخادم لتفضيل الهيدر وحل تعارض الكوكي.
  - 405 على `/api/me/complete`: يعني أن الطلب وُجِّه إلى `m.jeeey.com` أو مسار ثابت؛ يجب أن يكون إلى `api.jeeey.com`.

## 📌 Nov 2025 — Auth (WhatsApp/Google), Android App Links, Meta Catalog

### Auth: WhatsApp OTP without email requirement
- JWT payload جعل `email` اختيارياً وأضاف `phone` (اختياري). المصادر:
  - `packages/api/src/utils/jwt.ts`
  - `packages/api/src/middleware/auth.ts`, `packages/api/src/trpc-setup.ts`, `packages/api/src/context.ts`
- مسار OTP verify يبقي بريد قاعدة البيانات بالنمط legacy:
  - `email = phone+<digits>@local` للحسابات الجديدة/القديمة عبر واتساب.
  - التوكن يُوقَّع بلا اشتراط `email` ويحتوي `{ userId, role, phone }`.
  - المصدر: `packages/api/src/routers/shop.ts` (POST `/api/auth/otp/verify`).
- السلوك:
  - المستخدمون بـ `...@local` يعملون فوراً؛ يتم تحديث `phone` عند الحاجة.
  - `newUser` يُحسب عبر متغير الوجود بدل الاعتماد على البريد.

### Auth: Google OAuth callback shim
- يدعم السيرفر كلا الشكلين ويحوّل تلقائياً:
  - `/auth/google/callback` → `/api/auth/google/callback`
  - التعديل في `packages/api/src/index.ts`.
  - ينصح بضبط Redirect URI في Google إلى: `https://api.jeeey.com/api/auth/google/callback`.

### Android App Links (assetlinks.json)
- mweb (ملف ثابت): `apps/mweb/public/.well-known/assetlinks.json`
- API (مسار ديناميكي): `GET /.well-known/assetlinks.json` من `packages/api/src/index.ts`
- المحتوى:
  - `package_name: com.jeeey.shopin`
  - `sha256_cert_fingerprints: ["40:44:5A:90:E0:A3:53:B0:B5:D5:F0:A7:E9:04:4B:EE:09:3A:23:32:8A:C6:65:42:2A:A1:BE:8E:A7:59:2B:21"]`
  - relations: `delegate_permission/common.handle_all_urls`, `delegate_permission/common.get_login_creds`

### Meta (Facebook) Catalog Sync — إصلاحات
- زر “مزامنة الكاتالوج الآن” يستدعي: `POST /api/admin/marketing/facebook/catalog/sync`.
- تنسيق الطلب إلى Graph API (items_batch):
  - `content-type: application/x-www-form-urlencoded`
  - الحقول العلوية في الجسم: `item_type=PRODUCT_ITEM`, `allow_upsert=true`, `requests=<JSON>`
  - كل عنصر في `requests`:
    - `method: "CREATE"`, `retailer_id`, `item_type: "PRODUCT_ITEM"`
    - `data`: `{ name, description, image_url, url, price, availability?, brand?, condition?, additional_image_urls?, google_product_category? }`
- الاعتماديات/المفاتيح:
  - يقرأ `FB_CATALOG_ID`, `FB_CATALOG_TOKEN` من env؛ وإلا من إعدادات DB: `integrations:meta:settings:mweb` ثم `web`.
- بناء العناصر:
  - يصدّر Variants عندما يوجد SKU: `retailer_id = variant.sku` (مع trim/lowercase).
  - عنصر المنتج الأساسي يُضاف فقط إذا لم يتصادم مع أي SKU تباين.
  - إزالة تكرارات `retailer_id` عالميًا وداخل كل دفعة (trim+lowercase).
- الملفات: `packages/api/src/services/fb_catalog.ts` (التشفير، dedup، mapping التباينات، مفاتيح الكاتالوج).
- التشغيل:
  - تأكد من `META_ALLOW_EXTERNAL=1` على خدمة الـ API وإعادة التشغيل لتجنّب `simulated: true`.
  - خطأ `item_type is required` مُعالج بإرسال الحقول كـ form-encoded مع `item_type` العلوي.
  - خطأ `Duplicate retailer_id` غالباً من بيانات مصدر مكررة (SKU مكرر)؛ الخدمة تزيل المكرر لكن يلزم تنظيف المصدر إن استمر.

### mweb recap بعد OTP
- بعد `verify`:
  - يكتب العميل التوكن إلى كوكي `shop_auth_token` (الجذر و`api.`) وإلى `localStorage.shop_token`.
  - `/api/me` يفضّل الهيدر ثم الكوكيز ثم `?t` لسيناريو عودة OAuth.
  - حفظ العنوان/الطلب/الكوبونات تعمل مباشرة كمستخدم مسجّل.

### 🧭 Navigation & UX Improvements (Nov 2025)

تم تحسين تجربة التنقل في متجر الويب (Mobile Web) لضمان سلاسة الانتقال بين المنتجات، خاصة عند الضغط على التوصيات:

1. **إصلاح البيانات القديمة (Stale Data Fix):**
   - تم تحويل المتغير `id` في `Product.vue` إلى خاصية محسوبة (`computed`) بدلاً من ثابت (`const`).
   - هذا يضمن تحديث جميع العمليات (إضافة للسلة، تتبع الأحداث، الكوبونات) فوراً عند تغيير الرابط، حتى لو أعاد Vue استخدام نفس المكون.

2. **فرض إعادة بناء الصفحة (Force Re-render):**
   - تم إضافة `:key="$route.fullPath"` إلى `router-view` في `App.vue`.
   - هذا يجبر المتصفح على هدم وبناء صفحة المنتج من الصفر عند الانتقال لمنتج جديد، مما يضمن "بداية نظيفة" (Fresh Start) لكل زيارة.

3. **تحسين التمرير (Scroll Behavior):**
   - تم إزالة دوال الحفظ والاستعادة اليدوية (`restorePdpCache`) التي كانت تسبب مشاكل في التمرير.
   - الاعتماد الكامل الآن على `vue-router` لضمان:
     - التمرير لأعلى الصفحة عند زيارة منتج جديد.
     - الحفاظ على مكان التمرير عند الضغط على زر "الرجوع" (Back).

## 🛡️ System Stability & Critical Fixes (Nov 2025)

This section documents critical fixes applied to ensure data integrity, correct billing, and consistent user experience across the platform.

### 1. Order Variant Image Integrity
**Problem:** Order details were not displaying the specific variant image (e.g., Red Shirt) selected by the user, defaulting to the main product image.
**Fix:**
- **API (`packages/api/src/routers/shop.ts`):** The image enrichment logic in `POST /orders` was refactored to run unconditionally for all order creation methods. It now correctly populates `OrderItemMeta.attributes.image` by looking up the `ProductColor` gallery based on the selected color.
- **Result:** Order history and admin panels now consistently show the exact variant image purchased.

### 2. Shipping Cost Validation & Display
**Problem:**
1.  **Backend:** The API accepted client-side shipping costs without validation.
2.  **Frontend (Admin):** The Admin Panel displayed the base shipping cost (e.g., 800) even for free shipping orders (0 cost) due to a falsy check bug (`val || 800`).
**Fix:**
- **Backend (`shop.ts`):** Added server-side re-calculation logic. The API now fetches the `DeliveryRate` and enforces the `freeOverSubtotal` rule. If the subtotal exceeds the threshold, shipping is forced to `0`.
- **Frontend (`apps/admin/src/app/orders/[id]/page.tsx`):** Updated the display logic to use nullish coalescing (`??`) instead of logical OR (`||`). This ensures that a shipping cost of `0` is treated as a valid value and displayed correctly, rather than falling back to the default price.

### 3. Cart Variant Merging
**Problem:** Adding different variants of the same product (e.g., Red and Blue) to the cart resulted in them being merged into a single line item with summed quantities, losing the distinction.
**Fix:**
- **API (`shop.ts` / `cart.ts`):** Updated the `addToCart` logic to compare `attributes` (JSONB) in addition to `productId`.
- **Logic:** `findFirst({ where: { productId, attributes: { equals: newAttributes } } })`.
- **Result:** Distinct variants now appear as separate line items in the cart, preserving their individual attributes.

### 4. Checkout Shipping Auto-Selection
**Problem:** In the `mweb` checkout, if only one shipping method was available, the user had to manually select it, causing friction.
**Fix:**
- **Frontend (`apps/mweb/src/pages/Checkout.vue`):** Added a Vue `watch` effect on the `shippingOptions` array.
- **Logic:** If `shippingOptions.length === 1` and no option is selected, the system automatically selects the available method.

  - `Full Live E2E`: خطوة “WhatsApp test (live)” تُرسل القالب باسم/لغة صحيحين وتتحقق من `messageId`، وتتحرى `DELIVERED/READ` إذا الويبهوك مفعّل.
  - `Deploy to VPS (SSH)`: فعِّل سر `WHATSAPP_TEST_PHONE` لتعمل خطوة “WhatsApp live smoke (strict)” تلقائيًا بعد النشر.

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

## 📞 WhatsApp OTP — إعداد مضمون وخالٍ من الأخطاء

- الإعداد (Secrets/Vars):
  - WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_BUSINESS_ACCOUNT_ID
  - WHATSAPP_TEMPLATE (الافتراضي: otp_login_code), WHATSAPP_LANGUAGE (الافتراضي: ar)
  - DEFAULT_COUNTRY_CODE (مثال: +967) لضبط تحويل الأرقام المحلية إلى E.164
  - WA_OTP_STRICT=1 لتعطيل سقوط النص إذا فشل القالب
  - OTP_SMS_WITH_WA=1 لإرسال SMS بالتوازي عند نجاح واتساب (اختياري)

- قواعد الرقم (بدون تكرار كود الدولة):
  - الواجهة (mweb) ترسل `phone` على شكل E.164 مرة واحدة:
    - إذا أدخل المستخدم محلياً (مثل 777310606) مع اختيار +967: تحوَّل إلى `967777310606` وتُرسل كـ `+967777310606`.
    - إذا كان الرقم يبدأ بمقدمة الدولة أصلاً (967...): يُضاف `+` فقط دون إلحاق المقدمة مرة ثانية.
  - الخادم (API) يطبق normalizeE164 ذكي:
    - إن كانت الأرقام تبدأ بمقدمة الدولة، يعيد `+<digits>` مباشرة (لا يضيف المقدمة مرة أخرى).
    - إن بدأت بصفر، يزيل الأصفار ويضيف المقدمة مرة واحدة فقط.

- الإرسال:
  - نقطة المستخدم: `POST /api/auth/otp/request` { phone: "+9677...", channel: "whatsapp|sms|both" }
  - الخادم يفحص صلاحية جهة الاتصال عبر Contacts API ثم يرسل القالب `otp_login_code` (لغة ar) بمكوّنات تتطابق بالضبط مع تعريف WABA.
  - لا يحدث سقوط إلى نص إذا WA_OTP_STRICT=1 (موصى به).

- التحقق:
  - `POST /api/auth/otp/verify` { phone, code } يعيد كوكي/توكن جلسة للمستخدم. الموبايل يكتب كوكي `shop_auth_token` على الجذر والنطاق `api.` لتجنب مشاكل الطرف الثالث.

- سجلات ومتابعة التسليم:
  - جدول `NotificationLog` يخزن `messageId`/`status`. عند ربط Webhook، ستتحدّث الحالات إلى `SENT/DELIVERED/READ` تلقائياً.
  - تشخيص مباشر: `POST /api/admin/whatsapp/diagnose` يعيد حالة الوصول (valid/invalid) عبر Contacts API، مع محاولة بديلة لـ `phone_numbers` الخاصة بـ WABA.

- فحوص ما بعد النشر (CI):
  - خطوة “WhatsApp live smoke (strict)” تعمل إذا كان `WHATSAPP_TEST_PHONE` مضبوطاً، وتفشل النشر فقط عند وجود خطأ حقيقي في الإرسال.

- استكشاف أخطاء شائعة:
  - «تكرار كود الدولة» في صفحة التحقق: تم حلّه عبر `displayPhone`؛ لا يؤثر على الإرسال، فقط العرض. تأكد من تحديث mweb.
  - «accepted ولا تصل الرسالة»: فعِّل التشخيص؛ غالباً القالب/اللغة/المكوّنات لا تطابق تعريف WABA. استخدم `send-smart` أو صحّح اسم القالب واللغة إلى `otp_login_code` و`ar`.
  - «Unsupported (code 100 subcode 33)»: تحقّق من صلاحيات `phone_id`/`waba_id` والاشتراكات، واستخدم قائمة `phone_numbers` لاختيار معرف صحيح تلقائياً.

### OTP Verify & Complete Profile — تدفق مضمون بعد التحقق

- التحقق من الرمز:
  1) `POST /api/auth/otp/verify` { phone, code } يعيد `{ ok, token, newUser }`.
  2) العميل (mweb) يحفظ التوكن فوراً:
     - كوكي `shop_auth_token` (domain الجذر و`api.`)
     - localStorage: `shop_token`
     - sessionStorage (احتياطي مؤقت)
  3) يقرأ `/api/me` ثم يقرر الوجهة:
     - إن `newUser === true` أو الاسم ناقص → `/complete-profile?return=...`
     - غير ذلك → `/account`

- إكمال إنشاء الحساب:
  - `POST /api/me/complete` { fullName, password?, confirm? } مع رأس `Authorization: Bearer <token>`.
  - عند النجاح يعود `{ ok:true }` ويُحوِّل العميل إلى `/account`.

- سلوك المصادقة على الخادم (منع الدورات و401):
  - يتم تفضيل Authorization header على الكوكيز عند قراءة التوكن (لتجنب ظلّ كوكي قديم للتوكن الحديث).
  - `/api/me`: إذا تعذّر التحقق بالتوقيع لحظياً، يُفك شفرة الـ JWT من الهيدر كحلٍ مؤقت لتفادي دورة إعادة تسجيل الدخول.
  - `/api/me/complete`: يتحقق من الهيدر أولاً، وإن تعذّر، يفك الشفرة كحلٍ مؤقت لإتمام الإجراء بنجاح مباشرة بعد OTP.

- NGINX/CORS:
  - يسمح بالطرق: `GET, POST, PUT, PATCH, DELETE, OPTIONS` والرؤوس: `Content-Type, Authorization, X-Shop-Client` ويُعيد 204 للـ OPTIONS.

- استكشاف 401/405 بعد التحقق:
  - 401 على `/api/me/complete`: تأكد أن الطلب إلى `https://api.jeeey.com` وبرأس Authorization الحديث (من `/otp/verify`). تمت تهيئة الخادم لتفضيل الهيدر وحل تعارض الكوكي.
  - 405 على `/api/me/complete`: يعني أن الطلب وُجِّه إلى `m.jeeey.com` أو مسار ثابت؛ يجب أن يكون إلى `api.jeeey.com`.

## 📌 Nov 2025 — Auth (WhatsApp/Google), Android App Links, Meta Catalog

### Auth: WhatsApp OTP without email requirement
- JWT payload جعل `email` اختيارياً وأضاف `phone` (اختياري). المصادر:
  - `packages/api/src/utils/jwt.ts`
  - `packages/api/src/middleware/auth.ts`, `packages/api/src/trpc-setup.ts`, `packages/api/src/context.ts`
- مسار OTP verify يبقي بريد قاعدة البيانات بالنمط legacy:
  - `email = phone+<digits>@local` للحسابات الجديدة/القديمة عبر واتساب.
  - التوكن يُوقَّع بلا اشتراط `email` ويحتوي `{ userId, role, phone }`.
  - المصدر: `packages/api/src/routers/shop.ts` (POST `/api/auth/otp/verify`).
- السلوك:
  - المستخدمون بـ `...@local` يعملون فوراً؛ يتم تحديث `phone` عند الحاجة.
  - `newUser` يُحسب عبر متغير الوجود بدل الاعتماد على البريد.

### Auth: Google OAuth callback shim
- يدعم السيرفر كلا الشكلين ويحوّل تلقائياً:
  - `/auth/google/callback` → `/api/auth/google/callback`
  - التعديل في `packages/api/src/index.ts`.
  - ينصح بضبط Redirect URI في Google إلى: `https://api.jeeey.com/api/auth/google/callback`.

### Android App Links (assetlinks.json)
- mweb (ملف ثابت): `apps/mweb/public/.well-known/assetlinks.json`
- API (مسار ديناميكي): `GET /.well-known/assetlinks.json` من `packages/api/src/index.ts`
- المحتوى:
  - `package_name: com.jeeey.shopin`
  - `sha256_cert_fingerprints: ["40:44:5A:90:E0:A3:53:B0:B5:D5:F0:A7:E9:04:4B:EE:09:3A:23:32:8A:C6:65:42:2A:A1:BE:8E:A7:59:2B:21"]`
  - relations: `delegate_permission/common.handle_all_urls`, `delegate_permission/common.get_login_creds`

### Meta (Facebook) Catalog Sync — إصلاحات
- زر “مزامنة الكاتالوج الآن” يستدعي: `POST /api/admin/marketing/facebook/catalog/sync`.
- تنسيق الطلب إلى Graph API (items_batch):
  - `content-type: application/x-www-form-urlencoded`
  - الحقول العلوية في الجسم: `item_type=PRODUCT_ITEM`, `allow_upsert=true`, `requests=<JSON>`
  - كل عنصر في `requests`:
    - `method: "CREATE"`, `retailer_id`, `item_type: "PRODUCT_ITEM"`
    - `data`: `{ name, description, image_url, url, price, availability?, brand?, condition?, additional_image_urls?, google_product_category? }`
- الاعتماديات/المفاتيح:
  - يقرأ `FB_CATALOG_ID`, `FB_CATALOG_TOKEN` من env؛ وإلا من إعدادات DB: `integrations:meta:settings:mweb` ثم `web`.
- بناء العناصر:
  - يصدّر Variants عندما يوجد SKU: `retailer_id = variant.sku` (مع trim/lowercase).
  - عنصر المنتج الأساسي يُضاف فقط إذا لم يتصادم مع أي SKU تباين.
  - إزالة تكرارات `retailer_id` عالميًا وداخل كل دفعة (trim+lowercase).
- الملفات: `packages/api/src/services/fb_catalog.ts` (التشفير، dedup، mapping التباينات، مفاتيح الكاتالوج).
- التشغيل:
  - تأكد من `META_ALLOW_EXTERNAL=1` على خدمة الـ API وإعادة التشغيل لتجنّب `simulated: true`.
  - خطأ `item_type is required` مُعالج بإرسال الحقول كـ form-encoded مع `item_type` العلوي.
  - خطأ `Duplicate retailer_id` غالباً من بيانات مصدر مكررة (SKU مكرر)؛ الخدمة تزيل المكرر لكن يلزم تنظيف المصدر إن استمر.

### mweb recap بعد OTP
- بعد `verify`:
  - يكتب العميل التوكن إلى كوكي `shop_auth_token` (الجذر و`api.`) وإلى `localStorage.shop_token`.
  - `/api/me` يفضّل الهيدر ثم الكوكيز ثم `?t` لسيناريو عودة OAuth.
  - حفظ العنوان/الطلب/الكوبونات تعمل مباشرة كمستخدم مسجّل.

### 🧭 Navigation & UX Improvements (Nov 2025)

تم تحسين تجربة التنقل في متجر الويب (Mobile Web) لضمان سلاسة الانتقال بين المنتجات، خاصة عند الضغط على التوصيات:

1.  **إصلاح البيانات القديمة (Stale Data Fix):**
    - تم تحويل المتغير `id` في `Product.vue` إلى خاصية محسوبة (`computed`) بدلاً من ثابت (`const`).
    - هذا يضمن تحديث جميع العمليات (إضافة للسلة، تتبع الأحداث، الكوبونات) فوراً عند تغيير الرابط، حتى لو أعاد Vue استخدام نفس المكون.

2.  **فرض إعادة بناء الصفحة (Force Re-render):**
    - تم إضافة `:key="$route.fullPath"` إلى `router-view` في `App.vue`.
    - هذا يجبر المتصفح على هدم وبناء صفحة المنتج من الصفر عند الانتقال لمنتج جديد، مما يضمن "بداية نظيفة" (Fresh Start) لكل زيارة.

3.  **تحسين التمرير (Scroll Behavior):**
    - تم إزالة دوال الحفظ والاستعادة اليدوية (`restorePdpCache`) التي كانت تسبب مشاكل في التمرير.
    - الاعتماد الكامل الآن على `vue-router` لضمان:
        - التمرير لأعلى الصفحة عند زيارة منتج جديد.
        - الحفاظ على مكان التمرير عند الضغط على زر "الرجوع" (Back).

## 🛡️ System Stability & Critical Fixes (Nov 2025)

This section documents critical fixes applied to ensure data integrity, correct billing, and consistent user experience across the platform.

### 1. Order Variant Image Integrity
**Problem:** Order details were not displaying the specific variant image (e.g., Red Shirt) selected by the user, defaulting to the main product image.
**Fix:**
- **API (`packages/api/src/routers/shop.ts`):** The image enrichment logic in `POST /orders` was refactored to run unconditionally for all order creation methods. It now correctly populates `OrderItemMeta.attributes.image` by looking up the `ProductColor` gallery based on the selected color.
- **Result:** Order history and admin panels now consistently show the exact variant image purchased.

### 2. Shipping Cost Validation & Display
**Problem:**
1.  **Backend:** The API accepted client-side shipping costs without validation.
2.  **Frontend (Admin):** The Admin Panel displayed the base shipping cost (e.g., 800) even for free shipping orders (0 cost) due to a falsy check bug (`val || 800`).
**Fix:**
- **Backend (`shop.ts`):** Added server-side re-calculation logic. The API now fetches the `DeliveryRate` and enforces the `freeOverSubtotal` rule. If the subtotal exceeds the threshold, shipping is forced to `0`.
- **Frontend (`apps/admin/src/app/orders/[id]/page.tsx`):** Updated the display logic to use nullish coalescing (`??`) instead of logical OR (`||`). This ensures that a shipping cost of `0` is treated as a valid value and displayed correctly, rather than falling back to the default price.

### 3. Cart Variant Merging
**Problem:** Adding different variants of the same product (e.g., Red and Blue) to the cart resulted in them being merged into a single line item with summed quantities, losing the distinction.
**Fix:**
- **API (`shop.ts` / `cart.ts`):** Updated the `addToCart` logic to compare `attributes` (JSONB) in addition to `productId`.
- **Logic:** `findFirst({ where: { productId, attributes: { equals: newAttributes } } })`.
- **Result:** Distinct variants now appear as separate line items in the cart, preserving their individual attributes.

### 4. Checkout Shipping Auto-Selection
**Problem:** In the `mweb` checkout, if only one shipping method was available, the user had to manually select it, causing friction.
**Fix:**
- **Frontend (`apps/mweb/src/pages/Checkout.vue`):** Added a Vue `watch` effect on the `shippingOptions` array.
- **Logic:** If `shippingOptions.length === 1` and no option is selected, the system automatically selects the available method.

  - `Full Live E2E`: خطوة “WhatsApp test (live)” تُرسل القالب باسم/لغة صحيحين وتتحقق من `messageId`، وتتحرى `DELIVERED/READ` إذا الويبهوك مفعّل.
  - `Deploy to VPS (SSH)`: فعِّل سر `WHATSAPP_TEST_PHONE` لتعمل خطوة “WhatsApp live smoke (strict)” تلقائيًا بعد النشر.

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

## 📞 WhatsApp OTP — إعداد مضمون وخالٍ من الأخطاء

- الإعداد (Secrets/Vars):
  - WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_BUSINESS_ACCOUNT_ID
  - WHATSAPP_TEMPLATE (الافتراضي: otp_login_code), WHATSAPP_LANGUAGE (الافتراضي: ar)
  - DEFAULT_COUNTRY_CODE (مثال: +967) لضبط تحويل الأرقام المحلية إلى E.164
  - WA_OTP_STRICT=1 لتعطيل سقوط النص إذا فشل القالب
  - OTP_SMS_WITH_WA=1 لإرسال SMS بالتوازي عند نجاح واتساب (اختياري)

- قواعد الرقم (بدون تكرار كود الدولة):
  - الواجهة (mweb) ترسل `phone` على شكل E.164 مرة واحدة:
    - إذا أدخل المستخدم محلياً (مثل 777310606) مع اختيار +967: تحوَّل إلى `967777310606` وتُرسل كـ `+967777310606`.
    - إذا كان الرقم يبدأ بمقدمة الدولة أصلاً (967...): يُضاف `+` فقط دون إلحاق المقدمة مرة ثانية.
  - الخادم (API) يطبق normalizeE164 ذكي:
    - إن كانت الأرقام تبدأ بمقدمة الدولة، يعيد `+<digits>` مباشرة (لا يضيف المقدمة مرة أخرى).
    - إن بدأت بصفر، يزيل الأصفار ويضيف المقدمة مرة واحدة فقط.

- الإرسال:
  - نقطة المستخدم: `POST /api/auth/otp/request` { phone: "+9677...", channel: "whatsapp|sms|both" }
  - الخادم يفحص صلاحية جهة الاتصال عبر Contacts API ثم يرسل القالب `otp_login_code` (لغة ar) بمكوّنات تتطابق بالضبط مع تعريف WABA.
  - لا يحدث سقوط إلى نص إذا WA_OTP_STRICT=1 (موصى به).

- التحقق:
  - `POST /api/auth/otp/verify` { phone, code } يعيد كوكي/توكن جلسة للمستخدم. الموبايل يكتب كوكي `shop_auth_token` على الجذر والنطاق `api.` لتجنب مشاكل الطرف الثالث.

- سجلات ومتابعة التسليم:
  - جدول `NotificationLog` يخزن `messageId`/`status`. عند ربط Webhook، ستتحدّث الحالات إلى `SENT/DELIVERED/READ` تلقائياً.
  - تشخيص مباشر: `POST /api/admin/whatsapp/diagnose` يعيد حالة الوصول (valid/invalid) عبر Contacts API، مع محاولة بديلة لـ `phone_numbers` الخاصة بـ WABA.

- فحوص ما بعد النشر (CI):
  - خطوة “WhatsApp live smoke (strict)” تعمل إذا كان `WHATSAPP_TEST_PHONE` مضبوطاً، وتفشل النشر فقط عند وجود خطأ حقيقي في الإرسال.

- استكشاف أخطاء شائعة:
  - «تكرار كود الدولة» في صفحة التحقق: تم حلّه عبر `displayPhone`؛ لا يؤثر على الإرسال، فقط العرض. تأكد من تحديث mweb.
  - «accepted ولا تصل الرسالة»: فعِّل التشخيص؛ غالباً القالب/اللغة/المكوّنات لا تطابق تعريف WABA. استخدم `send-smart` أو صحّح اسم القالب واللغة إلى `otp_login_code` و`ar`.
  - «Unsupported (code 100 subcode 33)»: تحقّق من صلاحيات `phone_id`/`waba_id` والاشتراكات، واستخدم قائمة `phone_numbers` لاختيار معرف صحيح تلقائياً.

### OTP Verify & Complete Profile — تدفق مضمون بعد التحقق

- التحقق من الرمز:
  1) `POST /api/auth/otp/verify` { phone, code } يعيد `{ ok, token, newUser }`.
  2) العميل (mweb) يحفظ التوكن فوراً:
     - كوكي `shop_auth_token` (domain الجذر و`api.`)
     - localStorage: `shop_token`
     - sessionStorage (احتياطي مؤقت)
  3) يقرأ `/api/me` ثم يقرر الوجهة:
     - إن `newUser === true` أو الاسم ناقص → `/complete-profile?return=...`
     - غير ذلك → `/account`

- إكمال إنشاء الحساب:
  - `POST /api/me/complete` { fullName, password?, confirm? } مع رأس `Authorization: Bearer <token>`.
  - عند النجاح يعود `{ ok:true }` ويُحوِّل العميل إلى `/account`.

- سلوك المصادقة على الخادم (منع الدورات و401):
  - يتم تفضيل Authorization header على الكوكيز عند قراءة التوكن (لتجنب ظلّ كوكي قديم للتوكن الحديث).
  - `/api/me`: إذا تعذّر التحقق بالتوقيع لحظياً، يُفك شفرة الـ JWT من الهيدر كحلٍ مؤقت لتفادي دورة إعادة تسجيل الدخول.
  - `/api/me/complete`: يتحقق من الهيدر أولاً، وإن تعذّر، يفك الشفرة كحلٍ مؤقت لإتمام الإجراء بنجاح مباشرة بعد OTP.

- NGINX/CORS:
  - يسمح بالطرق: `GET, POST, PUT, PATCH, DELETE, OPTIONS` والرؤوس: `Content-Type, Authorization, X-Shop-Client` ويُعيد 204 للـ OPTIONS.

- استكشاف 401/405 بعد التحقق:
  - 401 على `/api/me/complete`: تأكد أن الطلب إلى `https://api.jeeey.com` وبرأس Authorization الحديث (من `/otp/verify`). تمت تهيئة الخادم لتفضيل الهيدر وحل تعارض الكوكي.
  - 405 على `/api/me/complete`: يعني أن الطلب وُجِّه إلى `m.jeeey.com` أو مسار ثابت؛ يجب أن يكون إلى `api.jeeey.com`.

## 📌 Nov 2025 — Auth (WhatsApp/Google), Android App Links, Meta Catalog

### Auth: WhatsApp OTP without email requirement
- JWT payload جعل `email` اختيارياً وأضاف `phone` (اختياري). المصادر:
  - `packages/api/src/utils/jwt.ts`
  - `packages/api/src/middleware/auth.ts`, `packages/api/src/trpc-setup.ts`, `packages/api/src/context.ts`
- مسار OTP verify يبقي بريد قاعدة البيانات بالنمط legacy:
  - `email = phone+<digits>@local` للحسابات الجديدة/القديمة عبر واتساب.
  - التوكن يُوقَّع بلا اشتراط `email` ويحتوي `{ userId, role, phone }`.
  - المصدر: `packages/api/src/routers/shop.ts` (POST `/api/auth/otp/verify`).
- السلوك:
  - المستخدمون بـ `...@local` يعملون فوراً؛ يتم تحديث `phone` عند الحاجة.
  - `newUser` يُحسب عبر متغير الوجود بدل الاعتماد على البريد.

### Auth: Google OAuth callback shim
- يدعم السيرفر كلا الشكلين ويحوّل تلقائياً:
  - `/auth/google/callback` → `/api/auth/google/callback`
  - التعديل في `packages/api/src/index.ts`.
  - ينصح بضبط Redirect URI في Google إلى: `https://api.jeeey.com/api/auth/google/callback`.

### Android App Links (assetlinks.json)
- mweb (ملف ثابت): `apps/mweb/public/.well-known/assetlinks.json`
- API (مسار ديناميكي): `GET /.well-known/assetlinks.json` من `packages/api/src/index.ts`
- المحتوى:
  - `package_name: com.jeeey.shopin`
  - `sha256_cert_fingerprints: ["40:44:5A:90:E0:A3:53:B0:B5:D5:F0:A7:E9:04:4B:EE:09:3A:23:32:8A:C6:65:42:2A:A1:BE:8E:A7:59:2B:21"]`
  - relations: `delegate_permission/common.handle_all_urls`, `delegate_permission/common.get_login_creds`

### Meta (Facebook) Catalog Sync — إصلاحات
- زر “مزامنة الكاتالوج الآن” يستدعي: `POST /api/admin/marketing/facebook/catalog/sync`.
- تنسيق الطلب إلى Graph API (items_batch):
  - `content-type: application/x-www-form-urlencoded`
  - الحقول العلوية في الجسم: `item_type=PRODUCT_ITEM`, `allow_upsert=true`, `requests=<JSON>`
  - كل عنصر في `requests`:
    - `method: "CREATE"`, `retailer_id`, `item_type: "PRODUCT_ITEM"`
    - `data`: `{ name, description, image_url, url, price, availability?, brand?, condition?, additional_image_urls?, google_product_category? }`
- الاعتماديات/المفاتيح:
  - يقرأ `FB_CATALOG_ID`, `FB_CATALOG_TOKEN` من env؛ وإلا من إعدادات DB: `integrations:meta:settings:mweb` ثم `web`.
- بناء العناصر:
  - يصدّر Variants عندما يوجد SKU: `retailer_id = variant.sku` (مع trim/lowercase).
  - عنصر المنتج الأساسي يُضاف فقط إذا لم يتصادم مع أي SKU تباين.
  - إزالة تكرارات `retailer_id` عالميًا وداخل كل دفعة (trim+lowercase).
- الملفات: `packages/api/src/services/fb_catalog.ts` (التشفير، dedup، mapping التباينات، مفاتيح الكاتالوج).
- التشغيل:
  - تأكد من `META_ALLOW_EXTERNAL=1` على خدمة الـ API وإعادة التشغيل لتجنّب `simulated: true`.
  - خطأ `item_type is required` مُعالج بإرسال الحقول كـ form-encoded مع `item_type` العلوي.
  - خطأ `Duplicate retailer_id` غالباً من بيانات مصدر مكررة (SKU مكرر)؛ الخدمة تزيل المكرر لكن يلزم تنظيف المصدر إن استمر.

### mweb recap بعد OTP
- بعد `verify`:
  - يكتب العميل التوكن إلى كوكي `shop_auth_token` (الجذر و`api.`) وإلى `localStorage.shop_token`.
  - `/api/me` يفضّل الهيدر ثم الكوكيز ثم `?t` لسيناريو عودة OAuth.
  - حفظ العنوان/الطلب/الكوبونات تعمل مباشرة كمستخدم مسجّل.

### 🧭 Navigation & UX Improvements (Nov 2025)

تم تحسين تجربة التنقل في متجر الويب (Mobile Web) لضمان سلاسة الانتقال بين المنتجات، خاصة عند الضغط على التوصيات:

1.  **إصلاح البيانات القديمة (Stale Data Fix):**
    - تم تحويل المتغير `id` في `Product.vue` إلى خاصية محسوبة (`computed`) بدلاً من ثابت (`const`).
    - هذا يضمن تحديث جميع العمليات (إضافة للسلة، تتبع الأحداث، الكوبونات) فوراً عند تغيير الرابط، حتى لو أعاد Vue استخدام نفس المكون.

2.  **فرض إعادة بناء الصفحة (Force Re-render):**
    - تم إضافة `:key="$route.fullPath"` إلى `router-view` في `App.vue`.
    - هذا يجبر المتصفح على هدم وبناء صفحة المنتج من الصفر عند الانتقال لمنتج جديد، مما يضمن "بداية نظيفة" (Fresh Start) لكل زيارة.

3.  **تحسين التمرير (Scroll Behavior):**
    - تم إزالة دوال الحفظ والاستعادة اليدوية (`restorePdpCache`) التي كانت تسبب مشاكل في التمرير.
    - الاعتماد الكامل الآن على `vue-router` لضمان:
        - التمرير لأعلى الصفحة عند زيارة منتج جديد.
        - الحفاظ على مكان التمرير عند الضغط على زر "الرجوع" (Back).

## 🛡️ System Stability & Critical Fixes (Nov 2025)

This section documents critical fixes applied to ensure data integrity, correct billing, and consistent user experience across the platform.

### 1. Order Variant Image Integrity
**Problem:** Order details were not displaying the specific variant image (e.g., Red Shirt) selected by the user, defaulting to the main product image.
**Fix:**
- **API (`packages/api/src/routers/shop.ts`):** The image enrichment logic in `POST /orders` was refactored to run unconditionally for all order creation methods. It now correctly populates `OrderItemMeta.attributes.image` by looking up the `ProductColor` gallery based on the selected color.
- **Result:** Order history and admin panels now consistently show the exact variant image purchased.

### 2. Shipping Cost Validation & Display
**Problem:**
1.  **Backend:** The API accepted client-side shipping costs without validation.
2.  **Frontend (Admin):** The Admin Panel displayed the base shipping cost (e.g., 800) even for free shipping orders (0 cost) due to a falsy check bug (`val || 800`).
**Fix:**
- **Backend (`shop.ts`):** Added server-side re-calculation logic. The API now fetches the `DeliveryRate` and enforces the `freeOverSubtotal` rule. If the subtotal exceeds the threshold, shipping is forced to `0`.
- **Frontend (`apps/admin/src/app/orders/[id]/page.tsx`):** Updated the display logic to use nullish coalescing (`??`) instead of logical OR (`||`). This ensures that a shipping cost of `0` is treated as a valid value and displayed correctly, rather than falling back to the default price.

### 3. Cart Variant Merging
**Problem:** Adding different variants of the same product (e.g., Red and Blue) to the cart resulted in them being merged into a single line item with summed quantities, losing the distinction.
**Fix:**
- **API (`shop.ts` / `cart.ts`):** Updated the `addToCart` logic to compare `attributes` (JSONB) in addition to `productId`.
- **Logic:** `findFirst({ where: { productId, attributes: { equals: newAttributes } } })`.
- **Result:** Distinct variants now appear as separate line items in the cart, preserving their individual attributes.

### 4. Checkout Shipping Auto-Selection
**Problem:** In the `mweb` checkout, if only one shipping method was available, the user had to manually select it, causing friction.
**Fix:**
- **Frontend (`apps/mweb/src/pages/Checkout.vue`):** Added a Vue `watch` effect on the `shippingOptions` array.
- **Logic:** If `shippingOptions.length === 1` and no option is selected, the system automatically selects the available method.

  - `Full Live E2E`: خطوة “WhatsApp test (live)” تُرسل القالب باسم/لغة صحيحين وتتحقق من `messageId`، وتتحرى `DELIVERED/READ` إذا الويبهوك مفعّل.
  - `Deploy to VPS (SSH)`: فعِّل سر `WHATSAPP_TEST_PHONE` لتعمل خطوة “WhatsApp live smoke (strict)” تلقائيًا بعد النشر.

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

## 📞 WhatsApp OTP — إعداد مضمون وخالٍ من الأخطاء

- الإعداد (Secrets/Vars):
  - WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_BUSINESS_ACCOUNT_ID
  - WHATSAPP_TEMPLATE (الافتراضي: otp_login_code), WHATSAPP_LANGUAGE (الافتراضي: ar)
  - DEFAULT_COUNTRY_CODE (مثال: +967) لضبط تحويل الأرقام المحلية إلى E.164
  - WA_OTP_STRICT=1 لتعطيل سقوط النص إذا فشل القالب
  - OTP_SMS_WITH_WA=1 لإرسال SMS بالتوازي عند نجاح واتساب (اختياري)

- قواعد الرقم (بدون تكرار كود الدولة):
  - الواجهة (mweb) ترسل `phone` على شكل E.164 مرة واحدة:
    - إذا أدخل المستخدم محلياً (مثل 777310606) مع اختيار +967: تحوَّل إلى `967777310606` وتُرسل كـ `+967777310606`.
    - إذا كان الرقم يبدأ بمقدمة الدولة أصلاً (967...): يُضاف `+` فقط دون إلحاق المقدمة مرة ثانية.
  - الخادم (API) يطبق normalizeE164 ذكي:
    - إن كانت الأرقام تبدأ بمقدمة الدولة، يعيد `+<digits>` مباشرة (لا يضيف المقدمة مرة أخرى).
    - إن بدأت بصفر، يزيل الأصفار ويضيف المقدمة مرة واحدة فقط.

- الإرسال:
  - نقطة المستخدم: `POST /api/auth/otp/request` { phone: "+9677...", channel: "whatsapp|sms|both" }
  - الخادم يفحص صلاحية جهة الاتصال عبر Contacts API ثم يرسل القالب `otp_login_code` (لغة ar) بمكوّنات تتطابق بالضبط مع تعريف WABA.
  - لا يحدث سقوط إلى نص إذا WA_OTP_STRICT=1 (موصى به).

- التحقق:
  - `POST /api/auth/otp/verify` { phone, code } يعيد كوكي/توكن جلسة للمستخدم. الموبايل يكتب كوكي `shop_auth_token` على الجذر والنطاق `api.` لتجنب مشاكل الطرف الثالث.

- سجلات ومتابعة التسليم:
  - جدول `NotificationLog` يخزن `messageId`/`status`. عند ربط Webhook، ستتحدّث الحالات إلى `SENT/DELIVERED/READ` تلقائياً.
  - تشخيص مباشر: `POST /api/admin/whatsapp/diagnose` يعيد حالة الوصول (valid/invalid) عبر Contacts API، مع محاولة بديلة لـ `phone_numbers` الخاصة بـ WABA.

- فحوص ما بعد النشر (CI):
  - خطوة “WhatsApp live smoke (strict)” تعمل إذا كان `WHATSAPP_TEST_PHONE` مضبوطاً، وتفشل النشر فقط عند وجود خطأ حقيقي في الإرسال.

- استكشاف أخطاء شائعة:
  - «تكرار كود الدولة» في صفحة التحقق: تم حلّه عبر `displayPhone`؛ لا يؤثر على الإرسال، فقط العرض. تأكد من تحديث mweb.
  - «accepted ولا تصل الرسالة»: فعِّل التشخيص؛ غالباً القالب/اللغة/المكوّنات لا تطابق تعريف WABA. استخدم `send-smart` أو صحّح اسم القالب واللغة إلى `otp_login_code` و`ar`.
  - «Unsupported (code 100 subcode 33)»: تحقّق من صلاحيات `phone_id`/`waba_id` والاشتراكات، واستخدم قائمة `phone_numbers` لاختيار معرف صحيح تلقائياً.

### OTP Verify & Complete Profile — تدفق مضمون بعد التحقق

- التحقق من الرمز:
  1) `POST /api/auth/otp/verify` { phone, code } يعيد `{ ok, token, newUser }`.
  2) العميل (mweb) يحفظ التوكن فوراً:
     - كوكي `shop_auth_token` (domain الجذر و`api.`)
     - localStorage: `shop_token`
     - sessionStorage (احتياطي مؤقت)
  3) يقرأ `/api/me` ثم يقرر الوجهة:
     - إن `newUser === true` أو الاسم ناقص → `/complete-profile?return=...`
     - غير ذلك → `/account`

- إكمال إنشاء الحساب:
  - `POST /api/me/complete` { fullName, password?, confirm? } مع رأس `Authorization: Bearer <token>`.
  - عند النجاح يعود `{ ok:true }` ويُحوِّل العميل إلى `/account`.

- سلوك المصادقة على الخادم (منع الدورات و401):
  - يتم تفضيل Authorization header على الكوكيز عند قراءة التوكن (لتجنب ظلّ كوكي قديم للتوكن الحديث).
  - `/api/me`: إذا تعذّر التحقق بالتوقيع لحظياً، يُفك شفرة الـ JWT من الهيدر كحلٍ مؤقت لتفادي دورة إعادة تسجيل الدخول.
  - `/api/me/complete`: يتحقق من الهيدر أولاً، وإن تعذّر، يفك الشفرة كحلٍ مؤقت لإتمام الإجراء بنجاح مباشرة بعد OTP.

- NGINX/CORS:
  - يسمح بالطرق: `GET, POST, PUT, PATCH, DELETE, OPTIONS` والرؤوس: `Content-Type, Authorization, X-Shop-Client` ويُعيد 204 للـ OPTIONS.

- استكشاف 401/405 بعد التحقق:
  - 401 على `/api/me/complete`: تأكد أن الطلب إلى `https://api.jeeey.com` وبرأس Authorization الحديث (من `/otp/verify`). تمت تهيئة الخادم لتفضيل الهيدر وحل تعارض الكوكي.
  - 405 على `/api/me/complete`: يعني أن الطلب وُجِّه إلى `m.jeeey.com` أو مسار ثابت؛ يجب أن يكون إلى `api.jeeey.com`.

## 📌 Nov 2025 — Auth (WhatsApp/Google), Android App Links, Meta Catalog

### Auth: WhatsApp OTP without email requirement
- JWT payload جعل `email` اختيارياً وأضاف `phone` (اختياري). المصادر:
  - `packages/api/src/utils/jwt.ts`
  - `packages/api/src/middleware/auth.ts`, `packages/api/src/trpc-setup.ts`, `packages/api/src/context.ts`
- مسار OTP verify يبقي بريد قاعدة البيانات بالنمط legacy:
  - `email = phone+<digits>@local` للحسابات الجديدة/القديمة عبر واتساب.
  - التوكن يُوقَّع بلا اشتراط `email` ويحتوي `{ userId, role, phone }`.
  - المصدر: `packages/api/src/routers/shop.ts` (POST `/api/auth/otp/verify`).
- السلوك:
  - المستخدمون بـ `...@local` يعملون فوراً؛ يتم تحديث `phone` عند الحاجة.
  - `newUser` يُحسب عبر متغير الوجود بدل الاعتماد على البريد.

### Auth: Google OAuth callback shim
- يدعم السيرفر كلا الشكلين ويحوّل تلقائياً:
  - `/auth/google/callback` → `/api/auth/google/callback`
  - التعديل في `packages/api/src/index.ts`.
  - ينصح بضبط Redirect URI في Google إلى: `https://api.jeeey.com/api/auth/google/callback`.

### Android App Links (assetlinks.json)
- mweb (ملف ثابت): `apps/mweb/public/.well-known/assetlinks.json`
- API (مسار ديناميكي): `GET /.well-known/assetlinks.json` من `packages/api/src/index.ts`
- المحتوى:
  - `package_name: com.jeeey.shopin`
  - `sha256_cert_fingerprints: ["40:44:5A:90:E0:A3:53:B0:B5:D5:F0:A7:E9:04:4B:EE:09:3A:23:32:8A:C6:65:42:2A:A1:BE:8E:A7:59:2B:21"]`
  - relations: `delegate_permission/common.handle_all_urls`, `delegate_permission/common.get_login_creds`

### Meta (Facebook) Catalog Sync — إصلاحات
- زر “مزامنة الكاتالوج الآن” يستدعي: `POST /api/admin/marketing/facebook/catalog/sync`.
- تنسيق الطلب إلى Graph API (items_batch):
  - `content-type: application/x-www-form-urlencoded`
  - الحقول العلوية في الجسم: `item_type=PRODUCT_ITEM`, `allow_upsert=true`, `requests=<JSON>`
  - كل عنصر في `requests`:
    - `method: "CREATE"`, `retailer_id`, `item_type: "PRODUCT_ITEM"`
    - `data`: `{ name, description, image_url, url, price, availability?, brand?, condition?, additional_image_urls?, google_product_category? }`
- الاعتماديات/المفاتيح:
  - يقرأ `FB_CATALOG_ID`, `FB_CATALOG_TOKEN` من env؛ وإلا من إعدادات DB: `integrations:meta:settings:mweb` ثم `web`.
- بناء العناصر:
  - يصدّر Variants عندما يوجد SKU: `retailer_id = variant.sku` (مع trim/lowercase).
  - عنصر المنتج الأساسي يُضاف فقط إذا لم يتصادم مع أي SKU تباين.
  - إزالة تكرارات `retailer_id` عالميًا وداخل كل دفعة (trim+lowercase).
- الملفات: `packages/api/src/services/fb_catalog.ts` (التشفير، dedup، mapping التباينات، مفاتيح الكاتالوج).
- التشغيل:
  - تأكد من `META_ALLOW_EXTERNAL=1` على خدمة الـ API وإعادة التشغيل لتجنّب `simulated: true`.
  - خطأ `item_type is required` مُعالج بإرسال الحقول كـ form-encoded مع `item_type` العلوي.
  - خطأ `Duplicate retailer_id` غالباً من بيانات مصدر مكررة (SKU مكرر)؛ الخدمة تزيل المكرر لكن يلزم تنظيف المصدر إن استمر.

### mweb recap بعد OTP
- بعد `verify`:
  - يكتب العميل التوكن إلى كوكي `shop_auth_token` (الجذر و`api.`) وإلى `localStorage.shop_token`.
  - `/api/me` يفضّل الهيدر ثم الكوكيز ثم `?t` لسيناريو عودة OAuth.
  - حفظ العنوان/الطلب/الكوبونات تعمل مباشرة كمستخدم مسجّل.

### 🧭 Navigation & UX Improvements (Nov 2025)

تم تحسين تجربة التنقل في متجر الويب (Mobile Web) لضمان سلاسة الانتقال بين المنتجات، خاصة عند الضغط على التوصيات:

1.  **إصلاح البيانات القديمة (Stale Data Fix):**
    - تم تحويل المتغير `id` في `Product.vue` إلى خاصية محسوبة (`computed`) بدلاً من ثابت (`const`).
    - هذا يضمن تحديث جميع العمليات (إضافة للسلة، تتبع الأحداث، الكوبونات) فوراً عند تغيير الرابط، حتى لو أعاد Vue استخدام نفس المكون.

2.  **فرض إعادة بناء الصفحة (Force Re-render):**
    - تم إضافة `:key="$route.fullPath"` إلى `router-view` في `App.vue`.
    - هذا يجبر المتصفح على هدم وبناء صفحة المنتج من الصفر عند الانتقال لمنتج جديد، مما يضمن "بداية نظيفة" (Fresh Start) لكل زيارة.

3.  **تحسين التمرير (Scroll Behavior):**
    - تم إزالة دوال الحفظ والاستعادة اليدوية (`restorePdpCache`) التي كانت تسبب مشاكل في التمرير.
    - الاعتماد الكامل الآن على `vue-router` لضمان:
        - التمرير لأعلى الصفحة عند زيارة منتج جديد.
        - الحفاظ على مكان التمرير عند الضغط على زر "الرجوع" (Back).

## 🛡️ System Stability & Critical Fixes (Nov 2025)

This section documents critical fixes applied to ensure data integrity, correct billing, and consistent user experience across the platform.

### 1. Order Variant Image Integrity
**Problem:** Order details were not displaying the specific variant image (e.g., Red Shirt) selected by the user, defaulting to the main product image.
**Fix:**
- **API (`packages/api/src/routers/shop.ts`):** The image enrichment logic in `POST /orders` was refactored to run unconditionally for all order creation methods. It now correctly populates `OrderItemMeta.attributes.image` by looking up the `ProductColor` gallery based on the selected color.
- **Result:** Order history and admin panels now consistently show the exact variant image purchased.

### 2. Shipping Cost Validation & Display
**Problem:**
1.  **Backend:** The API accepted client-side shipping costs without validation.
2.  **Frontend (Admin):** The Admin Panel displayed the base shipping cost (e.g., 800) even for free shipping orders (0 cost) due to a falsy check bug (`val || 800`).
**Fix:**
- **Backend (`shop.ts`):** Added server-side re-calculation logic. The API now fetches the `DeliveryRate` and enforces the `freeOverSubtotal` rule. If the subtotal exceeds the threshold, shipping is forced to `0`.
- **Frontend (`apps/admin/src/app/orders/[id]/page.tsx`):** Updated the display logic to use nullish coalescing (`??`) instead of logical OR (`||`). This ensures that a shipping cost of `0` is treated as a valid value and displayed correctly, rather than falling back to the default price.

### 3. Cart Variant Merging
**Problem:** Adding different variants of the same product (e.g., Red and Blue) to the cart resulted in them being merged into a single line item with summed quantities, losing the distinction.
**Fix:**
- **API (`shop.ts` / `cart.ts`):** Updated the `addToCart` logic to compare `attributes` (JSONB) in addition to `productId`.
- **Logic:** `findFirst({ where: { productId, attributes: { equals: newAttributes } } })`.
- **Result:** Distinct variants now appear as separate line items in the cart, preserving their individual attributes.

### 4. Checkout Shipping Auto-Selection
**Problem:** In the `mweb` checkout, if only one shipping method was available, the user had to manually select it, causing friction.
**Fix:**
- **Frontend (`apps/mweb/src/pages/Checkout.vue`):** Added a Vue `watch` effect on the `shippingOptions` array.
- **Logic:** If `shippingOptions.length === 1` and no option is selected, the system automatically selects the available method.

  - `Full Live E2E`: خطوة “WhatsApp test (live)” تُرسل القالب باسم/لغة صحيحين وتتحقق من `messageId`، وتتحرى `DELIVERED/READ` إذا الويبهوك مفعّل.
  - `Deploy to VPS (SSH)`: فعِّل سر `WHATSAPP_TEST_PHONE` لتعمل خطوة “WhatsApp live smoke (strict)” تلقائيًا بعد النشر.

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

## 📞 WhatsApp OTP — إعداد مضمون وخالٍ من الأخطاء

- الإعداد (Secrets/Vars):
  - WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_BUSINESS_ACCOUNT_ID
  - WHATSAPP_TEMPLATE (الافتراضي: otp_login_code), WHATSAPP_LANGUAGE (الافتراضي: ar)
  - DEFAULT_COUNTRY_CODE (مثال: +967) لضبط تحويل الأرقام المحلية إلى E.164
  - WA_OTP_STRICT=1 لتعطيل سقوط النص إذا فشل القالب
  - OTP_SMS_WITH_WA=1 لإرسال SMS بالتوازي عند نجاح واتساب (اختياري)

- قواعد الرقم (بدون تكرار كود الدولة):
  - الواجهة (mweb) ترسل `phone` على شكل E.164 مرة واحدة:
    - إذا أدخل المستخدم محلياً (مثل 777310606) مع اختيار +967: تحوَّل إلى `967777310606` وتُرسل كـ `+967777310606`.
    - إذا كان الرقم يبدأ بمقدمة الدولة أصلاً (967...): يُضاف `+` فقط دون إلحاق المقدمة مرة ثانية.
  - الخادم (API) يطبق normalizeE164 ذكي:
    - إن كانت الأرقام تبدأ بمقدمة الدولة، يعيد `+<digits>` مباشرة (لا يضيف المقدمة مرة أخرى).
    - إن بدأت بصفر، يزيل الأصفار ويضيف المقدمة مرة واحدة فقط.

- الإرسال:
  - نقطة المستخدم: `POST /api/auth/otp/request` { phone: "+9677...", channel: "whatsapp|sms|both" }
  - الخادم يفحص صلاحية جهة الاتصال عبر Contacts API ثم يرسل القالب `otp_login_code` (لغة ar) بمكوّنات تتطابق بالضبط مع تعريف WABA.
  - لا يحدث سقوط إلى نص إذا WA_OTP_STRICT=1 (موصى به).

- التحقق:
  - `POST /api/auth/otp/verify` { phone, code } يعيد كوكي/توكن جلسة للمستخدم. الموبايل يكتب كوكي `shop_auth_token` على الجذر والنطاق `api.` لتجنب مشاكل الطرف الثالث.

- سجلات ومتابعة التسليم:
  - جدول `NotificationLog` يخزن `messageId`/`status`. عند ربط Webhook، ستتحدّث الحالات إلى `SENT/DELIVERED/READ` تلقائياً.
  - تشخيص مباشر: `POST /api/admin/whatsapp/diagnose` يعيد حالة الوصول (valid/invalid) عبر Contacts API، مع محاولة بديلة لـ `phone_numbers` الخاصة بـ WABA.

- فحوص ما بعد النشر (CI):
  - خطوة “WhatsApp live smoke (strict)” تعمل إذا كان `WHATSAPP_TEST_PHONE` مضبوطاً، وتفشل النشر فقط عند وجود خطأ حقيقي في الإرسال.

- استكشاف أخطاء شائعة:
  - «تكرار كود الدولة» في صفحة التحقق: تم حلّه عبر `displayPhone`؛ لا يؤثر على الإرسال، فقط العرض. تأكد من تحديث mweb.
  - «accepted ولا تصل الرسالة»: فعِّل التشخيص؛ غالباً القالب/اللغة/المكوّنات لا تطابق تعريف WABA. استخدم `send-smart` أو صحّح اسم القالب واللغة إلى `otp_login_code` و`ar`.
  - «Unsupported (code 100 subcode 33)»: تحقّق من صلاحيات `phone_id`/`waba_id` والاشتراكات، واستخدم قائمة `phone_numbers` لاختيار معرف صحيح تلقائياً.

### OTP Verify & Complete Profile — تدفق مضمون بعد التحقق

- التحقق من الرمز:
  1) `POST /api/auth/otp/verify` { phone, code } يعيد `{ ok, token, newUser }`.
  2) العميل (mweb) يحفظ التوكن فوراً:
     - كوكي `shop_auth_token` (domain الجذر و`api.`)
     - localStorage: `shop_token`
     - sessionStorage (احتياطي مؤقت)
  3) يقرأ `/api/me` ثم يقرر الوجهة:
     - إن `newUser === true` أو الاسم ناقص → `/complete-profile?return=...`
     - غير ذلك → `/account`

- إكمال إنشاء الحساب:
  - `POST /api/me/complete` { fullName, password?, confirm? } مع رأس `Authorization: Bearer <token>`.
  - عند النجاح يعود `{ ok:true }` ويُحوِّل العميل إلى `/account`.

- سلوك المصادقة على الخادم (منع الدورات و401):
  - يتم تفضيل Authorization header على الكوكيز عند قراءة التوكن (لتجنب ظلّ كوكي قديم للتوكن الحديث).
  - `/api/me`: إذا تعذّر التحقق بالتوقيع لحظياً، يُفك شفرة الـ JWT من الهيدر كحلٍ مؤقت لتفادي دورة إعادة تسجيل الدخول.
  - `/api/me/complete`: يتحقق من الهيدر أولاً، وإن تعذّر، يفك الشفرة كحلٍ مؤقت لإتمام الإجراء بنجاح مباشرة بعد OTP.

- NGINX/CORS:
  - يسمح بالطرق: `GET, POST, PUT, PATCH, DELETE, OPTIONS` والرؤوس: `Content-Type, Authorization, X-Shop-Client` ويُعيد 204 للـ OPTIONS.

- استكشاف 401/405 بعد التحقق:
  - 401 على `/api/me/complete`: تأكد أن الطلب إلى `https://api.jeeey.com` وبرأس Authorization الحديث (من `/otp/verify`). تمت تهيئة الخادم لتفضيل الهيدر وحل تعارض الكوكي.
  - 405 على `/api/me/complete`: يعني أن الطلب وُجِّه إلى `m.jeeey.com` أو مسار ثابت؛ يجب أن يكون إلى `api.jeeey.com`.

## 📌 Nov 2025 — Auth (WhatsApp/Google), Android App Links, Meta Catalog

### Auth: WhatsApp OTP without email requirement
- JWT payload جعل `email` اختيارياً وأضاف `phone` (اختياري). المصادر:
  - `packages/api/src/utils/jwt.ts`
  - `packages/api/src/middleware/auth.ts`, `packages/api/src/trpc-setup.ts`, `packages/api/src/context.ts`
- مسار OTP verify يبقي بريد قاعدة البيانات بالنمط legacy:
  - `email = phone+<digits>@local` للحسابات الجديدة/القديمة عبر واتساب.
  - التوكن يُوقَّع بلا اشتراط `email` ويحتوي `{ userId, role, phone }`.
  - المصدر: `packages/api/src/routers/shop.ts` (POST `/api/auth/otp/verify`).
- السلوك:
  - المستخدمون بـ `...@local` يعملون فوراً؛ يتم تحديث `phone` عند الحاجة.
  - `newUser` يُحسب عبر متغير الوجود بدل الاعتماد على البريد.

### Auth: Google OAuth callback shim
- يدعم السيرفر كلا الشكلين ويحوّل تلقائياً:
  - `/auth/google/callback` → `/api/auth/google/callback`
  - التعديل في `packages/api/src/index.ts`.
  - ينصح بضبط Redirect URI في Google إلى: `https://api.jeeey.com/api/auth/google/callback`.

### Android App Links (assetlinks.json)
- mweb (ملف ثابت): `apps/mweb/public/.well-known/assetlinks.json`
- API (مسار ديناميكي): `GET /.well-known/assetlinks.json` من `packages/api/src/index.ts`
- المحتوى:
  - `package_name: com.jeeey.shopin`
  - `sha256_cert_fingerprints: ["40:44:5A:90:E0:A3:53:B0:B5:D5:F0:A7:E9:04:4B:EE:09:3A:23:32:8A:C6:65:42:2A:A1:BE:8E:A7:59:2B:21"]`
  - relations: `delegate_permission/common.handle_all_urls`, `delegate_permission/common.get_login_creds`

### Meta (Facebook) Catalog Sync — إصلاحات
- زر “مزامنة الكاتالوج الآن” يستدعي: `POST /api/admin/marketing/facebook/catalog/sync`.
- تنسيق الطلب إلى Graph API (items_batch):
  - `content-type: application/x-www-form-urlencoded`
  - الحقول العلوية في الجسم: `item_type=PRODUCT_ITEM`, `allow_upsert=true`, `requests=<JSON>`
  - كل عنصر في `requests`:
    - `method: "CREATE"`, `retailer_id`, `item_type: "PRODUCT_ITEM"`
    - `data`: `{ name, description, image_url, url, price, availability?, brand?, condition?, additional_image_urls?, google_product_category? }`
- الاعتماديات/المفاتيح:
  - يقرأ `FB_CATALOG_ID`, `FB_CATALOG_TOKEN` من env؛ وإلا من إعدادات DB: `integrations:meta:settings:mweb` ثم `web`.
- بناء العناصر:
  - يصدّر Variants عندما يوجد SKU: `retailer_id = variant.sku` (مع trim/lowercase).
  - عنصر المنتج الأساسي يُضاف فقط إذا لم يتصادم مع أي SKU تباين.
  - إزالة تكرارات `retailer_id` عالميًا وداخل كل دفعة (trim+lowercase).
- الملفات: `packages/api/src/services/fb_catalog.ts` (التشفير، dedup، mapping التباينات، مفاتيح الكاتالوج).
- التشغيل:
  - تأكد من `META_ALLOW_EXTERNAL=1` على خدمة الـ API وإعادة التشغيل لتجنّب `simulated: true`.
  - خطأ `item_type is required` مُعالج بإرسال الحقول كـ form-encoded مع `item_type` العلوي.
  - خطأ `Duplicate retailer_id` غالباً من بيانات مصدر مكررة (SKU مكرر)؛ الخدمة تزيل المكرر لكن يلزم تنظيف المصدر إن استمر.

### mweb recap بعد OTP
- بعد `verify`:
  - يكتب العميل التوكن إلى كوكي `shop_auth_token` (الجذر و`api.`) وإلى `localStorage.shop_token`.
  - `/api/me` يفضّل الهيدر ثم الكوكيز ثم `?t` لسيناريو عودة OAuth.
  - حفظ العنوان/الطلب/الكوبونات تعمل مباشرة كمستخدم مسجّل.

### 🧭 Navigation & UX Improvements (Nov 2025)

تم تحسين تجربة التنقل في متجر الويب (Mobile Web) لضمان سلاسة الانتقال بين المنتجات، خاصة عند الضغط على التوصيات:

1.  **إصلاح البيانات القديمة (Stale Data Fix):**
    - تم تحويل المتغير `id` في `Product.vue` إلى خاصية محسوبة (`computed`) بدلاً من ثابت (`const`).
    - هذا يضمن تحديث جميع العمليات (إضافة للسلة، تتبع الأحداث، الكوبونات) فوراً عند تغيير الرابط، حتى لو أعاد Vue استخدام نفس المكون.

2.  **فرض إعادة بناء الصفحة (Force Re-render):**
    - تم إضافة `:key="$route.fullPath"` إلى `router-view` في `App.vue`.
    - هذا يجبر المتصفح على هدم وبناء صفحة المنتج من الصفر عند الانتقال لمنتج جديد، مما يضمن "بداية نظيفة" (Fresh Start) لكل زيارة.

3.  **تحسين التمرير (Scroll Behavior):**
    - تم إزالة دوال الحفظ والاستعادة اليدوية (`restorePdpCache`) التي كانت تسبب مشاكل في التمرير.
    - الاعتماد الكامل الآن على `vue-router` لضمان:
        - التمرير لأعلى الصفحة عند زيارة منتج جديد.
        - الحفاظ على مكان التمرير عند الضغط على زر "الرجوع" (Back).

## 🛡️ System Stability & Critical Fixes (Nov 2025)

This section documents critical fixes applied to ensure data integrity, correct billing, and consistent user experience across the platform.

### 1. Order Variant Image Integrity
**Problem:** Order details were not displaying the specific variant image (e.g., Red Shirt) selected by the user, defaulting to the main product image.
**Fix:**
- **API (`packages/api/src/routers/shop.ts`):** The image enrichment logic in `POST /orders` was refactored to run unconditionally for all order creation methods. It now correctly populates `OrderItemMeta.attributes.image` by looking up the `ProductColor` gallery based on the selected color.
- **Result:** Order history and admin panels now consistently show the exact variant image purchased.

### 2. Shipping Cost Validation & Display
**Problem:**
1.  **Backend:** The API accepted client-side shipping costs without validation.
2.  **Frontend (Admin):** The Admin Panel displayed the base shipping cost (e.g., 800) even for free shipping orders (0 cost) due to a falsy check bug (`val || 800`).
**Fix:**
- **Backend (`shop.ts`):** Added server-side re-calculation logic. The API now fetches the `DeliveryRate` and enforces the `freeOverSubtotal` rule. If the subtotal exceeds the threshold, shipping is forced to `0`.
- **Frontend (`apps/admin/src/app/orders/[id]/page.tsx`):** Updated the display logic to use nullish coalescing (`??`) instead of logical OR (`||`). This ensures that a shipping cost of `0` is treated as a valid value and displayed correctly, rather than falling back to the default price.

### 3. Cart Variant Merging
**Problem:** Adding different variants of the same product (e.g., Red and Blue) to the cart resulted in them being merged into a single line item with summed quantities, losing the distinction.
**Fix:**
- **API (`shop.ts` / `cart.ts`):** Updated the `addToCart` logic to compare `attributes` (JSONB) in addition to `productId`.
- **Logic:** `findFirst({ where: { productId, attributes: { equals: newAttributes } } })`.
- **Result:** Distinct variants now appear as separate line items in the cart, preserving their individual attributes.

### 4. Checkout Shipping Auto-Selection
**Problem:** In the `mweb` checkout, if only one shipping method was available, the user had to manually select it, causing friction.
**Fix:**
- **Frontend (`apps/mweb/src/pages/Checkout.vue`):** Added a Vue `watch` effect on the `shippingOptions` array.
- **Logic:** If `shippingOptions.length === 1` and no option is selected, the system automatically selects the available method.

### 5. References & Technical Notes
- **OrderItemMeta:** This table is the source of truth for snapshotting variant data (color, size, image) at the time of purchase.
- **DeliveryRate:** Free shipping rules are defined here (`freeOverSubtotal`). The API now strictly enforces these rules server-side.
- **Admin Display:** Always use `??` when displaying financial values to correctly handle `0` (free/discounted items).

### 6. Checkout Address Selection & Snapshot
**Problem:**
1.  Selecting a non-default address was ignored (FK violation).
2.  Order Details page (both Customer & Admin) was missing the recipient's Name and Phone because the `Address` table lacks these columns.
3.  **Admin Panel:** Empty address fields (e.g., no district) were being overridden by the default address's values due to incorrect fallback logic (`||`).
**Fix:**
- **API (`shop.ts` & `admin-rest.ts`):**
    1.  Updated `POST /orders` to **upsert** the selected address from `AddressBook` into the user's `Address` record.
    2.  Added logic to persist the full `shippingAddressSnapshot` (JSONB) to the `Order` table to preserve Name/Phone.
    3.  Updated `GET /orders/:id` (Customer) and `GET /api/admin/orders/:id` (Admin) to return this snapshot.
- **Frontend (`mweb` & `admin`):**
    1.  Updated Order Detail pages to prioritize displaying data from the snapshot.
    2.  **Admin Panel:** Switched from logical OR (`||`) to nullish coalescing (`??`) for address fields to respect empty strings in the snapshot.
- **Result:** The correct address is linked, and the recipient's full details (Name, Phone) are correctly displayed in both Customer and Admin panels, respecting empty fields.

### 7. Admin Address Display Fix
**Problem:** The Admin Panel was not displaying the "District" (Area) field in the order details address section, even when it was present in the snapshot.
**Fix:**
- **Frontend (`apps/admin/src/app/orders/[id]/page.tsx`):** Added the `area` field to the address display array.
- **Result:** The full address, including the district, is now correctly shown to administrators.

### 8. Mweb Address Area Selection Fix
**Problem:** In the "My Address" page, selecting a Governorate (which acts as a City in the user's data model) would sometimes fail to load the associated Areas. This was because the system was trying to resolve a specific "City ID" from the first city found, which filtered out areas linked to other city records sharing the same governorate name.
**Fix:**
- **Frontend (`apps/mweb/src/pages/Address.vue`):** Updated the `selectGovernorate` logic to search by **Governorate Name** instead of locking to a specific City ID.
- **Backend (`packages/api/src/routers/shop.ts`):** Confirmed that the `/geo/areas` endpoint supports searching by `governorate` name, which correctly aggregates areas from all matching city records.
- **Result:** All areas belonging to the selected Governorate are now correctly displayed and selectable.

### 9. 📍 Address System Overhaul (Nov 2025) — إصلاحات نظام العناوين

**Problem:**
1.  **Area/Landmarks Mixing:** "Area" (District) was being saved concatenated with "Landmarks" in the `details` field, causing display issues and data duplication.
2.  **Display Inconsistency:** "Area" was missing from Checkout and Order Details pages, or appearing twice (once as Area, once inside Landmarks).
3.  **Governorate Linking:** Frontend "Governorate" was not correctly mapped to Backend "City", causing issues with Area fetching.

**Fix:**
- **Data Model Strategy:**
    - **Governorate (Frontend) = City (Backend):** The frontend "Governorate" selection now correctly maps to the backend `City` entity.
    - **Area (Frontend) = City Column (Backend):** The "Area" selected by the user is now stored in the `city` column of the `AddressBook` table (previously unused/empty).
    - **Landmarks (Frontend) = Details Column (Backend):** "Landmarks" are stored exclusively in the `details` column.
- **Normalization Logic (Smart Parsing):**
    - Implemented robust parsing logic in `Address.vue` (User), `Checkout.vue` (User), and `OrderDetail.vue` (User & Admin).
    - **New Format:** If `city` column has data, it is treated as the "Area".
    - **Old Format:** If `city` is empty, "Area" is extracted from the start of the `details` string (before the first ' - ').
    - **Deduplication:** Added safety logic to strip the "Area" string from "Landmarks" if it appears as a prefix, ensuring clean display for all records.

**Affected Files:**
- `apps/mweb/src/pages/Address.vue` (Saving & Loading)
- `apps/mweb/src/pages/Checkout.vue` (Display)
- `apps/mweb/src/pages/OrderDetail.vue` (Display)
- `apps/admin/src/app/orders/[id]/page.tsx` (Admin Display)