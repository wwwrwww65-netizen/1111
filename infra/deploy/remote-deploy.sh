#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_DIR:?PROJECT_DIR required}"

echo "[deploy] Working dir: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "[deploy] Ensuring correct Node/pnpm versions..."
corepack enable || true
corepack prepare pnpm@8.15.4 --activate

echo "[deploy] Ensuring PM2 is installed and available..."
export PATH="$PATH:/usr/local/bin:/usr/bin"
if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] pm2 not found; installing globally..."
  sudo npm i -g pm2@5 >/dev/null 2>&1 || sudo -E npm i -g pm2@5 || true
fi
if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] WARNING: pm2 still not found after install attempt; will try via npx"
  alias pm2='npx pm2'
fi

# Avoid Prisma env conflicts; consolidate to packages/db/.env only
export PRISMA_IGNORE_ENV_CONFLICT=1
rm -f packages/db/prisma/.env || true

echo "[deploy] Installing dependencies (including devDependencies)..."
# Force install devDependencies regardless of outer NODE_ENV
ORIG_NODE_ENV="${NODE_ENV:-}"
export CI=1
NODE_ENV=development pnpm install --frozen-lockfile=false --prod=false --force | cat

echo "[deploy] Building database client and packages..."
# Switch back to production for builds
export NODE_ENV=production
export NEXT_CACHE_DISABLED=1
export TURBO_FORCE=1
# Build DB using local binaries to avoid PATH/ENOENT issues
( cd packages/db && ./node_modules/.bin/prisma generate ) | cat
( cd packages/db && ./node_modules/.bin/tsc -p tsconfig.json ) | cat
# Clean admin/web caches to avoid stale artifacts, then build explicitly
(
  cd apps/admin 2>/dev/null || true
  rm -rf .next node_modules/.cache || true
) || true
(
  cd apps/web 2>/dev/null || true
  rm -rf .next node_modules/.cache || true
) || true
pnpm --filter admin build | cat
pnpm --filter web build | cat
# Build mweb (Vite) for static hosting
if [ -d "apps/mweb" ]; then
  pnpm --filter mweb build | cat || true
fi
# Build API via local tsc
( cd packages/api && ./node_modules/.bin/rimraf dist || rm -rf dist )
( cd packages/api && ./node_modules/.bin/tsc -p tsconfig.json ) | cat

echo "[deploy] Running Prisma migrations (deploy/push)..."
# Source DB URLs from API env if not present
export DATABASE_URL=${DATABASE_URL:-$(grep -s '^DATABASE_URL=' packages/api/.env | cut -d'=' -f2-)}
export DIRECT_URL=${DIRECT_URL:-$(grep -s '^DIRECT_URL=' packages/api/.env | cut -d'=' -f2-)}
# Fallback: DIRECT_URL defaults to DATABASE_URL if empty
if [[ -z "${DIRECT_URL:-}" && -n "${DATABASE_URL:-}" ]]; then
  export DIRECT_URL="$DATABASE_URL"
fi
# Ensure packages/db/.env contains both variables for schema resolution
if [[ -n "${DATABASE_URL:-}" ]]; then
  printf "DATABASE_URL=%s\nDIRECT_URL=%s\n" "$DATABASE_URL" "${DIRECT_URL:-$DATABASE_URL}" > packages/db/.env
fi
if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "[deploy] Ensuring DB ownership and privileges for ecom_user on ecom_db..."
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d ecom_db <<'SQL'
ALTER SCHEMA public OWNER TO ecom_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecom_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecom_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO ecom_user;
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT format('%I.%I', schemaname, tablename) AS f FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE 'ALTER TABLE ' || r.f || ' OWNER TO ecom_user';
  END LOOP;
  FOR r IN SELECT format('%I.%I', sequence_schema, sequence_name) AS f FROM information_schema.sequences WHERE sequence_schema='public' LOOP
    EXECUTE 'ALTER SEQUENCE ' || r.f || ' OWNER TO ecom_user';
  END LOOP;
  FOR r IN SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)) AS f
           FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname='public' LOOP
    EXECUTE 'ALTER FUNCTION ' || r.f || ' OWNER TO ecom_user';
  END LOOP;
END
$$;
SQL
  echo "[deploy] Ensuring Category SEO columns exist..."
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d ecom_db <<'SQL'
-- Ensure Category SEO columns exist (idempotent)
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT[];
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "translations" JSONB;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category" ("slug") WHERE "slug" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Category_parentId_sortOrder_idx" ON "Category" ("parentId", "sortOrder");

-- Ensure foreign key for parentId
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'CategoryHierarchy_parentId_fkey'
  ) THEN
    ALTER TABLE "Category" 
    ADD CONSTRAINT "CategoryHierarchy_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL;
  END IF;
END $$;
SQL

  echo "[deploy] Dropping legacy unique constraints/indexes that conflict with new schema..."
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d ecom_db <<'SQL'
-- Legacy unique on AttributeSize(name) conflicts with new composite unique (name,typeId)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'AttributeSize_name_key' AND t.relname = 'AttributeSize'
  ) THEN
    ALTER TABLE "AttributeSize" DROP CONSTRAINT "AttributeSize_name_key";
  END IF;
END $$;
-- Drop index if it exists separately
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'AttributeSize_name_key'
  ) THEN
    DROP INDEX IF EXISTS "AttributeSize_name_key";
  END IF;
END $$;
SQL
  echo "[deploy] Determining migration strategy..."
  if compgen -G "packages/db/prisma/migrations/*" > /dev/null; then
    echo "[deploy] Found migrations: running db:deploy"
    pnpm --filter @repo/db db:deploy || npx prisma db push --accept-data-loss --schema packages/db/prisma/schema.prisma
  else
    echo "[deploy] No migrations found: running db:push"
    pnpm --filter @repo/db db:push || npx prisma db push --accept-data-loss --schema packages/db/prisma/schema.prisma
  fi
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

echo "[deploy] Publishing mweb static build (if present)..."
if [[ -d apps/mweb/dist ]]; then
  mkdir -p "$PROJECT_DIR/apps/mweb/dist"
  rsync -a --delete apps/mweb/dist/ "$PROJECT_DIR/apps/mweb/dist/"
  # Try to reload nginx to serve latest static files
  if command -v systemctl >/dev/null 2>&1; then
    sudo nginx -t && sudo systemctl reload nginx || true
  fi
fi

echo "[deploy] Ensuring uploads directory exists..."
mkdir -p "$PROJECT_DIR/uploads" || true
chmod 755 "$PROJECT_DIR/uploads" || true

echo "[deploy] Reloading processes..."

use_systemd=false
if command -v systemctl >/dev/null 2>&1; then
  # Detect if our services are managed by systemd
  if systemctl list-unit-files | grep -qE '^ecom-api\.service'; then
    use_systemd=true
  fi
fi

if [[ "$use_systemd" == true ]]; then
  echo "[deploy] Detected systemd units; restarting via systemd"
  sudo systemctl daemon-reload || true
  sudo systemctl restart ecom-web || true
  sudo systemctl restart ecom-admin || true
  sudo systemctl restart ecom-api || true
  # No systemd for mweb (served statically by nginx)
else
  echo "[deploy] Using PM2 (no systemd units detected)"
  # Ensure PM2 ecosystem config is up-to-date
  if [[ -f "$PROJECT_DIR/infra/deploy/ecosystem.config.js" ]]; then
    sudo cp -f "$PROJECT_DIR/infra/deploy/ecosystem.config.js" /etc/pm2.ecosystem.config.js || true
  fi
  pm2 delete ecom-web || true
  pm2 start /etc/pm2.ecosystem.config.js --only ecom-web --update-env || true
  pm2 start /etc/pm2.ecosystem.config.js --only ecom-admin --update-env || true
  pm2 start /etc/pm2.ecosystem.config.js --only ecom-api --update-env || true
  pm2 save || true
fi

echo "[deploy] Verifying ports (3000 web, 3001 admin, 4000 api)..."
sleep 1

# Additional verification for categories functionality
echo "[deploy] Verifying categories API endpoints..."
sleep 2

# Test shop categories API
if curl -fsS "http://127.0.0.1:4000/api/categories?limit=5" >/dev/null 2>&1; then
  echo "[deploy] ✅ Shop categories API responding"
else
  echo "[deploy] ❌ Shop categories API not responding"
fi

# Test admin categories API (without auth for basic connectivity)
if curl -fsS "http://127.0.0.1:4000/api/admin/categories" >/dev/null 2>&1; then
  echo "[deploy] ✅ Admin categories API responding"
else
  echo "[deploy] ❌ Admin categories API not responding"
fi

# Test media upload endpoint
if curl -fsS "http://127.0.0.1:4000/api/admin/media/list" >/dev/null 2>&1; then
  echo "[deploy] ✅ Media API responding"
else
  echo "[deploy] ❌ Media API not responding"
fi

check_port() {
  local port="$1" name="$2"
  if ! curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
    echo "[deploy] WARN: ${name} port ${port} not responding; attempting one more restart"
    if [[ "$use_systemd" == true ]]; then
      sudo systemctl restart "${name}" || true
    else
      pm2 restart "${name}" --update-env || true
    fi
    sleep 3
    if ! curl -fsS "http://127.0.0.1:${port}" >/dev/null 2>&1; then
      echo "[deploy] ERROR: ${name} still not responding on ${port}; showing recent logs"
      if [[ "$use_systemd" == true ]]; then
        sudo journalctl -u "${name}" -n 120 --no-pager || true
      else
        pm2 logs "${name}" --lines 120 --nostream || true
      fi
    fi
  fi
}

check_port 3000 ecom-web
check_port 3001 ecom-admin
check_port 4000 ecom-api

# Verify mweb via nginx host (if configured)
if [[ -n "${DOMAIN_MWEB:-}" ]]; then
  if curl -fsS -H "Host: ${DOMAIN_MWEB}" http://127.0.0.1/ >/dev/null 2>&1; then
    echo "[deploy] ✅ MWeb (nginx) responding for host ${DOMAIN_MWEB}"
  else
    echo "[deploy] ❌ MWeb host ${DOMAIN_MWEB} not responding via nginx"
  fi
fi

if [[ -n "${GIT_SHA:-}" ]]; then
  echo "[deploy] Deployment metadata: GIT_SHA=$GIT_SHA"
  echo "[deploy] Workflow run: ${GIT_RUN_URL:-N/A}"
  # Expose to runtime env for inspection
  pm2 set ecom:git_sha "$GIT_SHA" >/dev/null 2>&1 || true
  pm2 set ecom:run_url "${GIT_RUN_URL:-}" >/dev/null 2>&1 || true
fi

echo "[deploy] Running post-deployment tests..."
# Run quick test first
if [ -f "$PROJECT_DIR/infra/ops/quick-test.sh" ]; then
  chmod +x "$PROJECT_DIR/infra/ops/quick-test.sh"
  echo "[deploy] Running quick test..."
  "$PROJECT_DIR/infra/ops/quick-test.sh" || echo "[deploy] WARNING: Quick test failed"
fi

# Run detailed category functionality tests
if [ -f "$PROJECT_DIR/infra/ops/test-categories.sh" ]; then
  chmod +x "$PROJECT_DIR/infra/ops/test-categories.sh"
  echo "[deploy] Running detailed category tests..."
  "$PROJECT_DIR/infra/ops/test-categories.sh" || echo "[deploy] WARNING: Some tests failed - check /var/log/category-tests.log"
else
  echo "[deploy] Category tests not found - skipping"
fi

echo "[deploy] Done."

