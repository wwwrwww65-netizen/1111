#!/usr/bin/env bash
set -euo pipefail
echo "[e2e-admin-check] Running admin E2E smoke"
set -e
# Ensure test env and secrets
export NODE_ENV=test
export JWT_SECRET=secret_for_tests

# Start API in background on port 4000 for the smoke (ts-node-dev is heavy; assume built or simple node run if available)
node packages/api/dist/index.js &
API_PID=$!
sleep 4

# Prepare a fake admin JWT (insecure for CI smoke) using api's node_modules resolution
TOKEN=$(cd packages/api && node -e "console.log(require('jsonwebtoken').sign({userId:'test-admin',email:'admin@example.com',role:'ADMIN'}, process.env.JWT_SECRET))")

# Inventory adjust should 401 without token
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/admin/inventory/list)
test "$STATUS" = "401"

# With token should 200 (after seed)
STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}" http://localhost:4000/api/admin/inventory/list)
test "$STATUS" = "200"

kill $API_PID || true
echo "[e2e-admin-check] OK"

