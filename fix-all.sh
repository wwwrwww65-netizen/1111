#!/usr/bin/env bash
# One-shot fixer for Hostinger VPS (Nginx + SSL + Repo sync + Build + PM2 + Verifications)

set -euo pipefail
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export DEBIAN_FRONTEND=noninteractive
export PS4='+ [$(date -u "+%H:%M:%S")] '
set -x

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }
fail() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR: $*" >&2; exit 1; }
trap 'fail "line $LINENO: command failed"' ERR

# -------- Config (edit if needed) --------
PROJ="/var/www/ecom"
REPO="https://github.com/wwwrwww65-netizen/1111.git"
DOMAIN_WEB="jeeey.com"
DOMAIN_ADMIN="admin.jeeey.com"
DOMAIN_API="api.jeeey.com"
CERTBOT_EMAIL="jeeey@jeeey.com"
PNPM_STORE="$PROJ/.pnpm-store"
ACME_ROOT="/var/www/letsencrypt"

# API/Admin/Web env (as provided)
API_DATABASE_URL="postgresql://ecom_user:jeeey_db_pass_2025@127.0.0.1:5432/ecom_db?schema=public"
API_JWT_SECRET="5d6f5945e3a82d1df5df874f9f6463f932f9ec9a3131984114df07bcaf6f1f8f4c69e047168a5159542d476df9415a7dfe9f7a523bd1981f113cac1ec6e043a0"
API_COOKIE_DOMAIN=".jeeey.com"
API_CORS_ALLOW_ORIGINS="https://admin.jeeey.com,https://jeeey.com"
API_NEXT_PUBLIC_ADMIN_URL="https://admin.jeeey.com"
API_NEXT_PUBLIC_APP_URL="https://jeeey.com"
API_MAINTENANCE_SECRET="jeeey_maint_7f3c0b5e1fd542a9"
ADMIN_NEXT_PUBLIC_API_BASE_URL="https://api.jeeey.com"
ADMIN_NEXT_PUBLIC_APP_URL="https://admin.jeeey.com"
WEB_NEXT_PUBLIC_API_BASE_URL="https://api.jeeey.com"
WEB_NEXT_PUBLIC_APP_URL="https://jeeey.com"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASS="admin123"

# -------- System prep --------
log "[sys] Installing base packages"
apt-get update -y
apt-get install -y nginx ufw certbot python3-certbot-nginx git curl ca-certificates coreutils jq lsof

if ! command -v node >/dev/null 2>&1; then
  log "[node] Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# -------- Firewall --------
log "[ufw] Open 22/80/443"
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable
ufw status verbose | sed -n '1,120p' | cat

# -------- Nginx config --------
log "[nginx] Configure"
rm -f /etc/nginx/conf.d/default.conf /etc/nginx/sites-enabled/default /etc/nginx/conf.d/jeeey.conf || true
install -d -m 755 "$ACME_ROOT"
chown -R www-data:www-data "$ACME_ROOT"

HTTP_CONF="/etc/nginx/sites-available/jeeey.conf"
SSL_CONF="/etc/nginx/sites-available/jeeey-ssl.conf"
ln -sf "$HTTP_CONF" /etc/nginx/sites-enabled/jeeey.conf
ln -sf "$SSL_CONF" /etc/nginx/sites-enabled/jeeey-ssl.conf

D='$'

tee "$HTTP_CONF" >/dev/null <<CFG
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_WEB} www.${DOMAIN_WEB};
  root ${ACME_ROOT};

  location /.well-known/acme-challenge/ {
    allow all;
    default_type "text/plain";
  }

  location / {
    return 301 https://${D}host${D}request_uri;
  }
}
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_ADMIN};
  root ${ACME_ROOT};

  location /.well-known/acme-challenge/ {
    allow all;
    default_type "text/plain";
  }

  location / {
    return 301 https://${D}host${D}request_uri;
  }
}
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN_API};
  root ${ACME_ROOT};

  location /.well-known/acme-challenge/ {
    allow all;
    default_type "text/plain";
  }

  location / {
    return 301 https://${D}host${D}request_uri;
  }
}
CFG

# Certificates (webroot)
log "[certbot] webroot issue/renew"
certbot certonly --webroot -w "$ACME_ROOT" -n --agree-tos -m "$CERTBOT_EMAIL" -d "$DOMAIN_WEB" -d "www.$DOMAIN_WEB" || true
certbot certonly --webroot -w "$ACME_ROOT" -n --agree-tos -m "$CERTBOT_EMAIL" -d "$DOMAIN_ADMIN" || true
certbot certonly --webroot -w "$ACME_ROOT" -n --agree-tos -m "$CERTBOT_EMAIL" -d "$DOMAIN_API" || true

WEB_CERT="/etc/letsencrypt/live/${DOMAIN_WEB}"
ADMIN_CERT="/etc/letsencrypt/live/${DOMAIN_ADMIN}"
API_CERT="/etc/letsencrypt/live/${DOMAIN_API}"

tee "$SSL_CONF" >/dev/null <<CFG
# Web (jeeey.com)
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN_WEB} www.${DOMAIN_WEB};

  ssl_certificate ${WEB_CERT}/fullchain.pem;
  ssl_certificate_key ${WEB_CERT}/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host ${D}host;
    proxy_set_header X-Forwarded-For ${D}proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}

# Admin (admin.jeeey.com)
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN_ADMIN};

  ssl_certificate ${ADMIN_CERT}/fullchain.pem;
  ssl_certificate_key ${ADMIN_CERT}/privkey.pem;

  # avoid stale cache
  add_header Cache-Control "no-store, no-cache, must-revalidate" always;
  add_header Pragma "no-cache" always;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host ${D}host;
    proxy_set_header X-Forwarded-For ${D}proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade ${D}http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
  }
}

# API (api.jeeey.com)
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN_API};

  ssl_certificate ${API_CERT}/fullchain.pem;
  ssl_certificate_key ${API_CERT}/privkey.pem;

  # ensure cookie for parent domain
  proxy_cookie_domain ~.* .${DOMAIN_WEB};

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host ${D}host;
    proxy_set_header X-Forwarded-For ${D}proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}
CFG

nginx -t
systemctl enable nginx
systemctl reload nginx

# -------- Repo sync --------
log "[sync] Code -> $PROJ"
if [ -d "$PROJ/.git" ]; then
  git config --global --add safe.directory "$PROJ" || true
  cd "$PROJ"
  git remote set-url origin "$REPO"
  git fetch --all --prune
  git reset --hard origin/main
else
  install -d -m 755 "$PROJ"
  git clone "$REPO" "$PROJ"
  git config --global --add safe.directory "$PROJ" || true
fi

# -------- .env files --------
log "[env] Writing API/Admin/Web .env"
install -d -m 755 "$PROJ/packages/api" "$PROJ/apps/admin" "$PROJ/apps/web"

cat > "$PROJ/packages/api/.env" <<EOF
DATABASE_URL=$API_DATABASE_URL
JWT_SECRET=$API_JWT_SECRET
COOKIE_DOMAIN=$API_COOKIE_DOMAIN
CORS_ALLOW_ORIGINS=$API_CORS_ALLOW_ORIGINS
NEXT_PUBLIC_ADMIN_URL=$API_NEXT_PUBLIC_ADMIN_URL
NEXT_PUBLIC_APP_URL=$API_NEXT_PUBLIC_APP_URL
MAINTENANCE_SECRET=$API_MAINTENANCE_SECRET
EOF

cat > "$PROJ/apps/admin/.env" <<EOF
NEXT_PUBLIC_API_BASE_URL=$ADMIN_NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_APP_URL=$ADMIN_NEXT_PUBLIC_APP_URL
EOF

cat > "$PROJ/apps/web/.env" <<EOF
NEXT_PUBLIC_API_BASE_URL=$WEB_NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_APP_URL=$WEB_NEXT_PUBLIC_APP_URL
EOF

# -------- pnpm + deps --------
log "[deps] Installing workspace deps via pnpm"
corepack enable || true
corepack prepare pnpm@9 --activate || true
cd "$PROJ"
pnpm config set store-dir "$PNPM_STORE" --location project || true
export CI=1
pnpm install --force --no-frozen-lockfile --store-dir "$PNPM_STORE"

# -------- DB + build --------
log "[db] prisma generate & push"
set -a; . "$PROJ/packages/api/.env"; set +a
: "${DATABASE_URL:?missing}"
: "${JWT_SECRET:?missing}"

pnpm --filter @repo/db db:generate || true
pnpm --filter @repo/db db:push || true

log "[build] api/admin/web"
pnpm --filter @repo/api build || true
rm -rf "$PROJ/apps/admin/.next" || true
pnpm --filter admin build
pnpm --filter web build || true

# -------- PM2 (start/restart) --------
log "[pm2] restart processes"
# Ensure ports free
lsof -i :3001 -t 2>/dev/null | xargs -r kill -9 || true

# API
cd "$PROJ/packages/api"
PORT=4000 COOKIE_DOMAIN="$API_COOKIE_DOMAIN" \
  pm2 delete ecom-api || true
PORT=4000 COOKIE_DOMAIN="$API_COOKIE_DOMAIN" \
  pm2 start pnpm --name ecom-api -- start

# Admin
cd "$PROJ/apps/admin"
PORT=3001 NEXT_PUBLIC_API_BASE_URL="$ADMIN_NEXT_PUBLIC_API_BASE_URL" \
  pm2 delete ecom-admin || true
PORT=3001 NEXT_PUBLIC_API_BASE_URL="$ADMIN_NEXT_PUBLIC_API_BASE_URL" \
  pm2 start pnpm --name ecom-admin -- start

# Web
cd "$PROJ/apps/web"
PORT=3000 NEXT_PUBLIC_API_BASE_URL="$WEB_NEXT_PUBLIC_API_BASE_URL" \
  pm2 delete ecom-web || true
PORT=3000 NEXT_PUBLIC_API_BASE_URL="$WEB_NEXT_PUBLIC_API_BASE_URL" \
  pm2 start pnpm --name ecom-web -- start

pm2 save || true
sleep 2
pm2 status | sed -n '1,200p' | cat

# -------- Verifications --------
log "[verify] Ports"
ss -ltnp | egrep ':3000|:3001|:4000|:80 |:443 ' | cat || true

log "[verify] API health"
curl -fsSI http://127.0.0.1:4000/health | head -n1

log "[verify] Login + protected pages"
TMP="$(mktemp -d)"; CJ="$TMP/c.jar"
curl -fsS -i -H 'Content-Type: application/json' -H "Origin: https://${DOMAIN_ADMIN}" -c "$CJ" \
  --data "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  "https://${DOMAIN_API}/api/admin/auth/login" | sed -n '1,20p'

for P in /notifications /finance/revenues /loyalty/points /loyalty/points-log; do
  printf "[GET %s] " "$P"
  curl -fsS -L -b "$CJ" -o /dev/null -w "%{http_code}\n" "https://${DOMAIN_ADMIN}$P"
done

log "[verify] Built routes exist"
if [ -d "$PROJ/apps/admin/.next/server/app" ]; then
  find "$PROJ/apps/admin/.next/server/app/finance" -maxdepth 2 -type f | sort | sed -n '1,200p' | cat || true
  find "$PROJ/apps/admin/.next/server/app/loyalty" -maxdepth 2 -type f | sort | sed -n '1,200p' | cat || true
  find "$PROJ/apps/admin/.next/server/app/notifications" -maxdepth 2 -type f | sort | sed -n '1,200p' | cat || true
fi

log "[verify] Sidebar links after login"
HTML="$TMP/admin.html"
curl -fsS -L -b "$CJ" "https://${DOMAIN_ADMIN}/" -o "$HTML"
grep -E '/notifications|/finance/revenues|/loyalty/points' "$HTML" || true
# Optional: check Arabic labels (may be rendered client-side)
grep -E 'الإشعارات|المالية|الولاء' "$HTML" || true

rm -rf "$TMP"

log "[done] All steps attempted."

