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
# Load API env for Prisma if present
if [ -f "$ROOT_DIR/.env.api" ]; then
  set -a; . "$ROOT_DIR/.env.api"; set +a
fi
pnpm --filter @repo/db db:deploy || true
pnpm --filter @repo/api build
pnpm --filter web build
pnpm --filter admin build

# Optional: seed admin if creds provided via environment
if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  (cd "$ROOT_DIR/packages/api" && ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node scripts/upsert-admin.js) || true
fi

# Ensure systemd ExecStart points to actual server.js paths for Next.js apps
ADMIN_JS=$(find "$ROOT_DIR/apps/admin/.next/standalone" -maxdepth 3 -type f -name server.js -print -quit 2>/dev/null || true)
WEB_JS=$(find "$ROOT_DIR/apps/web/.next/standalone" -maxdepth 3 -type f -name server.js -print -quit 2>/dev/null || true)
if [ -n "$ADMIN_JS" ] && [ -f /etc/systemd/system/ecom-admin.service ]; then
  sed -i -E "s|^ExecStart=.*|ExecStart=/usr/bin/node $ADMIN_JS|" /etc/systemd/system/ecom-admin.service || true
fi
if [ -n "$WEB_JS" ] && [ -f /etc/systemd/system/ecom-web.service ]; then
  sed -i -E "s|^ExecStart=.*|ExecStart=/usr/bin/node $WEB_JS|" /etc/systemd/system/ecom-web.service || true
fi

systemctl daemon-reload || true
systemctl restart ecom-api || true
systemctl restart ecom-web || true
systemctl restart ecom-admin || true

echo "Deploy completed."
