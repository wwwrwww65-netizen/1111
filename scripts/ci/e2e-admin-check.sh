#!/usr/bin/env bash
set -euo pipefail
echo "[e2e-admin-check] Running admin E2E smoke"
set -e
# Ensure test env and secrets
export NODE_ENV=test
export JWT_SECRET=secret_for_tests

# Start API in background on port 4000 for the smoke without touching DB
API_FORCE_LISTEN=1 API_RUN_ENSURE_SCHEMA=0 API_ALLOW_BOOTSTRAP=0 node packages/api/dist/index.js &
API_PID=$!
sleep 4

# Basic health checks only (no DB access)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health)
test "$STATUS" = "200"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/admin/health)
test "$STATUS" = "200"

kill $API_PID || true
echo "[e2e-admin-check] OK"

