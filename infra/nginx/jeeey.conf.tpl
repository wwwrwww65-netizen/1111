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

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_pass http://127.0.0.1:4000;
  }
}

# Admin over HTTPS (Next.js 3001)
server {
  listen 443 ssl;
  server_name admin.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;
  http2 on;

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

  root /var/www/ecom/apps/mweb/dist;
  index index.html;

  # No-store for HTML, short cache for assets
  location = /index.html { add_header Cache-Control "no-store" always; try_files $uri /index.html; }
  location /assets/ { add_header Cache-Control "public, max-age=60, must-revalidate" always; try_files $uri $uri/ =404; }

  location / {
    add_header Cache-Control "no-store" always;
    try_files $uri $uri/ /index.html;
  }
}
