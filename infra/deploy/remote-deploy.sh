#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_DIR:?PROJECT_DIR required}"

echo "[deploy] Working dir: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "[deploy] Ensuring correct Node/pnpm versions..."
corepack enable || true
corepack prepare pnpm@8.15.4 --activate

echo "[deploy] Installing dependencies (including devDependencies)..."
# Force install devDependencies regardless of outer NODE_ENV
ORIG_NODE_ENV="${NODE_ENV:-}"
NODE_ENV=development pnpm install --frozen-lockfile=false | cat

echo "[deploy] Building database client and packages..."
# Switch back to production for builds
export NODE_ENV=production
pnpm --filter @repo/db build | cat
pnpm build | cat

echo "[deploy] Running Prisma migrations (deploy)..."
export DATABASE_URL=${DATABASE_URL:-$(grep -s '^DATABASE_URL=' packages/api/.env | cut -d'=' -f2-)}
export DIRECT_URL=${DIRECT_URL:-$(grep -s '^DIRECT_URL=' packages/api/.env | cut -d'=' -f2-)}
if [[ -n "${DATABASE_URL:-}" ]]; then
  npx prisma migrate deploy --schema packages/db/prisma/schema.prisma || npx prisma db push --schema packages/db/prisma/schema.prisma
else
  echo "[deploy] DATABASE_URL not set; skipping migrate"
fi

echo "[deploy] Preparing Next.js standalone outputs for web & admin..."
if [[ -d apps/web/.next/standalone ]]; then
  cp -r apps/web/public apps/web/.next/standalone/ 2>/dev/null || true
fi
if [[ -d apps/admin/.next/standalone ]]; then
  cp -r apps/admin/public apps/admin/.next/standalone/ 2>/dev/null || true
fi

echo "[deploy] Reloading processes with PM2..."
pm2 start /etc/pm2.ecosystem.config.js --update-env || pm2 reload all || pm2 restart all || true
pm2 save || true

echo "[deploy] Done."

