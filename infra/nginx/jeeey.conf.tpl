map $http_upgrade $connection_upgrade { default upgrade; '' close; }
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_next_upstream_tries 2;
map $http_user_agent $is_mobile {
  default 0;
  ~*(iphone|android|mobile|ipad|ipod) 1;
}

# Redirect HTTP to HTTPS for all hosts
server { listen 80; server_name jeeey.com www.jeeey.com; return 301 https://$host$request_uri; }
server { listen 80; server_name admin.jeeey.com; return 301 https://$host$request_uri; }
server { listen 80; server_name api.jeeey.com; return 301 https://$host$request_uri; }
server { listen 80; server_name m.jeeey.com; return 301 https://$host$request_uri; }

# API over HTTPS
server {
  listen 443 ssl;
  server_name api.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;
  http2 on;

  # CORS headers for all responses (including errors)
  set $cors_origin "";
  if ($http_origin ~* "^https://(admin\\.jeeey\\.com|m\\.jeeey\\.com|jeeey\\.com|www\\.jeeey\\.com)$") { set $cors_origin $http_origin; }
  add_header Access-Control-Allow-Origin $cors_origin always;
  add_header Access-Control-Allow-Credentials "true" always;
  add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
  add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;

  # Prevent duplicate CORS headers from upstream
  proxy_hide_header Access-Control-Allow-Origin;
  proxy_hide_header Access-Control-Allow-Credentials;
  proxy_hide_header Access-Control-Allow-Headers;
  proxy_hide_header Access-Control-Allow-Methods;

  # WebSocket (Socket.IO) endpoint
  location /socket.io/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 70s;
    proxy_send_timeout 70s;
    proxy_buffering off;
    proxy_pass http://127.0.0.1:4000;
  }

  location / {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_pass http://127.0.0.1:4000;
    if ($request_method = OPTIONS) { return 204; }
  }
}

# Admin over HTTPS (Next.js 3001)
server {
  listen 443 ssl;
  server_name admin.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;
  http2 on;

  # Let Next.js handle /api/admin proxying internally to avoid upstream 502
  location /api/admin/ {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    add_header Cache-Control "no-store" always;
    proxy_pass http://127.0.0.1:3001;
  }

  # Serve Next.js static assets directly if present
  # With next start, static assets are served by the app itself; proxy everything

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    add_header Cache-Control "no-store" always;
    proxy_pass http://127.0.0.1:3001;
  }
}

# Web over HTTPS (Next.js 3000)
server {
  listen 443 ssl;
  server_name jeeey.com www.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;
  http2 on;

  # Redirect mobile devices to m.jeeey.com
  if ($is_mobile) {
    return 302 https://m.jeeey.com$request_uri;
  }

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_pass http://127.0.0.1:3000;
  }
}

# Mobile Web over HTTPS (static build via Vite)
server {
  listen 443 ssl;
  server_name m.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;
  http2 on;

  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
  root /var/www/ecom/apps/mweb/dist;
  index index.html;

  add_header X-Robots-Tag "noindex, nofollow" always;

  # Short cache for assets, SPA fallback to index.html
  location /assets/ { add_header Cache-Control "public, max-age=60, must-revalidate" always; try_files $uri $uri/ =404; }

  location / {
    add_header Cache-Control "no-store" always;
    try_files $uri $uri/ /index.html;
  }
}
