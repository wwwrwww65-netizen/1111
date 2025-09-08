#!/usr/bin/env bash
set -euo pipefail

# Inputs via env
: "${PROJECT_DIR:?PROJECT_DIR required}"
INSTALL_POSTGRES="${INSTALL_POSTGRES:-0}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
DOMAIN_WEB="${DOMAIN_WEB:-jeeey.com}"
DOMAIN_ADMIN="${DOMAIN_ADMIN:-admin.jeeey.com}"
DOMAIN_API="${DOMAIN_API:-api.jeeey.com}"

echo "[setup] Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y | cat
apt-get upgrade -y | cat

echo "[setup] Installing base packages..."
apt-get install -y curl ca-certificates gnupg ufw git nginx python3-certbot-nginx build-essential | cat

echo "[setup] Installing Node.js 20 and pnpm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - | cat
apt-get install -y nodejs | cat
corepack enable || true
corepack prepare pnpm@8.15.4 --activate

echo "[setup] Installing PM2 globally..."
npm i -g pm2@5 | cat

if [[ "$INSTALL_POSTGRES" == "1" ]]; then
  echo "[setup] Installing PostgreSQL..."
  apt-get install -y postgresql postgresql-contrib | cat
  systemctl enable postgresql
  systemctl start postgresql
fi

echo "[setup] Creating project directory at $PROJECT_DIR ..."
mkdir -p "$PROJECT_DIR"
chown -R "$USER":"$USER" "$PROJECT_DIR" || true

echo "[setup] Configuring UFW firewall..."
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
yes | ufw enable || true

echo "[setup] Installing SSL certificates if email provided..."
if [[ -n "$CERTBOT_EMAIL" ]]; then
  certbot --nginx -n --agree-tos -m "$CERTBOT_EMAIL" -d "$DOMAIN_WEB" -d "$DOMAIN_ADMIN" -d "$DOMAIN_API" || true
fi

echo "[setup] Installing Nginx vhost for jeeey domains..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled || true
if [[ -f "$PROJECT_DIR/infra/deploy/nginx/jeeey.conf" ]]; then
  cp -f "$PROJECT_DIR/infra/deploy/nginx/jeeey.conf" /etc/nginx/sites-available/jeeey.conf
  ln -sf /etc/nginx/sites-available/jeeey.conf /etc/nginx/sites-enabled/jeeey.conf
  nginx -t && systemctl reload nginx || systemctl restart nginx || true
else
  echo "[setup] Warning: nginx config not found at $PROJECT_DIR/infra/deploy/nginx/jeeey.conf"
fi

echo "[setup] Placing PM2 ecosystem config..."
mkdir -p "$PROJECT_DIR/infra/deploy"
cp -f "$PROJECT_DIR/infra/deploy/ecosystem.config.js" /etc/pm2.ecosystem.config.js || true

echo "[setup] Disabling legacy systemd web service if present..."
if systemctl list-unit-files | grep -q '^ecom-web.service'; then
  systemctl stop ecom-web || true
  systemctl disable ecom-web || true
  systemctl daemon-reload || true
  echo "[setup] Disabled legacy ecom-web.service"
fi

echo "[setup] Done."

