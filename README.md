# E-commerce Platform Monorepo

This monorepo contains the full-stack e-commerce platform, built with modern technologies.

## Structure

- `apps/web`: Next.js web application (customer-facing frontend)
- `apps/mobile`: React Native (Expo) mobile application for iOS & Android
- `packages/api`: tRPC/Express.js backend API
- `packages/db`: Prisma schema and database client
- `packages/ui`: Shared React components for web and mobile
- `infra`: Docker Compose for development and Terraform for production

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Docker

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository_url>
cd ecom-platform
pnpm install
```

### 2. Environment Variables

Copy the example environment file and update it if necessary. The default values are configured to work with the local Docker setup.

```bash
cp .env.example .env
```

### 3. Start Development Services

Run the local development infrastructure (Postgres, Redis, MinIO) using Docker Compose:

```bash
docker-compose -f infra/dev-docker-compose.yml up -d
```

### 4. Database Migration

Apply the database schema to your local Postgres instance:

```bash
pnpm --filter @repo/db db:migrate
```

You can also use Prisma Studio to view and edit your data:
```bash
pnpm --filter @repo/db db:studio
```

### 5. Running the Applications

You can run all applications in parallel using the root `dev` script:

```bash
pnpm dev
```

Alternatively, you can run each application individually:

```bash
# Run the web app
pnpm --filter web dev

# Run the mobile app
pnpm --filter mobile start

# Run the API
pnpm --filter api dev
```

## Technology Stack

- **Monorepo:** pnpm, Turborepo
- **Web:** Next.js, React, TypeScript, Tailwind CSS
- **Mobile:** React Native, Expo
- **Backend:** Express.js, tRPC, TypeScript
- **Database:** PostgreSQL, Prisma
- **Infrastructure:** Docker, Redis, MinIO
- **CI/CD:** GitHub Actions
