#!/usr/bin/env bash
set -euo pipefail

echo "[https] ensure-https: starting"

: "${PROJECT_DIR:=/var/www/ecom}"
: "${CERTBOT_EMAIL:=}"
: "${DOMAIN_WEB:=jeeey.com}"
: "${DOMAIN_ADMIN:=admin.jeeey.com}"
: "${DOMAIN_API:=api.jeeey.com}"

export DEBIAN_FRONTEND=noninteractive

echo "[https] Installing nginx if missing..."
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y nginx
fi

echo "[https] Writing nginx config (HTTP reverse proxies)..."
NGINX_CONF="/etc/nginx/sites-available/jeeey.conf"
if [ -f "$PROJECT_DIR/infra/deploy/nginx/jeeey.conf" ]; then
  cp -f "$PROJECT_DIR/infra/deploy/nginx/jeeey.conf" "$NGINX_CONF"
fi
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/jeeey.conf
nginx -t && systemctl enable nginx && systemctl restart nginx || true

# If no certbot email provided, skip HTTPS automation.
if [ -z "$CERTBOT_EMAIL" ]; then
  echo "[https] CERTBOT_EMAIL not set; skipping certificate issuance"
  exit 0
fi

echo "[https] Installing certbot if missing..."
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y certbot python3-certbot-nginx
fi

echo "[https] Attempting certificate issue/renewal via certbot for: $DOMAIN_WEB, $DOMAIN_ADMIN, $DOMAIN_API"
set +e
certbot --nginx -n --agree-tos -m "$CERTBOT_EMAIL" \
  -d "$DOMAIN_WEB" -d "www.$DOMAIN_WEB" -d "$DOMAIN_ADMIN" -d "$DOMAIN_API"
rc=$?
set -e
if [ $rc -ne 0 ]; then
  echo "[https] certbot returned non-zero ($rc); continuing (non-blocking)"
fi

echo "[https] Reloading nginx"
nginx -t && systemctl reload nginx || systemctl restart nginx || true

echo "[https] ensure-https: done"

