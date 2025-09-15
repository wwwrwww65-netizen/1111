#!/usr/bin/env bash
set -euo pipefail

# Usage: deploy.sh /var/www/ecom
ROOT_DIR=${1:-/var/www/ecom}

echo "Deploying to $ROOT_DIR"
mkdir -p "$ROOT_DIR"
rsync -a --delete --exclude node_modules --exclude .git ./ "$ROOT_DIR"/

cd "$ROOT_DIR"
corepack enable || true
corepack prepare pnpm@9 --activate || true
pnpm install -r --no-frozen-lockfile

export NODE_ENV=production
pnpm --filter @repo/db db:deploy || true
pnpm --filter @repo/api build
pnpm --filter web build
pnpm --filter admin build

systemctl daemon-reload || true
systemctl restart ecom-api || true
systemctl restart ecom-web || true
systemctl restart ecom-admin || true

echo "Deploy completed."
