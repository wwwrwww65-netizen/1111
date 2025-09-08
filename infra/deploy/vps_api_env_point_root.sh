#!/usr/bin/env bash
set -euo pipefail

API_DIR="/opt/app/ecom-platform/packages/api"
ADMIN_DIR="/opt/app/ecom-platform/apps/admin"
API_ENV="$API_DIR/.env"
ADMIN_ENV="$ADMIN_DIR/.env"

DB_NAME="ecom_db"
DB_USER="ecom_user"
DB_PASS="jeeey_db_pass_2025"

echo "[1/4] Ensure env files exist in /opt/app"
sudo install -d -m 755 "$API_DIR" "$ADMIN_DIR" || true
sudo install -D -m 600 /dev/null "$API_ENV" || true
sudo install -D -m 600 /dev/null "$ADMIN_ENV" || true

echo "[2/4] Write API .env for local PostgreSQL and secrets"
sudo sed -i "/^DATABASE_URL=/d" "$API_ENV"
echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}?schema=public" | sudo tee -a "$API_ENV" >/dev/null

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

echo "[3/4] Write Admin .env"
sudo sed -i "/^NEXT_PUBLIC_TRPC_URL=/d" "$ADMIN_ENV"
echo "NEXT_PUBLIC_TRPC_URL=https://api.jeeey.com/trpc" | sudo tee -a "$ADMIN_ENV" >/dev/null

echo "[Info] API .env now:"; sudo sed -n '1,120p' "$API_ENV" | sed -n '1,40p'

echo "[4/4] Restart ecom-api with root PM2 and test"
if command -v pm2 >/dev/null 2>&1; then
  sudo env PM2_HOME=/root/.pm2 pm2 restart ecom-api --update-env || sudo env PM2_HOME=/root/.pm2 pm2 restart ecom-api
  sleep 2
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
else
  echo "pm2 not found in PATH"
fi

echo "Done."

