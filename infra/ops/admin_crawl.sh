#!/usr/bin/env bash

set -Eeuo pipefail

LOG_FILE="/var/log/cursor-ops.log"
if ! (sudo sh -c ">> '$LOG_FILE'" 2>/dev/null); then
  LOG_FILE="$HOME/cursor-ops.log"
  : >> "$LOG_FILE" || true
fi
timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { printf '%s %s\n' "$(timestamp)" "$*" | sudo tee -a "$LOG_FILE" >/dev/null; }
section() { log "===== $* ====="; }

PROJECT_DIR="${PROJECT_DIR:-/var/www/ecom}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
COOKIE_JAR="$PROJECT_DIR/.ops-cookies.txt"
OUT_FILE="$PROJECT_DIR/.ops-admin-sidebar.txt"

section "Admin crawler: login and enumerate sidebar"
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  log "Missing ADMIN_EMAIL or ADMIN_PASSWORD; aborting crawl"
  exit 2
fi

rm -f "$COOKIE_JAR" "$OUT_FILE" || true
touch "$OUT_FILE" || true

# Optionally ensure an admin exists
if [ -n "${MAINTENANCE_SECRET:-}" ]; then
  log "+ POST /api/admin/maintenance/create-admin (idempotent)"
  curl -sS -X POST \
    -H 'content-type: application/x-www-form-urlencoded' \
    -H "x-maintenance-secret: ${MAINTENANCE_SECRET}" \
    --data-urlencode email="$ADMIN_EMAIL" \
    --data-urlencode password="$ADMIN_PASSWORD" \
    https://api.jeeey.com/api/admin/maintenance/create-admin | sed -n '1,80p' | sudo tee -a "$LOG_FILE" >/dev/null || true
fi

# Login via API and capture cookies (with retries)
log "+ POST /api/admin/auth/login"
for i in $(seq 1 10); do
  set +e
  curl -i -sS -c "$COOKIE_JAR" -X POST \
    -H 'content-type: application/x-www-form-urlencoded' \
    --data-urlencode email="$ADMIN_EMAIL" \
    --data-urlencode password="$ADMIN_PASSWORD" \
    https://api.jeeey.com/api/admin/auth/login | sed -n '1,60p' | sudo tee -a "$LOG_FILE" >/dev/null
  EC=$?
  set -e
  if grep -qi "auth_token" "$COOKIE_JAR" 2>/dev/null; then break; fi
  sleep 2
done
if ! grep -qi "auth_token" "$COOKIE_JAR" 2>/dev/null; then
  log "Login failed or cookie not set; aborting"
  exit 3
fi

# Fetch admin root HTML
TMP_HTML="$(mktemp)"
log "+ GET https://admin.jeeey.com/"
curl -sS -b "$COOKIE_JAR" https://admin.jeeey.com/ > "$TMP_HTML"
BYTES=$(wc -c < "$TMP_HTML" | tr -d ' ')
log "Downloaded admin HTML ($BYTES bytes)"

# Extract sidebar links (basic heuristic)
grep -Eo '<a[^>]+href="/[^"]+"' "$TMP_HTML" 2>/dev/null | \
  sed -E 's/.*href="([^"]+)".*/\1/' | \
  grep -E '^/[^_]' | \
  grep -Ev '^/login|^/api|^/favicon|^/manifest|^/icons|^/opengraph' | \
  sed 's/#.*$//' | sed 's/[?].*$//' | \
  sort -u > "$OUT_FILE" || true

COUNT=$(wc -l < "$OUT_FILE" | tr -d ' ')
log "Found $COUNT candidate sidebar routes"

echo "# Admin sidebar routes (post-login)" > "$OUT_FILE.tmp"
date -u +"# Generated at %Y-%m-%dT%H:%M:%SZ" >> "$OUT_FILE.tmp"
echo >> "$OUT_FILE.tmp"

while IFS= read -r route; do
  [ -z "$route" ] && continue
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" "https://admin.jeeey.com$route") || CODE=000
  printf "%3s  %s\n" "$CODE" "$route" | sudo tee -a "$LOG_FILE" >/dev/null
  printf "%s\n" "$route" >> "$OUT_FILE.tmp"
done < "$OUT_FILE"

mv "$OUT_FILE.tmp" "$OUT_FILE"
log "Sidebar list written to $OUT_FILE"
echo "---" && cat "$OUT_FILE" | sed -n '1,200p'

