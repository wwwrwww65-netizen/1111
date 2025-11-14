#!/usr/bin/env bash
set -euo pipefail

SIZE_GB="${1:-2}"
SWAPFILE="/swapfile"

echo "[swap] Target swap: ${SIZE_GB}G"
if [ -n "$(swapon --show --noheadings || true)" ]; then
  echo "[swap] Swap already active; skipping."
  exit 0
fi

if [ ! -f "$SWAPFILE" ]; then
  echo "[swap] Creating swapfile at $SWAPFILE"
  fallocate -l "${SIZE_GB}G" "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1G count="$SIZE_GB"
  chmod 600 "$SWAPFILE"
  mkswap "$SWAPFILE"
fi

echo "[swap] Enabling swap"
swapon "$SWAPFILE"

if ! grep -q "^$SWAPFILE" /etc/fstab; then
  echo "[swap] Persisting to /etc/fstab"
  printf '%s none swap sw 0 0\n' "$SWAPFILE" >> /etc/fstab
fi

echo "[swap] Current:"
swapon --show || true
free -h || true

echo "[swap] Done."


