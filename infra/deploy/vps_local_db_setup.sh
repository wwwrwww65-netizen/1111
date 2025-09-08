#!/usr/bin/env bash
set -euo pipefail

DB_NAME="ecom_db"
DB_USER="ecom_user"
DB_PASS="jeeey_db_pass_2025"
PROJECT_DIR="/var/www/ecom"
API_ENV="$PROJECT_DIR/packages/api/.env"
ADMIN_ENV="$PROJECT_DIR/apps/admin/.env"

echo "[1/6] Ensure PostgreSQL installed and running"
if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi
sudo systemctl enable --now postgresql

echo "[2/6] Create local DB user/database and grants (idempotent)"
# Create role if missing
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE USER ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';"

# Create database if missing
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

# Grants and defaults
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" -c \
  "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
   ALTER SCHEMA public OWNER TO ${DB_USER};
   GRANT CONNECT ON DATABASE ${DB_NAME} TO ${DB_USER};
   GRANT USAGE ON SCHEMA public TO ${DB_USER};
   GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO ${DB_USER};
   GRANT USAGE,SELECT,UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ${DB_USER};
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO ${DB_USER};
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE,SELECT,UPDATE ON SEQUENCES TO ${DB_USER};
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ${DB_USER};"

echo "[3/6] Transfer ownership of existing objects to ${DB_USER}"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" <<'PLSQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('ALTER TABLE %I.%I OWNER TO ecom_user', r.schemaname, r.tablename);
  END LOOP;

  FOR r IN SELECT sequence_schema, sequence_name FROM information_schema.sequences WHERE sequence_schema='public' LOOP
    EXECUTE format('ALTER SEQUENCE %I.%I OWNER TO ecom_user', r.sequence_schema, r.sequence_name);
  END LOOP;

  FOR r IN
    SELECT n.nspname AS schema, p.proname AS name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public'
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) OWNER TO ecom_user', r.schema, r.name, r.args);
  END LOOP;
END $$;
PLSQL

echo "[4/6] Update API/Admin .env to use local DB and correct secrets"
sudo install -D -m 600 /dev/null "$API_ENV"
sudo install -D -m 600 /dev/null "$ADMIN_ENV"

sudo sed -i "/^DATABASE_URL=/d" "$API_ENV"
echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public" | sudo tee -a "$API_ENV" >/dev/null

# Clean any Render keys
sudo sed -i "/^RENDER_/d" "$API_ENV" || true
sudo sed -i "/^RENDER_/d" "$ADMIN_ENV" || true

# Core API env
for kv in \
  COOKIE_DOMAIN=.jeeey.com \
  CORS_ALLOW_ORIGINS=https://admin.jeeey.com,https://jeeey.com \
  NEXT_PUBLIC_ADMIN_URL=https://admin.jeeey.com \
  NEXT_PUBLIC_APP_URL=https://jeeey.com \
  JWT_SECRET=5d6f5945e3a82d1df5df874f9f6463f932f9ec9a3131984114df07bcaf6f1f8f4c69e047168a5159542d476df9415a7dfe9f7a523bd1981f113cac1ec6e043a0 \
  MAINTENANCE_SECRET=jeeey_maint_7f3c0b5e1fd542a9
do
  key=${kv%%=*}
  sudo sed -i "/^${key}=*/d" "$API_ENV"
  echo "$kv" | sudo tee -a "$API_ENV" >/dev/null
done

# Admin env
sudo sed -i "/^NEXT_PUBLIC_TRPC_URL=/d" "$ADMIN_ENV"
echo "NEXT_PUBLIC_TRPC_URL=https://api.jeeey.com/trpc" | sudo tee -a "$ADMIN_ENV" >/dev/null

echo "[5/6] Restart API with updated env"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart ecom-api --update-env || pm2 restart ecom-api
  sleep 2
fi

echo "[6/6] Bootstrap admin and test login"
echo "--- create admin"
curl -fsS -X POST \
  -H "x-maintenance-secret: jeeey_maint_7f3c0b5e1fd542a9" \
  -H "content-type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123","name":"Admin"}' \
  https://api.jeeey.com/api/admin/maintenance/create-admin | cat || true

echo
echo "--- login test (expect 200 and Set-Cookie)"
curl -i -sS -X POST \
  -H "content-type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123","remember":true}' \
  https://api.jeeey.com/api/admin/auth/login | sed -n '1,40p' | cat

echo
echo "Done."

