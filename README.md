# 🛒 E-commerce Platform Monorepo

A modern, full-stack e-commerce platform built with cutting-edge technologies and best practices.

## 🏗️ Architecture

This monorepo contains a complete e-commerce solution with:

- **🌐 Web App** (`apps/web`): Next.js 14 with App Router
- **📱 Mobile App** (`apps/mobile`): React Native with Expo
- **🔧 API** (`packages/api`): tRPC + Express.js backend
- **🗄️ Database** (`packages/db`): PostgreSQL with Prisma ORM
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

### 🧪 Quality Assurance
- Comprehensive test suite (Jest + Testing Library)
- Type safety throughout the stack
- ESLint + Prettier for code quality
- API documentation

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Docker** & Docker Compose

### 1. Clone & Install

```bash
git clone <repository_url>
cd ecom-platform
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure

```bash
docker-compose -f infra/dev-docker-compose.yml up -d
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

### 5. Start Development

```bash
# Run all services
pnpm dev

# Or run individually:
pnpm web      # Web app (http://localhost:3000)
pnpm mobile   # Mobile app (Expo)
pnpm api      # API server (http://localhost:4000)
```

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./packages/db/prisma/schema.prisma)
- [Component Library](./packages/ui/src)

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
│   └── 📁 mobile/             # React Native mobile app
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
- **Docker Compose** - Local development
- **MinIO** - Object storage
- **GitHub Actions** - CI/CD

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build

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
- Build: `pnpm --filter web build && pnpm --filter web start`
- Key pages: `/` المنتجات، `/products/[id]`، `/cart`، `/checkout`، `/account`، `/categories`، `/search`

## 🧩 API (tRPC + Express)

- Dev: `pnpm --filter @repo/api dev`
- Build: `pnpm --filter @repo/api build`
- Endpoint: `${NEXT_PUBLIC_TRPC_URL}` (مثلاً http://localhost:4000/trpc)

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

- يقوم بتشغيل Postgres، تطبيق المايجريشن والـ seed، ثم بناء API وWeb وAdmin تلقائياً على أي دفع.
- تشغيل يدوي: Actions > CI / CD (pnpm & Turborepo) > Run workflow.

## 🔐 Admin Credentials (Seed)

- Email: `admin@example.com`
- Password: `admin123`
