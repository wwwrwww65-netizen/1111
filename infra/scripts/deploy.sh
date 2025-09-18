#!/usr/bin/env bash
set -euo pipefail

# Usage: deploy.sh /var/www/ecom
ROOT_DIR=${1:-/var/www/ecom}

echo "Deploying to $ROOT_DIR"
mkdir -p "$ROOT_DIR"
# Sync workspace to ROOT_DIR but ignore ephemeral caches and tolerate rsync code 24 (vanished files)
set +e
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .next \
  --exclude dist \
  ./ "$ROOT_DIR"/
rc=$?
set -e
if [ "$rc" -ne 0 ] && [ "$rc" -ne 24 ]; then
  echo "[deploy] rsync failed with code $rc" >&2
  exit "$rc"
fi

cd "$ROOT_DIR"
corepack enable || true
corepack prepare pnpm@9 --activate || true
export npm_config_ignore_scripts=true
export NPM_CONFIG_IGNORE_SCRIPTS=true
export PUPPETEER_SKIP_DOWNLOAD=true
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
pnpm install -r --no-frozen-lockfile --ignore-scripts

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
# Skip Prisma migrate deploy in production (database already initialized)
# pnpm --filter @repo/db db:deploy || true
# Force fresh Next.js builds for web/admin
rm -rf "$ROOT_DIR/apps/web/.next" "$ROOT_DIR/apps/admin/.next" || true
pnpm --filter @repo/api build
pnpm --filter web build
pnpm --filter admin build
# Build mobile web (m.jeeey.com) if present (Vite)
if [ -d "$ROOT_DIR/apps/mweb" ]; then
  rm -rf "$ROOT_DIR/apps/mweb/dist" || true
  (cd "$ROOT_DIR/apps/mweb" && pnpm install --silent && pnpm build) || true
fi

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
# Ensure correct PORTs via systemd drop-in overrides (admin:3001, web:3000)
mkdir -p /etc/systemd/system/ecom-admin.service.d /etc/systemd/system/ecom-web.service.d || true
cat > /etc/systemd/system/ecom-admin.service.d/override.conf <<'EOF'
[Service]
Environment=PORT=3001
EOF
cat > /etc/systemd/system/ecom-web.service.d/override.conf <<'EOF'
[Service]
Environment=PORT=3000
EOF
systemctl daemon-reload || true
# Ensure API process sees COOKIE_DOMAIN (and other vars) via dotenv/config
if [ -d "$ROOT_DIR/packages/api" ]; then
  if [ -f "$ROOT_DIR/.env.api" ]; then
    cp "$ROOT_DIR/.env.api" "$ROOT_DIR/packages/api/.env" || true
    if ! grep -q '^COOKIE_DOMAIN=' "$ROOT_DIR/packages/api/.env"; then
      echo 'COOKIE_DOMAIN=.jeeey.com' >> "$ROOT_DIR/packages/api/.env"
    fi
  else
    printf '%s\n' \
      'NODE_ENV=production' \
      'COOKIE_DOMAIN=.jeeey.com' \
      > "$ROOT_DIR/packages/api/.env"
  fi
fi
systemctl restart ecom-api || true
systemctl restart ecom-web || true
systemctl restart ecom-admin || true

echo "Deploy completed."
