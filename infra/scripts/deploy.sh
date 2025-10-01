#!/usr/bin/env bash
set -euo pipefail

# Usage: deploy.sh /var/www/ecom
ROOT_DIR=${1:-/var/www/ecom}

echo "Deploying to $ROOT_DIR"
mkdir -p "$ROOT_DIR"
# Ensure a stable canonical path and compatibility with any legacy path consumers
if [ "$ROOT_DIR" != "/srv/ecom" ]; then
  mkdir -p /srv || true
  ln -sfn "$ROOT_DIR" /srv/ecom || true
fi
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
# Sanitize .env.api (remove non-breaking spaces) and ensure it's present
if [ -f "$ROOT_DIR/.env.api" ]; then
  # remove UTF-8 NBSP if present
  sed -i 's/\xC2\xA0//g' "$ROOT_DIR/.env.api" || true
fi
export CI=1
corepack enable || true
corepack prepare pnpm@8.6.10 --activate || true
export npm_config_ignore_scripts=true
export NPM_CONFIG_IGNORE_SCRIPTS=true
export PUPPETEER_SKIP_DOWNLOAD=true
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
pnpm install -r --no-frozen-lockfile --prod=false

# Load or materialize public env (for Next build) and per-app .env.production
mkdir -p "$ROOT_DIR/apps/admin" "$ROOT_DIR/apps/web"
if [ -f "$ROOT_DIR/.env.web" ]; then
  set -a; . "$ROOT_DIR/.env.web"; set +a
fi
{
  echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-https://jeeey.com}"
  echo "NEXT_PUBLIC_ADMIN_URL=${NEXT_PUBLIC_ADMIN_URL:-https://admin.jeeey.com}"
  echo "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-https://api.jeeey.com}"
  echo "NEXT_PUBLIC_TRPC_URL=${NEXT_PUBLIC_TRPC_URL:-https://api.jeeey.com/trpc}"
} > "$ROOT_DIR/apps/admin/.env.production"
cp "$ROOT_DIR/apps/admin/.env.production" "$ROOT_DIR/apps/web/.env.production"

export NODE_ENV=production
# Load API env for Prisma and run migrate deploy
if [ -f "$ROOT_DIR/.env.api" ]; then
  set -a; . "$ROOT_DIR/.env.api"; set +a
fi
# Try deploy migrations using npx prisma; if fails, attempt baseline resolve
set +e
if [ -n "${DIRECT_URL:-}" ] || [ -n "${DATABASE_URL:-}" ]; then
  npx -y prisma@5.14.0 migrate deploy --schema "$ROOT_DIR/packages/db/prisma/schema.prisma"
  db_status=$?
  if [ "$db_status" -ne 0 ]; then
    echo "[deploy] prisma migrate deploy failed with code $db_status; attempting baseline..." >&2
    if [ -d "$ROOT_DIR/packages/db/prisma/migrations" ]; then
      last_mig=$(ls -1 "$ROOT_DIR/packages/db/prisma/migrations" | sort | tail -n1 || true)
      if [ -n "$last_mig" ]; then
        npx -y prisma@5.14.0 migrate resolve --applied "$last_mig" --schema "$ROOT_DIR/packages/db/prisma/schema.prisma" || true
        npx -y prisma@5.14.0 migrate deploy --schema "$ROOT_DIR/packages/db/prisma/schema.prisma" || true
      fi
    fi
  fi
fi
set -e
# Force fresh builds (clean previous outputs)
rm -rf "$ROOT_DIR/packages/api/dist" || true
rm -rf "$ROOT_DIR/apps/web/.next" "$ROOT_DIR/apps/admin/.next" || true
# Build db/api via package scripts (ensures tsc and prisma are available in context)
# Build DB: use local binaries to avoid PATH issues
(cd "$ROOT_DIR/packages/db" && \
  ./node_modules/.bin/prisma generate 2>/dev/null || npx -y prisma@5.14.0 generate --schema "$ROOT_DIR/packages/db/prisma/schema.prisma")
(cd "$ROOT_DIR/packages/db" && ./node_modules/.bin/tsc -p tsconfig.json)
# Build API: clean then compile with local tsc
(cd "$ROOT_DIR/packages/api" && (./node_modules/.bin/rimraf dist || rm -rf dist) && ./node_modules/.bin/tsc -p tsconfig.json)
# Next.js builds
pnpm --filter web build
pnpm --filter admin build
# Ensure Category SEO columns after DB/API are compiled and Prisma client exists
(cd "$ROOT_DIR/packages/api" && node scripts/ensure-category-seo.js) || true
# Build mobile web (m.jeeey.com) if present (Vite) - REQUIRED
if [ -d "$ROOT_DIR/apps/mweb" ]; then
  rm -rf "$ROOT_DIR/apps/mweb/dist" || true
  echo "[deploy] Building mweb (Vite)"
  # Ensure devDependencies are installed even under NODE_ENV=production
  (cd "$ROOT_DIR/apps/mweb" && NPM_CONFIG_PRODUCTION=false pnpm install --no-frozen-lockfile --ignore-scripts) \
    || (cd "$ROOT_DIR/apps/mweb" && pnpm install --prod=false --no-frozen-lockfile --ignore-scripts)
  (cd "$ROOT_DIR/apps/mweb" && pnpm build)
  if [ ! -f "$ROOT_DIR/apps/mweb/dist/index.html" ]; then
    echo "[deploy] ERROR: mweb dist/index.html missing after build" >&2
    exit 1
  fi
  # Bust CDN/cache by touching index.html (nginx short-cache already set)
  touch "$ROOT_DIR/apps/mweb/dist/index.html"
fi

# IMPORTANT: Do NOT create or seed any data on deploy.
# To allow controlled admin seeding, explicitly set DEPLOY_ALLOW_SEEDING=1 (defaults to disabled)
if [ "${DEPLOY_ALLOW_SEEDING:-0}" = "1" ]; then
  if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
    (cd "$ROOT_DIR/packages/api" && ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node scripts/upsert-admin.js) || true
  fi
else
  echo "[deploy] Skipping any admin/user/product/category/order seeding (DEPLOY_ALLOW_SEEDING!=1)"
fi

# Ensure Next.js standalone bundles have their static assets next to server.js
# Ensure standalone static assets are available (copy to both plausible locations)
if [ -d "$ROOT_DIR/apps/admin/.next/static" ] && [ -d "$ROOT_DIR/apps/admin/.next/standalone" ]; then
  mkdir -p "$ROOT_DIR/apps/admin/.next/standalone/.next"
  rsync -a "$ROOT_DIR/apps/admin/.next/static" "$ROOT_DIR/apps/admin/.next/standalone/.next/" || true
  if [ -d "$ROOT_DIR/apps/admin/.next/standalone/apps/admin" ]; then
    mkdir -p "$ROOT_DIR/apps/admin/.next/standalone/apps/admin/.next"
    rsync -a "$ROOT_DIR/apps/admin/.next/static" "$ROOT_DIR/apps/admin/.next/standalone/apps/admin/.next/" || true
    cp -r "$ROOT_DIR/apps/admin/public" "$ROOT_DIR/apps/admin/.next/standalone/apps/admin/" 2>/dev/null || true
  fi
fi
if [ -d "$ROOT_DIR/apps/web/.next/static" ] && [ -d "$ROOT_DIR/apps/web/.next/standalone" ]; then
  mkdir -p "$ROOT_DIR/apps/web/.next/standalone/.next"
  rsync -a "$ROOT_DIR/apps/web/.next/static" "$ROOT_DIR/apps/web/.next/standalone/.next/" || true
  cp -r "$ROOT_DIR/apps/web/public" "$ROOT_DIR/apps/web/.next/standalone/" 2>/dev/null || true
fi

# Ensure systemd ExecStart points to actual server.js paths for Next.js apps
# Ensure systemd ExecStart uses next start with correct working directory
# Use Next.js standalone server.js for admin and web
ADMIN_JS=$(find "$ROOT_DIR/apps/admin/.next/standalone" -maxdepth 3 -type f -name server.js -print -quit 2>/dev/null || true)
WEB_JS=$(find "$ROOT_DIR/apps/web/.next/standalone" -maxdepth 3 -type f -name server.js -print -quit 2>/dev/null || true)
if [ -n "$ADMIN_JS" ] && [ -f /etc/systemd/system/ecom-admin.service ]; then
  sed -i -E "s|^ExecStart=.*|ExecStart=/usr/bin/node $ADMIN_JS|" /etc/systemd/system/ecom-admin.service || true
  sed -i -E "s|^WorkingDirectory=.*|WorkingDirectory=$ROOT_DIR|" /etc/systemd/system/ecom-admin.service || true
fi
if [ -n "$WEB_JS" ] && [ -f /etc/systemd/system/ecom-web.service ]; then
  sed -i -E "s|^ExecStart=.*|ExecStart=/usr/bin/node $WEB_JS|" /etc/systemd/system/ecom-web.service || true
  sed -i -E "s|^WorkingDirectory=.*|WorkingDirectory=$ROOT_DIR|" /etc/systemd/system/ecom-web.service || true
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
# Create systemd unit files if missing (ensure services exist and auto-restart)
if command -v systemctl >/dev/null 2>&1; then
  if [ ! -f /etc/systemd/system/ecom-api.service ]; then
    cat > /etc/systemd/system/ecom-api.service <<EOF
[Unit]
Description=Ecom API
After=network.target

[Service]
Type=simple
WorkingDirectory=$ROOT_DIR
EnvironmentFile=$ROOT_DIR/.env.api
ExecStart=/usr/bin/node $ROOT_DIR/packages/api/dist/index.js
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload || true
    systemctl enable ecom-api || true
  fi
  if [ ! -f /etc/systemd/system/ecom-admin.service ] && [ -n "$ADMIN_JS" ]; then
    cat > /etc/systemd/system/ecom-admin.service <<EOF
[Unit]
Description=Ecom Admin (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=$ROOT_DIR
Environment=PORT=3001
ExecStart=/usr/bin/node $ADMIN_JS
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload || true
    systemctl enable ecom-admin || true
  fi
  if [ ! -f /etc/systemd/system/ecom-web.service ] && [ -n "$WEB_JS" ]; then
    cat > /etc/systemd/system/ecom-web.service <<EOF
[Unit]
Description=Ecom Web (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=$ROOT_DIR
Environment=PORT=3000
ExecStart=/usr/bin/node $WEB_JS
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload || true
    systemctl enable ecom-web || true
  fi
fi
# Ensure API process uses deployed dist and sees env
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
  # Point systemd ExecStart to built API server if defined
  if [ -f /etc/systemd/system/ecom-api.service ]; then
    # Prefer package build entry
    API_JS=$(node -e "const p=require('path');console.log(p.resolve(process.cwd(),'packages/api/dist/index.js'))" 2>/dev/null || true)
    if [ -n "$API_JS" ] && [ -f "$API_JS" ]; then
      sed -i -E "s|^ExecStart=.*|ExecStart=/usr/bin/node $API_JS|" /etc/systemd/system/ecom-api.service || true
      sed -i -E "s|^WorkingDirectory=.*|WorkingDirectory=$ROOT_DIR|" /etc/systemd/system/ecom-api.service || true
      # Ensure EnvironmentFile is loaded for API process
      mkdir -p /etc/systemd/system/ecom-api.service.d
      cat > /etc/systemd/system/ecom-api.service.d/override.conf <<EOF
[Service]
EnvironmentFile=$ROOT_DIR/.env.api
WorkingDirectory=$ROOT_DIR
EOF
      systemctl daemon-reload || true
    fi
  fi
fi
systemctl restart ecom-api || true
systemctl restart ecom-web || true
systemctl restart ecom-admin || true

# If systemd is unavailable, fallback to PM2/node for API
if ! command -v systemctl >/dev/null 2>&1; then
  if command -v pm2 >/dev/null 2>&1; then
    # Update env for pm2 processes
    pm2 list >/dev/null 2>&1 || pm2 save || true
    pm2 restart all --update-env || true
  else
    # Run API directly (best-effort)
    if [ -f "$ROOT_DIR/packages/api/dist/index.js" ]; then
      pkill -f 'packages/api/dist/index.js' || true
      nohup node "$ROOT_DIR/packages/api/dist/index.js" >/var/log/ecom-api.out 2>&1 &
    fi
  fi
fi

# Reload nginx (if present) to avoid stale upstreams and 502s
if command -v nginx >/dev/null 2>&1; then
  nginx -t >/dev/null 2>&1 && nginx -s reload || true
fi

echo "Deploy completed."
