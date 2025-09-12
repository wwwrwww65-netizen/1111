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

echo "[setup] Skipping SSL issuance during setup (handled later in enable-https.sh)"

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

echo "[setup] Writing /etc/nginx/conf.d/jeeey.conf (HTTP only)..."
cat >/etc/nginx/conf.d/jeeey.conf <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_WEB} www.${DOMAIN_WEB};
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_ADMIN};
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_API};
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
# Prevent duplicate server_name conflicts by disabling sites-enabled template
rm -f /etc/nginx/sites-enabled/jeeey || rm -f /etc/nginx/sites-enabled/jeeey.conf || true
nginx -t && systemctl reload nginx || systemctl restart nginx || true

echo "[setup] Done."

