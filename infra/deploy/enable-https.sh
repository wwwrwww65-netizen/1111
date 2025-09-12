#!/usr/bin/env bash
set -euo pipefail

: "${CERTBOT_EMAIL:?CERTBOT_EMAIL required}"
: "${DOMAIN_WEB:=jeeey.com}"
: "${DOMAIN_ADMIN:=admin.jeeey.com}"
: "${DOMAIN_API:=api.jeeey.com}"

echo "[https] Ensuring certbot installed..."
export DEBIAN_FRONTEND=noninteractive
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y certbot python3-certbot-nginx
fi

echo "[https] Issuing/renewing certificates for: $DOMAIN_WEB, $DOMAIN_ADMIN, $DOMAIN_API"
certbot --nginx -n --agree-tos -m "$CERTBOT_EMAIL" \
  -d "$DOMAIN_WEB" -d "www.$DOMAIN_WEB" -d "$DOMAIN_ADMIN" -d "$DOMAIN_API" || true

echo "[https] Reloading Nginx"
nginx -t && systemctl reload nginx || systemctl restart nginx || true

echo "[https] Done."

