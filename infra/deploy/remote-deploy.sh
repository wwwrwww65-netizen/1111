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
export CI=1
NODE_ENV=development pnpm install --frozen-lockfile=false --prod=false --force | cat

echo "[deploy] Building database client and packages..."
# Switch back to production for builds
export NODE_ENV=production
pnpm --filter @repo/db build | cat
pnpm build | cat

echo "[deploy] Running Prisma migrations (deploy/push)..."
export DATABASE_URL=${DATABASE_URL:-$(grep -s '^DATABASE_URL=' packages/api/.env | cut -d'=' -f2-)}
export DIRECT_URL=${DIRECT_URL:-$(grep -s '^DIRECT_URL=' packages/api/.env | cut -d'=' -f2-)}
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

echo "[deploy] Reloading processes with PM2..."
pm2 start /etc/pm2.ecosystem.config.js --update-env || pm2 reload all || pm2 restart all || true
pm2 save || true

if [[ -n "${GIT_SHA:-}" ]]; then
  echo "[deploy] Deployment metadata: GIT_SHA=$GIT_SHA"
  echo "[deploy] Workflow run: ${GIT_RUN_URL:-N/A}"
  # Expose to runtime env for inspection
  pm2 set ecom:git_sha "$GIT_SHA" >/dev/null 2>&1 || true
  pm2 set ecom:run_url "${GIT_RUN_URL:-}" >/dev/null 2>&1 || true
fi

echo "[deploy] Done."

