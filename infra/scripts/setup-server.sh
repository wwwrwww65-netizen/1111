#!/usr/bin/env bash
set -euo pipefail

# Ubuntu 25.04 server setup for Jeeey stack

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ufw nginx postgresql

# Node 20 + pnpm
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
corepack enable || true
corepack prepare pnpm@9 --activate || true

# Certbot
if ! command -v certbot >/dev/null 2>&1; then
  snap install --classic certbot || true
  ln -sf /snap/bin/certbot /usr/bin/certbot || true
fi

# Firewall
ufw allow OpenSSH || true
ufw allow 80 || true
ufw allow 443 || true
yes | ufw enable || true

echo "Server setup complete."
