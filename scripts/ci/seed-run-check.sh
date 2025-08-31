#!/usr/bin/env bash
set -euo pipefail
echo "[seed-run-check] Seeding admin-only fixtures..."
pnpm --filter @repo/db db:seed:admin-only
echo "[seed-run-check] OK"

