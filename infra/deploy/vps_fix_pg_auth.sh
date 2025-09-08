#!/usr/bin/env bash
set -euo pipefail

DB_NAME="ecom_db"
DB_USER="ecom_user"
DB_PASS="jeeey_db_pass_2025"

echo "[1/4] Set password for ${DB_USER}"
if id postgres >/dev/null 2>&1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
else
  echo "postgres user not found" >&2; exit 1
fi

echo "[2/4] Ensure pg_hba.conf allows md5 for ${DB_USER} on localhost"
HBA_PATH=$(sudo -u postgres psql -tAc "SHOW hba_file;" | tr -d ' \t')
if [ -z "${HBA_PATH}" ] || [ ! -f "${HBA_PATH}" ]; then
  echo "Could not locate pg_hba.conf" >&2; exit 1
fi
sudo cp "${HBA_PATH}" "${HBA_PATH}.bak_$(date +%s)" || true

add_rule_if_missing() {
  local rule="$1"
  grep -qF "${rule}" "${HBA_PATH}" || echo "${rule}" | sudo tee -a "${HBA_PATH}" >/dev/null
}

add_rule_if_missing "local   all             ${DB_USER}                                md5"
add_rule_if_missing "host    all             ${DB_USER}       127.0.0.1/32            md5"
add_rule_if_missing "host    all             ${DB_USER}       ::1/128                  md5"

echo "[3/4] Reload PostgreSQL"
sudo systemctl reload postgresql || sudo systemctl restart postgresql
sleep 1

echo "[4/4] Test connection as ${DB_USER}"
PGURL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
psql "${PGURL}" -tAc "select current_user, current_database();" | cat
psql "${PGURL}" -tAc "select count(*) from \"User\";" | cat || true

echo "Done."

