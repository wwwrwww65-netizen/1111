#!/usr/bin/env bash
set -euo pipefail
echo "[migration-run-check] Applying Prisma schema..."
pnpm --filter @repo/db db:push
echo "[migration-run-check] OK"

