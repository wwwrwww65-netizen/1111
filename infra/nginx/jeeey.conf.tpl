proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_next_upstream_tries 2;
map $http_user_agent $is_mobile {
  default 0;
  ~*(iphone|android|mobile|ipad|ipod) 1;
}

# HTTP (80) → HTTPS redirects for all hosts, keep ACME path open
server {
  listen 80;
  listen [::]:80;
  server_name jeeey.com www.jeeey.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 80;
  listen [::]:80;
  server_name admin.jeeey.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 80;
  listen [::]:80;
  server_name api.jeeey.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 80;
  listen [::]:80;
  server_name m.jeeey.com;
  location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; default_type text/plain; allow all; }
  location / { return 301 https://$host$request_uri; }
}

# HTTPS servers
server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name api.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/api.jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.jeeey.com/privkey.pem;

  # Increase body size for base64 uploads
  client_max_body_size 20m;

  # Unified CORS: hide upstream CORS headers and set our own (applies on errors too)
  add_header Access-Control-Allow-Origin $http_origin always;
  add_header Access-Control-Allow-Credentials "true" always;
  add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
  add_header Access-Control-Allow-Headers "Authorization,Content-Type,X-Shop-Client,X-Requested-With,Accept,Origin" always;
  add_header Access-Control-Max-Age 86400 always;

  # Handle CORS preflight
  if ($request_method = 'OPTIONS') {
    return 204;
  }

  # Serve uploaded media directly from disk with long cache
  location ^~ /uploads/ {
    alias /var/www/ecom/uploads/;
    types { }
    default_type application/octet-stream;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    try_files $uri =404;
  }

  location / {
    # Fast-path preflight with CORS headers (only on OPTIONS)
    if ($request_method = 'OPTIONS') {
      return 204;
    }
    # Avoid duplicate CORS from upstream
    proxy_hide_header Access-Control-Allow-Origin;
    proxy_hide_header Access-Control-Allow-Credentials;
    proxy_hide_header Access-Control-Allow-Methods;
    proxy_hide_header Access-Control-Allow-Headers;
    # Preserve Authorization header for upstream token reads
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_request_buffering off;
    proxy_read_timeout 120s;
    proxy_connect_timeout 30s;
    proxy_send_timeout 120s;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 64k;
    proxy_pass http://127.0.0.1:4000;
  }

  # WebSocket (socket.io)
  location /socket.io/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_pass http://127.0.0.1:4000;
  }
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name admin.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/admin.jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/admin.jeeey.com/privkey.pem;

  # Directly proxy admin REST to API to avoid app-layer proxy issues
  location ^~ /api/admin/ {
    client_max_body_size 20m;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_request_buffering off;
    proxy_read_timeout 300s;
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 64k;
    proxy_pass http://127.0.0.1:4000;
  }

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 120s;
    proxy_connect_timeout 30s;
    proxy_send_timeout 120s;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 64k;
    proxy_pass http://127.0.0.1:3001;
  }
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name jeeey.com www.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;

  if ($is_mobile) { return 302 https://m.jeeey.com$request_uri; }

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 120s;
    proxy_connect_timeout 30s;
    proxy_send_timeout 120s;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 64k;
    proxy_pass http://127.0.0.1:3000;
  }
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name m.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/m.jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/m.jeeey.com/privkey.pem;

  root /var/www/ecom/apps/mweb/dist;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
