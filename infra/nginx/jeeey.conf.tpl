proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_next_upstream_tries 2;
map $http_user_agent $is_mobile {
  default 0;
  ~*(iphone|android|mobile|ipad|ipod) 1;
}

# Proxy cache for image thumbnails (safe to define at http-level)
proxy_cache_path /var/cache/nginx/thumbs levels=1:2 keys_zone=thumbs_cache:50m inactive=30d max_size=10g;
# Micro-cache for public JSON GET endpoints (short TTL)
proxy_cache_path /var/cache/nginx/api_micro levels=1:2 keys_zone=api_micro:50m inactive=2m max_size=1g;

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
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name api.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/api.jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.jeeey.com/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/api.jeeey.com/chain.pem;

  # Increase body size for base64 uploads
  client_max_body_size 20m;
  # Compression for JSON/JS/CSS/SVG
  gzip on;
  gzip_comp_level 5;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml text/javascript;
  # Brotli disabled (module not available on some servers) — rely on gzip

  # Unified CORS: hide upstream CORS headers and set our own (applies on errors too)
  add_header Access-Control-Allow-Origin $http_origin always;
  add_header Access-Control-Allow-Credentials "true" always;
  add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
  add_header Access-Control-Allow-Headers "Authorization,Content-Type,X-Shop-Client,X-Requested-With,Accept,Origin,X-Session-Id" always;
  add_header Access-Control-Max-Age 86400 always;

  # Handle CORS preflight
  if ($request_method = 'OPTIONS') {
    return 204;
  }

  # Micro-cache public shop endpoints (only GET) to reduce upstream load
  location ~* ^/api/(products|categories|product|tabs) {
    proxy_hide_header Set-Cookie;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_pass http://127.0.0.1:4000;
    proxy_cache api_micro;
    proxy_cache_methods GET HEAD;
    proxy_cache_valid 200 1m;
    proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
    add_header X-Cache $upstream_cache_status;
  }

  # Serve uploaded media directly from disk with long cache
  location ^~ /uploads/ {
    alias /var/www/ecom/uploads/;
    types { }
    default_type application/octet-stream;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    try_files $uri =404;
  }

  # Cache derived thumbnails aggressively
  location ^~ /api/media/thumb {
    add_header Cache-Control "public, max-age=2592000, immutable" always;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass http://127.0.0.1:4000;
  }

  # Restrict direct access to admin API from non-admin origins
  location ^~ /api/admin/ {
    # Allow CORS preflight first
    if ($request_method = 'OPTIONS') { return 204; }
    # Only allow calls originating from admin.jeeey.com
    if ($http_origin !~* ^https://admin\.jeeey\.com$) { return 403; }
    proxy_hide_header Access-Control-Allow-Origin;
    proxy_hide_header Access-Control-Allow-Credentials;
    proxy_hide_header Access-Control-Allow-Methods;
    proxy_hide_header Access-Control-Allow-Headers;
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
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name admin.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/admin.jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/admin.jeeey.com/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/admin.jeeey.com/chain.pem;
  # Compression
  gzip on;
  gzip_comp_level 5;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml text/javascript;
  # Brotli disabled (module not available on some servers) — rely on gzip

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
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name jeeey.com www.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/jeeey.com/chain.pem;
  # Compression
  gzip on;
  gzip_comp_level 5;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml text/javascript;
  # Brotli disabled (module not available on some servers) — rely on gzip

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

  # Same-origin CDN path for desktop site too
  location ^~ /i {
    add_header Cache-Control "public, max-age=2592000, immutable" always;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_pass http://127.0.0.1:4000/api/media/thumb$is_args$args;
    proxy_cache thumbs_cache;
    proxy_cache_valid 200 301 302 30d;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_hide_header Set-Cookie;
  }
  location ^~ /uploads/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_pass http://127.0.0.1:4000$request_uri;
    proxy_hide_header Set-Cookie;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name m.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/m.jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/m.jeeey.com/privkey.pem;
  ssl_trusted_certificate /etc/letsencrypt/live/m.jeeey.com/chain.pem;

  root /var/www/ecom/apps/mweb/dist;
  index index.html;

  # OCSP stapling
  ssl_stapling on;
  ssl_stapling_verify on;
  resolver 1.1.1.1 1.0.0.1 valid=300s ipv6=on;
  resolver_timeout 5s;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;

  # Content Security Policy
  add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https: data: https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://unpkg.com https://maps.googleapis.com https://maps.gstatic.com; connect-src 'self' https://api.jeeey.com https://maps.googleapis.com https://maps.gstatic.com https://nominatim.openstreetmap.org https://www.facebook.com https://graph.facebook.com https://connect.facebook.net https://unpkg.com; worker-src 'self' blob:; frame-src https://www.facebook.com; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests" always;

  # Compression
  gzip on;
  gzip_comp_level 5;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/json application/javascript application/xml image/svg+xml text/javascript;
  # Brotli disabled (module not available on some servers) — rely on gzip

  # API proxy for cart endpoints (same-origin for mweb)
  # Preserve auth/cookies and upgrade headers; map /api/shop/cart/* => /api/cart/* upstream
  location ^~ /api/cart/ {
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Cookie $http_cookie;
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
    # Preserve original URI under /api/cart/
    proxy_pass http://127.0.0.1:4000;
  }
  location = /api/cart {
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Cookie $http_cookie;
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
    proxy_pass http://127.0.0.1:4000$request_uri;
  }
  location ^~ /api/shop/cart/ {
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Cookie $http_cookie;
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
    # Rewrite prefix /api/shop/cart/ -> /api/cart/ upstream
    proxy_pass http://127.0.0.1:4000/api/cart/;
  }
  location = /api/shop/cart {
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Cookie $http_cookie;
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
    proxy_pass http://127.0.0.1:4000/api/cart;
  }

  # Generic same-origin proxy to API for public endpoints
  location ^~ /api/ {
    proxy_set_header Authorization $http_authorization;
    proxy_set_header Cookie $http_cookie;
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

  # Same-origin CDN path: proxy image thumbnails to API with proxy_cache
  location ^~ /i {
    # Ensure strong cache on client
    add_header Cache-Control "public, max-age=2592000, immutable" always;
    # Upstream proxying
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    # Strip only the prefix; pass query string to /api/media/thumb
    proxy_pass http://127.0.0.1:4000/api/media/thumb$is_args$args;
    # Enable Nginx cache for derived images
    proxy_cache thumbs_cache;
    proxy_cache_lock on;
    proxy_cache_lock_timeout 10s;
    proxy_cache_valid 200 301 302 30d;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_hide_header Set-Cookie;
  }

  # Same-origin access to uploads with long cache
  location ^~ /uploads/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_pass http://127.0.0.1:4000$request_uri;
    proxy_hide_header Set-Cookie;
  }

  # Service Worker
  location = /sw.js {
    default_type application/javascript;
    add_header Service-Worker-Allowed "/" always;
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    add_header X-Content-Type-Options "nosniff" always;
    try_files /sw.js =404;
  }

  # Web App Manifest
  location = /manifest.webmanifest {
    default_type application/manifest+json;
    add_header Cache-Control "public, max-age=3600" always;
    try_files /manifest.webmanifest =404;
  }

  # Long cache for static assets
  location ~* \.(?:js|css|svg|woff2?|png|jpg|jpeg|webp|avif)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
    try_files $uri =404;
  }

  # SSR for Product/Category Pages (SEO): Proxy to API (4000)
  location ~ ^/(p|c|product|category)/ {
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto https;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
     proxy_pass http://127.0.0.1:4000;
  }


  # HTML no-store
  location = /index.html {
    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src 'self' https: data: https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://unpkg.com https://maps.googleapis.com https://maps.gstatic.com; connect-src 'self' https://api.jeeey.com https://maps.googleapis.com https://maps.gstatic.com https://nominatim.openstreetmap.org https://www.facebook.com https://graph.facebook.com https://connect.facebook.net https://unpkg.com; worker-src 'self' blob:; frame-src https://www.facebook.com; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests" always;
    add_header Cache-Control "no-store, must-revalidate" always;
  }

  location / { try_files $uri $uri/ /index.html; }
}
