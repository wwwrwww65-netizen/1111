#!/usr/bin/env bash
set -euo pipefail

log(){ echo "[fix-https] $*"; }
need(){ if [ -z "${!1:-}" ]; then echo "Missing required env: $1" >&2; exit 1; fi; }

need CERTBOT_EMAIL
: "${DOMAIN_WEB:=jeeey.com}"
: "${DOMAIN_ADMIN:=admin.jeeey.com}"
: "${DOMAIN_API:=api.jeeey.com}"

if [ "${EUID:-$(id -u)}" -ne 0 ]; then SUDO="sudo"; else SUDO=""; fi
WEBROOT_DIR="/var/www/letsencrypt"
export DEBIAN_FRONTEND=noninteractive

log "Installing nginx, ufw, certbot..."
$SUDO apt-get update -y
$SUDO apt-get install -y nginx ufw certbot python3-certbot-nginx
$SUDO mkdir -p "$WEBROOT_DIR" && $SUDO chown -R www-data:www-data "$WEBROOT_DIR" || true

log "Opening firewall ports 80/443 via UFW..."
$SUDO ufw allow OpenSSH >/dev/null 2>&1 || true
$SUDO ufw allow 'Nginx Full' >/dev/null 2>&1 || { $SUDO ufw allow 80/tcp >/dev/null 2>&1; $SUDO ufw allow 443/tcp >/dev/null 2>&1; }
$SUDO ufw --force enable >/dev/null 2>&1 || true

CONF_DIR="/etc/nginx/sites-available"; ENABLED_DIR="/etc/nginx/sites-enabled"
if [ ! -d "$CONF_DIR" ]; then CONF_DIR="/etc/nginx/conf.d"; ENABLED_DIR="$CONF_DIR"; fi
log "Using nginx conf dir: $CONF_DIR (enabled: $ENABLED_DIR)"

# Clean up conflicting default/legacy configs to avoid duplicate server_name
log "Removing conflicting nginx configs if present"
$SUDO rm -f /etc/nginx/sites-enabled/default || true
$SUDO rm -f /etc/nginx/conf.d/default.conf || true
$SUDO rm -f /etc/nginx/conf.d/jeeey.conf || true

HTTP_CONF="$CONF_DIR/jeeey.conf"
log "Writing HTTP config with ACME webroot: $HTTP_CONF"
$SUDO tee "$HTTP_CONF" >/dev/null <<'CFG'
server { listen 80; listen [::]:80; server_name DOMAIN_WEB_PLACEHOLDER www.DOMAIN_WEB_PLACEHOLDER; location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; } location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; } }
server { listen 80; listen [::]:80; server_name DOMAIN_ADMIN_PLACEHOLDER; location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; } location / { proxy_pass http://127.0.0.1:3001; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; } }
server { listen 80; listen [::]:80; server_name DOMAIN_API_PLACEHOLDER; location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; } location / { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; } }
CFG
# Replace placeholders with actual env values safely
$SUDO sed -i "s/DOMAIN_WEB_PLACEHOLDER/$DOMAIN_WEB/g; s/DOMAIN_ADMIN_PLACEHOLDER/$DOMAIN_ADMIN/g; s/DOMAIN_API_PLACEHOLDER/$DOMAIN_API/g" "$HTTP_CONF"

if [ "$ENABLED_DIR" != "$CONF_DIR" ]; then $SUDO ln -sf "$HTTP_CONF" "$ENABLED_DIR/jeeey.conf"; fi

$SUDO nginx -t
$SUDO systemctl enable nginx || true
$SUDO systemctl restart nginx

issue_cert(){ local domain="$1"; shift; log "Issuing/renewing certificate (webroot) for: $domain $*"; set +e; certbot certonly --webroot -w "$WEBROOT_DIR" -n --agree-tos -m "$CERTBOT_EMAIL" -d "$domain" "$@"; local rc=$?; set -e; if [ $rc -ne 0 ]; then log "certbot for $domain returned non-zero ($rc), continuing"; fi; }

issue_cert "$DOMAIN_WEB" -d "www.$DOMAIN_WEB"
issue_cert "$DOMAIN_ADMIN"
issue_cert "$DOMAIN_API"

SSL_CONF="$CONF_DIR/jeeey-ssl.conf"
WEB_CERT_DIR="/etc/letsencrypt/live/$DOMAIN_WEB"
ADMIN_CERT_DIR="/etc/letsencrypt/live/$DOMAIN_ADMIN"
API_CERT_DIR="/etc/letsencrypt/live/$DOMAIN_API"

log "Writing explicit SSL server blocks: $SSL_CONF"
$SUDO tee "$SSL_CONF" >/dev/null <<'CFG'
server { listen 443 ssl; listen [::]:443 ssl; server_name DOMAIN_WEB_PLACEHOLDER www.DOMAIN_WEB_PLACEHOLDER; ssl_certificate WEB_CERT_DIR_PLACEHOLDER/fullchain.pem; ssl_certificate_key WEB_CERT_DIR_PLACEHOLDER/privkey.pem; include /etc/letsencrypt/options-ssl-nginx.conf; ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; } }
server { listen 443 ssl; listen [::]:443 ssl; server_name DOMAIN_ADMIN_PLACEHOLDER; ssl_certificate ADMIN_CERT_DIR_PLACEHOLDER/fullchain.pem; ssl_certificate_key ADMIN_CERT_DIR_PLACEHOLDER/privkey.pem; include /etc/letsencrypt/options-ssl-nginx.conf; ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; location / { proxy_pass http://127.0.0.1:3001; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; } }
server { listen 443 ssl; listen [::]:443 ssl; server_name DOMAIN_API_PLACEHOLDER; ssl_certificate API_CERT_DIR_PLACEHOLDER/fullchain.pem; ssl_certificate_key API_CERT_DIR_PLACEHOLDER/privkey.pem; include /etc/letsencrypt/options-ssl-nginx.conf; ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; location / { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; } }
CFG
$SUDO sed -i "s/DOMAIN_WEB_PLACEHOLDER/$DOMAIN_WEB/g; s/DOMAIN_ADMIN_PLACEHOLDER/$DOMAIN_ADMIN/g; s/DOMAIN_API_PLACEHOLDER/$DOMAIN_API/g; s#WEB_CERT_DIR_PLACEHOLDER#$WEB_CERT_DIR#g; s#ADMIN_CERT_DIR_PLACEHOLDER#$ADMIN_CERT_DIR#g; s#API_CERT_DIR_PLACEHOLDER#$API_CERT_DIR#g" "$SSL_CONF"

if [ "$ENABLED_DIR" != "$CONF_DIR" ]; then $SUDO ln -sf "$SSL_CONF" "$ENABLED_DIR/jeeey-ssl.conf"; fi

# Ensure no conflicting conf remains that could override SSL mapping
$SUDO rm -f /etc/nginx/conf.d/jeeey.conf || true

log "Reloading nginx with SSL blocks..."
$SUDO nginx -t
$SUDO systemctl reload nginx || $SUDO systemctl restart nginx

log "UFW status:"
$SUDO ufw status verbose | sed -n '1,200p' | cat || true
log "Listening sockets (80/443):"
ss -ltnp 2>/dev/null | egrep ':80|:443' | cat || true
log "Cert dirs:"
ls -1 /etc/letsencrypt/live/ 2>/dev/null | cat || true

# Proactive validations: ensure upstreams are listening and admin serves content
log "Proactive: verify PM2 services and ports"
pm2 list || true
ss -ltnp | egrep ':3000|:3001|:4000' | cat || true

# Retry curl with local resolve to avoid DNS issues
ADMIN_DOMAIN="$DOMAIN_ADMIN"
log "Proactive: curl admin over HTTPS (local resolve to 127.0.0.1)"
for i in 1 2 3; do
  curl -Is --max-time 10 --resolve "$ADMIN_DOMAIN:443:127.0.0.1" "https://$ADMIN_DOMAIN/" | sed -n '1,3p' | cat && break || sleep 2;
done
for i in 1 2 3; do
  curl -Is --max-time 10 --resolve "$ADMIN_DOMAIN:443:127.0.0.1" "https://$ADMIN_DOMAIN/finance/revenues" | sed -n '1,3p' | cat && break || sleep 2;
done

log "Quick curl checks:"
( curl -Is http://$DOMAIN_WEB | head -n 1 || true ) | cat
( curl -Is https://$DOMAIN_WEB | head -n 1 || true ) | cat
( curl -Is http://$DOMAIN_ADMIN | head -n 1 || true ) | cat
( curl -Is https://$DOMAIN_ADMIN | head -n 1 || true ) | cat
( curl -Is http://$DOMAIN_API | head -n 1 || true ) | cat
( curl -Is https://$DOMAIN_API | head -n 1 || true ) | cat

log "Done."

