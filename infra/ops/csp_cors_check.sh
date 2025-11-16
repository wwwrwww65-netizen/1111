#!/usr/bin/env bash
set -euo pipefail

HOST_MWEB="${HOST_MWEB:-https://m.jeeey.com}"
HOST_API="${HOST_API:-https://api.jeeey.com}"
HOST_ADMIN="${HOST_ADMIN:-https://admin.jeeey.com}"

echo "[check] CSP headers (mweb)"
curl -sI "$HOST_MWEB" | grep -i '^content-security-policy' || echo "CSP header missing on mweb"

echo "[check] SW/manifest cache headers (mweb)"
curl -sI "$HOST_MWEB/sw.js" | grep -i '^cache-control'
curl -sI "$HOST_MWEB/manifest.webmanifest" | grep -i '^cache-control'

echo "[check] CORS (API)"
curl -sI -H "Origin: $HOST_MWEB" "$HOST_API/api/products?limit=1" | grep -Ei 'access-control-allow-origin|access-control-allow-credentials'

echo "[check] Admin REST CORS restricted"
curl -sI -H "Origin: $HOST_MWEB" "$HOST_API/api/admin/users" | head -n 1
*** End Patch

