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
- Web/Admin (`apps/web`, `apps/admin`):
  - NEXT_PUBLIC_TRPC_URL (e.g. https://<api>/trpc)

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

## 🔐 Admin Credentials (Seed)

- Email: `admin@example.com`
- Password: `admin123`

## 📜 Admin REST & API Docs

- REST الإداري (RBAC): `/api/admin/*` (Authorization: Bearer أو HttpOnly cookie)
- OpenAPI/Swagger: `packages/api/src/openapi.yaml`
- Postman: `docs/Postman_Collection_Admin.json`
 - Swagger UI: `/docs` أثناء التشغيل (API)

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
