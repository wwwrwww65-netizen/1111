#!/usr/bin/env bash
set -euo pipefail

CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
DOMAIN_WEB="${DOMAIN_WEB:-jeeey.com}"
DOMAIN_ADMIN="${DOMAIN_ADMIN:-admin.jeeey.com}"
DOMAIN_API="${DOMAIN_API:-api.jeeey.com}"
DOMAIN_MWEB="${DOMAIN_MWEB:-m.jeeey.com}"

echo "[https] Ensuring certbot installed..."
export DEBIAN_FRONTEND=noninteractive
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y certbot python3-certbot-nginx
fi

# Open firewall if ufw is present
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

echo "[https] Issuing/renewing certificates for: $DOMAIN_WEB, $DOMAIN_ADMIN, $DOMAIN_API, $DOMAIN_MWEB"
if [ -n "$CERTBOT_EMAIL" ]; then
  certbot --nginx -n --agree-tos -m "$CERTBOT_EMAIL" \
    -d "$DOMAIN_WEB" -d "www.$DOMAIN_WEB" -d "$DOMAIN_ADMIN" -d "$DOMAIN_API" -d "$DOMAIN_MWEB" || true
else
  certbot --nginx -n --agree-tos --register-unsafely-without-email \
    -d "$DOMAIN_WEB" -d "www.$DOMAIN_WEB" -d "$DOMAIN_ADMIN" -d "$DOMAIN_API" -d "$DOMAIN_MWEB" || true
fi

echo "[https] Reloading Nginx"
nginx -t && systemctl reload nginx || systemctl restart nginx || true

echo "[https] Done."

