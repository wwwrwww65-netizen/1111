#!/usr/bin/env bash
set -euo pipefail

echo "==== PM2 (root) describe ecom-api ===="
if command -v pm2 >/dev/null 2>&1; then
  sudo env PM2_HOME=/root/.pm2 pm2 describe ecom-api | sed -n '1,120p' | cat || true
  echo
  echo "==== PM2 (root) env keys ===="
  sudo env PM2_HOME=/root/.pm2 pm2 env 0 2>/dev/null | egrep -i '^(pm_cwd|PWD|NODE_ENV|DATABASE_URL)=' || true
else
  echo "pm2 not found"
fi

echo
echo "==== .env candidates ===="
for f in \
  /var/www/ecom/packages/api/.env \
  /opt/app/ecom-platform/packages/api/.env
do
  echo "--- $f"
  if [ -f "$f" ]; then
    sudo sed -n '1,60p' "$f" | cat
  else
    echo "(missing)"
  fi
done

echo
echo "==== DB check as ecom_user ===="
PGURL="postgresql://ecom_user:jeeey_db_pass_2025@127.0.0.1:5432/ecom_db"
if command -v psql >/dev/null 2>&1; then
  psql "$PGURL" -tAc "select current_user, current_database();" | cat || true
  psql "$PGURL" -tAc "select table_schema, table_name from information_schema.tables where table_schema='public' and table_name='User';" | cat || true
  psql "$PGURL" -tAc 'select count(*) from "User";' | cat || true
else
  echo "psql not found"
fi

echo
echo "==== Done ===="

