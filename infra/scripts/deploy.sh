#!/usr/bin/env bash
set -euo pipefail

# Usage: deploy.sh /var/www/ecom
ROOT_DIR=${1:-/var/www/ecom}

echo "Deploying to $ROOT_DIR"
mkdir -p "$ROOT_DIR"
rsync -a --delete --exclude node_modules --exclude .git ./ "$ROOT_DIR"/

cd "$ROOT_DIR"
corepack enable || true
corepack prepare pnpm@9 --activate || true
pnpm install -r --no-frozen-lockfile

# Load public env (for Next build) if present and materialize per-app .env.production
if [ -f "$ROOT_DIR/.env.web" ]; then
  set -a; . "$ROOT_DIR/.env.web"; set +a
  mkdir -p "$ROOT_DIR/apps/admin" "$ROOT_DIR/apps/web"
  {
    echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-}"
    echo "NEXT_PUBLIC_ADMIN_URL=${NEXT_PUBLIC_ADMIN_URL:-}"
    echo "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-}"
    echo "NEXT_PUBLIC_TRPC_URL=${NEXT_PUBLIC_TRPC_URL:-}"
  } > "$ROOT_DIR/apps/admin/.env.production"
  cp "$ROOT_DIR/apps/admin/.env.production" "$ROOT_DIR/apps/web/.env.production"
fi

export NODE_ENV=production
pnpm --filter @repo/db db:deploy || true
pnpm --filter @repo/api build
pnpm --filter web build
pnpm --filter admin build

systemctl daemon-reload || true
systemctl restart ecom-api || true
systemctl restart ecom-web || true
systemctl restart ecom-admin || true

echo "Deploy completed."
