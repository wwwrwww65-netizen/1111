#!/usr/bin/env bash
set -euo pipefail

echo "[https] ensure-https: starting"

: "${PROJECT_DIR:=/var/www/ecom}"
: "${CERTBOT_EMAIL:=}"
: "${DOMAIN_WEB:=jeeey.com}"
: "${DOMAIN_ADMIN:=admin.jeeey.com}"
: "${DOMAIN_API:=api.jeeey.com}"
: "${DOMAIN_MWEB:=m.${DOMAIN_WEB}}"

export DEBIAN_FRONTEND=noninteractive

echo "[https] Opening firewall ports 80/443 (HTTP/HTTPS) if needed..."
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  # Prefer nginx profile if available, else open ports directly
  ufw allow 'Nginx Full' >/dev/null 2>&1 || { ufw allow 80/tcp >/dev/null 2>&1; ufw allow 443/tcp >/dev/null 2>&1; }
  ufw --force enable >/dev/null 2>&1 || true
elif command -v apt-get >/dev/null 2>&1; then
  # Ubuntu/Debian without ufw installed
  apt-get update -y && apt-get install -y ufw || true
  if command -v ufw >/dev/null 2>&1; then
    ufw allow OpenSSH >/dev/null 2>&1 || true
    ufw allow 'Nginx Full' >/dev/null 2>&1 || { ufw allow 80/tcp >/dev/null 2>&1; ufw allow 443/tcp >/dev/null 2>&1; }
    ufw --force enable >/dev/null 2>&1 || true
  fi
fi

echo "[https] Installing nginx if missing..."
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y nginx
fi

echo "[https] Determine nginx config directory..."
CONF_DIR="/etc/nginx/sites-available"
ENABLED_DIR="/etc/nginx/sites-enabled"
if [ ! -d "$CONF_DIR" ]; then
  CONF_DIR="/etc/nginx/conf.d"; ENABLED_DIR="$CONF_DIR"
fi

echo "[https] Ensure ACME webroot exists"
mkdir -p /var/www/letsencrypt || true

echo "[https] Remove duplicate/default nginx configs if any (to avoid conflicts)"
rm -f /etc/nginx/conf.d/jeeey.conf /etc/nginx/conf.d/default.conf /etc/nginx/sites-enabled/default 2>/dev/null || true

echo "[https] Writing nginx config (HTTP reverse proxies)..."
NGINX_CONF="$CONF_DIR/jeeey.conf"
if [ -f "$PROJECT_DIR/infra/deploy/nginx/jeeey.conf" ]; then
  cp -f "$PROJECT_DIR/infra/deploy/nginx/jeeey.conf" "$NGINX_CONF"
fi
ln -sf "$NGINX_CONF" "$ENABLED_DIR/jeeey.conf"
nginx -t && systemctl enable nginx && systemctl restart nginx || true

# If no certbot email provided, skip only certificate issuance but continue to write SSL config
if [ -z "$CERTBOT_EMAIL" ]; then
  echo "[https] CERTBOT_EMAIL not set; skipping certificate issuance (will still write SSL config)"
else
  echo "[https] Installing certbot if missing..."
  if ! command -v certbot >/dev/null 2>&1; then
    apt-get update -y && apt-get install -y certbot python3-certbot-nginx
  fi
fi

issue_cert() {
  local domain="$1"; shift
  echo "[https] Issuing/renewing certificate for $domain"
  set +e
  if [ -n "$CERTBOT_EMAIL" ]; then
    certbot --nginx -n --redirect --agree-tos -m "$CERTBOT_EMAIL" -d "$domain" "$@"
  else
    echo "[https] (skip) certbot issuance for $domain because CERTBOT_EMAIL empty"
  fi
  local rc=$?
  set -e
  if [ $rc -ne 0 ]; then
    echo "[https] certbot for $domain returned non-zero ($rc); continuing (non-blocking)"
  fi
}

# Obtain/renew per-domain so plugin maps the right server blocks
issue_cert "$DOMAIN_WEB" -d "www.$DOMAIN_WEB"
issue_cert "$DOMAIN_ADMIN"
issue_cert "$DOMAIN_API"
issue_cert "$DOMAIN_MWEB"

echo "[https] Reloading nginx"
nginx -t && systemctl reload nginx || systemctl restart nginx || true

# Ensure explicit SSL server blocks proxy to correct upstreams
echo "[https] Writing explicit SSL server blocks for web/admin/api/mweb (if needed)"
SSL_CONF="$CONF_DIR/jeeey-ssl.conf"
WEB_CERT_DIR="/etc/letsencrypt/live/$DOMAIN_WEB"
ADMIN_CERT_DIR="/etc/letsencrypt/live/$DOMAIN_ADMIN"
API_CERT_DIR="/etc/letsencrypt/live/$DOMAIN_API"
MWEB_CERT_DIR="/etc/letsencrypt/live/$DOMAIN_MWEB"

# If jeeey.conf already contains SSL listeners, skip generating jeeey-ssl.conf to avoid duplicates
if [ -f "$ENABLED_DIR/jeeey.conf" ] && grep -q "listen 443" "$ENABLED_DIR/jeeey.conf"; then
  echo "[https] Detected existing SSL listeners in jeeey.conf; skipping jeeey-ssl.conf generation"
else
  # Expand DOMAIN_* and CERT_DIR vars, but escape Nginx $ vars
  cat > "$SSL_CONF" <<EOF
# Auto-generated SSL upstream mapping
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_WEB} www.${DOMAIN_WEB};
    ssl_certificate ${WEB_CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${WEB_CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_ADMIN};
    ssl_certificate ${ADMIN_CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${ADMIN_CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header 'Cache-Control' 'private, no-cache, no-store, max-age=0, must-revalidate';
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_API};
    ssl_certificate ${API_CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${API_CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        add_header 'Access-Control-Allow-Origin' "https://admin.${DOMAIN_WEB}" always;
        add_header 'Vary' 'Origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization,Origin, X-Requested-With, Content-Type, Accept' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD' always;
        proxy_cookie_domain ~^.*$ .${DOMAIN_WEB};
        if (\$request_method = 'OPTIONS') {
            add_header 'Content-Length' 0;
            add_header 'Content-Type' 'text/plain';
            return 204;
        }
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN_MWEB};
    ssl_certificate ${MWEB_CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${MWEB_CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    root ${PROJECT_DIR}/apps/mweb/dist;
    index index.html;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Robots-Tag "noindex, nofollow" always;
    location /assets/ { add_header Cache-Control "public, max-age=60, must-revalidate" always; try_files \$uri \$uri/ =404; }
    location / { add_header Cache-Control "no-store" always; try_files \$uri \$uri/ /index.html; }
}
EOF
  ln -sf "$SSL_CONF" "$ENABLED_DIR/jeeey-ssl.conf"

  echo "[https] Testing and reloading nginx after SSL blocks"
  nginx -t && systemctl reload nginx || systemctl restart nginx || true
fi

# Show quick diagnostics
echo "[https] Firewall (ufw) status (if available):"
ufw status verbose 2>/dev/null | sed -n '1,200p' | cat || true
echo "[https] Listening sockets for :80 and :443:"
ss -ltnp 2>/dev/null | egrep ':80|:443' | cat || true

echo "[https] ensure-https: done"

