map $http_upgrade $connection_upgrade { default upgrade; '' close; }

# Redirect HTTP to HTTPS for all hosts
server { listen 80; server_name jeeey.com www.jeeey.com; return 301 https://$host$request_uri; }
server { listen 80; server_name admin.jeeey.com; return 301 https://$host$request_uri; }
server { listen 80; server_name api.jeeey.com; return 301 https://$host$request_uri; }

# API over HTTPS
server {
  listen 443 ssl http2;
  server_name api.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_pass http://127.0.0.1:4000;
  }
}

# Admin over HTTPS (Next.js 3001)
server {
  listen 443 ssl http2;
  server_name admin.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_pass http://127.0.0.1:3001;
  }
}

# Web over HTTPS (Next.js 3000)
server {
  listen 443 ssl http2;
  server_name jeeey.com www.jeeey.com;
  ssl_certificate /etc/letsencrypt/live/jeeey.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/jeeey.com/privkey.pem;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_pass http://127.0.0.1:3000;
  }
}
