#!/usr/bin/env bash
set -Eeuo pipefail
ADMIN_HOST="${ADMIN_HOST:-admin.jeeey.com}"
API_HOST="${API_HOST:-api.jeeey.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
RESOLVE_IP="${RESOLVE_IP:-127.0.0.1}"
REPORT_TXT="${REPORT_TXT:-/srv/ecom/.ops-admin-design-report.txt}"
REPORT_JSON="${REPORT_JSON:-/srv/ecom/.ops-admin-design-report.json}"
LOG_FILE="${LOG_FILE:-/var/log/admin-design-audit.log}"
COOKIE_JAR="$(mktemp)"
TMP_DIR="$(mktemp -d)"
mkdir -p "$(dirname "$REPORT_TXT")" || true
timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { printf "%s %s\n" "$(timestamp)" "$*" | tee -a "$LOG_FILE" >/dev/null; }
head_code() { curl -sSI --resolve "$1:443:$RESOLVE_IP" "https://$1$2" | sed -n '1p' | awk '{print $2}'; }
fetch_page() { local host="$1" route="$2" out_html="$3"; curl -sS -b "$COOKIE_JAR" --resolve "$host:443:$RESOLVE_IP" "https://$host$route" -o "$out_html"; curl -sSI -b "$COOKIE_JAR" --resolve "$host:443:$RESOLVE_IP" "https://$host$route" | sed -n '1p' | awk '{print $2}'; }
extract_assets() { grep -Eo "/_next/static/[^\" ]+\.(css|js)" "$1" 2>/dev/null | sort -u || true; }
log "Login to API"; curl -i -sS -c "$COOKIE_JAR" -X POST --resolve "$API_HOST:443:$RESOLVE_IP" -H 'content-type: application/x-www-form-urlencoded' --data-urlencode email="$ADMIN_EMAIL" --data-urlencode password="$ADMIN_PASSWORD" "https://$API_HOST/api/admin/auth/login" | sed -n '1,10p' >>"$LOG_FILE" 2>&1 || true
grep -qi 'auth_token' "$COOKIE_JAR" || log 'WARN: no auth_token cookie'
log "Collect sidebar routes"; ROOT_HTML="$TMP_DIR/root.html"; curl -sS -b "$COOKIE_JAR" --resolve "$ADMIN_HOST:443:$RESOLVE_IP" "https://$ADMIN_HOST/" -o "$ROOT_HTML" || true
ROUTES_FILE="$TMP_DIR/routes.txt"
grep -Eo '<a[^>]+href="/[^"]+"' "$ROOT_HTML" 2>/dev/null | sed -E 's/.*href="([^"]+)".*/\1/' | grep -E '^/[^_]' | grep -Ev '^/login|^/api|^/favicon|^/manifest|^/icons|^/opengraph' | sed 's/[?#].*$//' | sort -u > "$ROUTES_FILE" || true
if [ ! -s "$ROUTES_FILE" ]; then BUILD_DIR="/srv/ecom/apps/admin/.next/server/app"; if [ -d "$BUILD_DIR" ]; then find "$BUILD_DIR" -maxdepth 3 -type f -name '*.html' | sed -E "s#^$BUILD_DIR##" | sed -E 's/\/_not-found\.html$//; s/\/index\.html$//; s/\.html$//' | sed 's/^$/\//' | sed -E 's#^#/#' | sort -u | grep -E '^/[^_]' > "$ROUTES_FILE" || true; fi; fi
[ -s "$ROUTES_FILE" ] || echo '/' > "$ROUTES_FILE"
log "Begin per-route checks"; : > "$REPORT_TXT"; echo '{ "host": '"\"$ADMIN_HOST\""', "generatedAt": '"\"$(timestamp)\""', "pages": [' > "$REPORT_JSON"
FIRST_JSON=1; TOTAL=0; BAD_PAGES=0; BAD_ASSETS=0
while IFS= read -r route; do [ -z "$route" ] && continue; TOTAL=$((TOTAL+1)); PAGE_HTML="$TMP_DIR/page_${TOTAL}.html"; code="$(fetch_page "$ADMIN_HOST" "$route" "$PAGE_HTML" || true)"; [ -z "${code:-}" ] && code="000"; mapfile -t assets < <(extract_assets "$PAGE_HTML"); page_bad=0; asset_reports=()
  for a in "${assets[@]}"; do acode="$(head_code "$ADMIN_HOST" "$a" || true)"; [ -z "${acode:-}" ] && acode="000"; if [[ "$acode" != "200" && "$acode" != "204" && "$acode" != "304" ]]; then page_bad=1; BAD_ASSETS=$((BAD_ASSETS+1)); fi; asset_reports+=("{\"url\":\"$a\",\"status\":$acode}"); done
  if [[ "$code" != "200" && "$code" != "204" && "$code" != "304" ]]; then page_bad=1; fi; [ "$page_bad" -eq 1 ] && BAD_PAGES=$((BAD_PAGES+1))
  { echo "ROUTE: $route"; echo "  PAGE: $code"; if [ "${#assets[@]}" -gt 0 ]; then echo "  ASSETS (${#assets[@]}):"; for a in "${assets[@]}"; do acode="$(head_code "$ADMIN_HOST" "$a" || true)"; [ -z "${acode:-}" ] && acode="000"; echo "    $acode  $a"; done; else echo "  ASSETS: none-detected"; fi; echo; } >> "$REPORT_TXT"
  assets_json="$(IFS=,; echo "${asset_reports[*]:-}")"; [ -z "$assets_json" ] && assets_json=""; [ $FIRST_JSON -eq 1 ] && FIRST_JSON=0 || echo "," >> "$REPORT_JSON"; echo -n "{ \"route\":\"$route\",\"status\":$code,\"assets\":[${assets_json}] }" >> "$REPORT_JSON"
done < "$ROUTES_FILE"
echo "] , \"summary\": { \"total\": $TOTAL, \"badPages\": $BAD_PAGES, \"badAssets\": $BAD_ASSETS } }" >> "$REPORT_JSON"
log "Done. Total=$TOTAL BadPages=$BAD_PAGES BadAssets=$BAD_ASSETS"; log "TXT report: $REPORT_TXT"; log "JSON report: $REPORT_JSON"; echo "SUMMARY:"; echo "  Total pages: $TOTAL"; echo "  Pages with errors: $BAD_PAGES"; echo "  Asset fetch errors: $BAD_ASSETS"; echo "Reports:"; echo "  $REPORT_TXT"; echo "  $REPORT_JSON"; [ "$BAD_PAGES" -eq 0 ] && [ "$BAD_ASSETS" -eq 0 ] && exit 0 || exit 2

