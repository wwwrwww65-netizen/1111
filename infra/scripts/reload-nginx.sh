#!/usr/bin/env bash
set -euo pipefail

# Usage: ./infra/scripts/reload-nginx.sh /etc/nginx/sites-available/jeeey.conf
TARGET_PATH="${1:-/etc/nginx/sites-available/jeeey.conf}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "[nginx] writing config to ${TARGET_PATH}"
sudo cp "${ROOT_DIR}/infra/deploy/nginx/jeeey.conf" "${TARGET_PATH}"
if [ -d /etc/nginx/sites-enabled ]; then
  sudo ln -sf "${TARGET_PATH}" /etc/nginx/sites-enabled/jeeey.conf
fi
echo "[nginx] testing config"
sudo nginx -t
echo "[nginx] reloading"
sudo systemctl reload nginx || sudo nginx -s reload
echo "[nginx] done"


