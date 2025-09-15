Production deployment guide (Hostinger VPS Ubuntu 25.04)

1) Prereqs on server
- apt update && apt install -y curl git ufw nginx postgresql
- Node 20 + pnpm: curl -fsSL https://deb.nodesource.com/setup_20.x | bash -; apt install -y nodejs; corepack enable; corepack prepare pnpm@9 --activate
- Certbot: snap install --classic certbot; ln -s /snap/bin/certbot /usr/bin/certbot

2) Environment variables
- Copy .env.example files from infra/env/ to actual services:
  - API: JWT_SECRET, DATABASE_URL, DIRECT_URL, COOKIE_DOMAIN, MAINTENANCE_SECRET, API_RUN_ENSURE_SCHEMA=1 (first run only)
  - Web/Admin: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_TRPC_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_ADMIN_URL

3) Build & DB
- pnpm install -r
- pnpm --filter @repo/db db:deploy
- pnpm --filter @repo/api build
- pnpm --filter @repo/web build
- pnpm --filter @repo/admin build

4) Systemd
- Place unit files from infra/systemd/ and run: systemctl daemon-reload; systemctl enable --now ecom-api ecom-web ecom-admin

5) Nginx + TLS
- Copy infra/nginx/*.conf to /etc/nginx/sites-available/ and symlink to sites-enabled
- systemctl reload nginx
- certbot --nginx -d jeeey.com -d www.jeeey.com -d admin.jeeey.com -d api.jeeey.com

6) Firewall
- ufw allow OpenSSH; ufw allow 80; ufw allow 443; ufw enable

Notes
- Remove API_RUN_ENSURE_SCHEMA after first boot, optionally set API_ALLOW_BOOTSTRAP=1 for initial admin creation then remove.
