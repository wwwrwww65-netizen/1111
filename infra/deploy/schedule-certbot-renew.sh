#!/usr/bin/env bash
set -euo pipefail

echo "[certbot] Installing systemd service and timer for renew..."

SERVICE_FILE="/etc/systemd/system/certbot-renew.service"
TIMER_FILE="/etc/systemd/system/certbot-renew.timer"

cat > "$SERVICE_FILE" <<'UNIT'
[Unit]
Description=Certbot renew and Nginx reload
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "nginx -t && systemctl reload nginx || systemctl restart nginx"

[Install]
WantedBy=multi-user.target
UNIT

cat > "$TIMER_FILE" <<'UNIT'
[Unit]
Description=Daily certbot renew timer

[Timer]
OnCalendar=*-*-* 03:00:00
RandomizedDelaySec=1800
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now certbot-renew.timer

echo "[certbot] Timer status:"
systemctl status certbot-renew.timer --no-pager || true

echo "[certbot] Done."


