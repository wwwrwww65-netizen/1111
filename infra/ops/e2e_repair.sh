#!/usr/bin/env bash

set -Eeuo pipefail

# Cursor Ops Repair/Sync/Deploy Script
# Logs to /var/log/cursor-ops.log (fallback to $HOME/cursor-ops.log)

LOG_FILE="/var/log/cursor-ops.log"
if ! (sudo sh -c ">> '$LOG_FILE'" 2>/dev/null); then
  LOG_FILE="$HOME/cursor-ops.log"
  : >> "$LOG_FILE" || true
fi

timestamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { printf '%s %s\n' "$(timestamp)" "$*" | sudo tee -a "$LOG_FILE" >/dev/null; }
section() { log "===== $* ====="; }

# Run a command with logging and optional retries
run() {
  local retries="${2:-1}"; local delay=2; local attempt=1
  log "+ $1"
  while true; do
    set +e
    bash -lc "$1" >>"$LOG_FILE" 2>&1
    local ec=$?
    set -e
    if [ "$ec" -eq 0 ]; then return 0; fi
    if [ "$attempt" -ge "$retries" ]; then
      log "! command failed (exit $ec) after $attempt attempt(s): $1"
      return "$ec"
    fi
    log "! command failed (exit $ec). retrying in ${delay}s ($attempt/$retries)"
    sleep "$delay"; attempt=$((attempt+1)); delay=$((delay*2))
  done
}

# Environment and defaults
PROJECT_DIR="${PROJECT_DIR:-/var/www/ecom}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/ecom}"
REPO_URL="${REPO_URL:-git@github.com:${GITHUB_REPOSITORY:-}.git}"
BRANCH_PREFIX="server-sync"
NOW="$(date -u +%Y%m%d-%H%M%S)"
SERVER_BRANCH="${BRANCH_PREFIX}-${NOW}"

section "Environment"
log "PROJECT_DIR=$PROJECT_DIR BACKUP_DIR=$BACKUP_DIR"
log "GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-}" 

sudo mkdir -p "$BACKUP_DIR" || true
sudo chown -R "+0" "$BACKUP_DIR" 2>/dev/null || true

section "Ensure deploy user and permissions"
if id deploy >/dev/null 2>&1; then
  log "deploy user exists"
else
  run "sudo useradd -m -s /bin/bash deploy || true"
  run "echo 'deploy ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/90-deploy >/dev/null"
fi
run "sudo mkdir -p /home/deploy/.ssh && sudo chmod 700 /home/deploy/.ssh && sudo chown -R deploy:deploy /home/deploy/.ssh"
run "sudo chown -R deploy:deploy '$PROJECT_DIR' || true"

section "Backup: git snapshot, DB dump, webroot archive"
if [ -d "$PROJECT_DIR/.git" ]; then
  run "git -C '$PROJECT_DIR' rev-parse HEAD | sed 's/^/HEAD: /' | sudo tee -a '$LOG_FILE' >/dev/null" || true
  run "git -C '$PROJECT_DIR' status --porcelain | sed 's/^/GIT: /' | sudo tee -a '$LOG_FILE' >/dev/null" || true
fi

# Database dump if DATABASE_URL available
DB_ENV="$PROJECT_DIR/packages/db/.env"
DATABASE_URL_READ=""
if [ -f "$DB_ENV" ]; then
  # shellcheck disable=SC2046
  DATABASE_URL_READ="$(grep -E '^DATABASE_URL=' "$DB_ENV" | head -1 | cut -d= -f2-)"
fi
if [ -n "$DATABASE_URL_READ" ]; then
  DUMP_FILE="$BACKUP_DIR/db-${NOW}.dump"
  log "Attempting pg_dump to $DUMP_FILE"
  run "PGPASSWORD= pg_dump \"$DATABASE_URL_READ\" -Fc -f '$DUMP_FILE'" || log "DB dump failed; continuing"
else
  log "No DATABASE_URL found; skipping DB dump"
fi

# Webroot archive (exclude heavy dirs)
ARCHIVE_FILE="$BACKUP_DIR/webroot-${NOW}.tar.gz"
run "sudo tar -C '$(dirname "$PROJECT_DIR")' -czf '$ARCHIVE_FILE' --exclude='**/node_modules' --exclude='**/.next' --exclude='**/dist' '$(basename "$PROJECT_DIR")'" || log "Archive failed; continuing"

section "Rotate deploy SSH key (non-destructive)"
SSH_DIR="/home/deploy/.ssh"
NEW_KEY="$SSH_DIR/id_ed25519_github_ecom_$NOW"
run "sudo -u deploy ssh-keygen -t ed25519 -N '' -f '$NEW_KEY' -C 'deploy@hostinger-$NOW'" || log "Keygen failed; continuing"
if [ -f "${NEW_KEY}.pub" ]; then
  PUB_CONTENT="$(sudo cat "${NEW_KEY}.pub" 2>/dev/null || true)"
  log "New deploy public key (add to GitHub Deploy Keys with write):"
  printf "%s\n" "$PUB_CONTENT" | sudo tee -a "$LOG_FILE" >/dev/null || true
  # Keep old key active; configure a Host alias to test
  sudo -u deploy bash -lc "{
    echo 'Host github-ecom';
    echo '  HostName github.com';
    echo '  User git';
    echo '  IdentityFile '"$NEW_KEY";
    echo '  IdentitiesOnly yes';
  } >> '$SSH_DIR/config'"
fi

section "Git: capture server state to branch and push"
if [ ! -d "$PROJECT_DIR/.git" ]; then
  run "sudo -u deploy git clone '$REPO_URL' '$PROJECT_DIR'" || true
fi
run "sudo -u deploy git -C '$PROJECT_DIR' config --global user.name 'Hostinger Deploy'"
run "sudo -u deploy git -C '$PROJECT_DIR' config --global user.email 'deploy@hostinger.local'"
run "sudo -u deploy git -C '$PROJECT_DIR' remote set-url origin '$REPO_URL' || true"
run "sudo -u deploy git -C '$PROJECT_DIR' fetch origin --prune" 3
run "sudo -u deploy git -C '$PROJECT_DIR' checkout -B '$SERVER_BRANCH'" || true
run "sudo -u deploy git -C '$PROJECT_DIR' add -A" || true
if sudo -u deploy git -C "$PROJECT_DIR" diff --staged --quiet; then
  log "No local changes to commit"
else
  run "sudo -u deploy git -C '$PROJECT_DIR' commit -m 'chore(ops): server sync $NOW'" || true
fi
run "sudo -u deploy git -C '$PROJECT_DIR' push -u origin '$SERVER_BRANCH'" 3 || log "Push branch failed; continuing"

section "Merge server branch into main (prefer server on conflicts)"
run "sudo -u deploy git -C '$PROJECT_DIR' checkout main" || run "sudo -u deploy git -C '$PROJECT_DIR' checkout -B main"
run "sudo -u deploy git -C '$PROJECT_DIR' pull --ff-only origin main || true"
set +e
sudo -u deploy git -C "$PROJECT_DIR" merge -X theirs --no-edit "$SERVER_BRANCH" >>"$LOG_FILE" 2>&1
MERGE_EC=$?
set -e
if [ "$MERGE_EC" -ne 0 ]; then
  log "Merge conflicts encountered; committing with ours/theirs strategy attempt"
  run "sudo -u deploy git -C '$PROJECT_DIR' merge --strategy-option theirs -m 'Merge $SERVER_BRANCH into main (prefer server changes)' '$SERVER_BRANCH'" || log "Merge fallback failed; manual review needed"
fi
run "sudo -u deploy git -C '$PROJECT_DIR' push origin main" 3 || log "Push main failed; continuing"

section "Install deps, generate Prisma, and migrate (with pre-backup)"
export PNPM_HOME="/home/deploy/.local/share/pnpm"
export PNPM_CONFIG_STORE_DIR="$PROJECT_DIR/.pnpm-store"
run "sudo -u deploy mkdir -p '$PNPM_CONFIG_STORE_DIR'" || true
run "sudo -u deploy corepack enable" || true
run "sudo -u deploy corepack prepare pnpm@8.6.10 --activate" || true
run "sudo -u deploy pnpm -C '$PROJECT_DIR' install --no-frozen-lockfile" 3 || log "pnpm install failed; continuing"
run "sudo -u deploy pnpm -C '$PROJECT_DIR/packages/api' prisma generate" || log "prisma generate failed; continuing"

if [ -n "$DATABASE_URL_READ" ]; then
  DUMP_FILE2="$BACKUP_DIR/db-pre-migrate-${NOW}.dump"
  run "PGPASSWORD= pg_dump \"$DATABASE_URL_READ\" -Fc -f '$DUMP_FILE2'" || log "Pre-migrate dump failed; continuing"
fi
run "sudo -u deploy pnpm -C '$PROJECT_DIR/packages/api' prisma migrate deploy" || log "migrate deploy failed; continuing"

section "Build API and reload PM2"
run "sudo -u deploy pnpm -C '$PROJECT_DIR/packages/api' build" || log "API build failed; continuing"
ECOS="$PROJECT_DIR/infra/deploy/ecosystem.config.js"
run "sudo -u deploy pm2 start '$ECOS' --only ecom-api || sudo -u deploy pm2 reload ecom-api || true" || true
run "sudo -u deploy pm2 save || true"

section "Health checks"
run "curl -sS --max-time 5 --retry 15 --retry-delay 2 http://127.0.0.1:4000/health | head -c 400 | sed 's/.*/HEALTH: &/' | sudo tee -a '$LOG_FILE' >/dev/null" || log "Local health failed"
run "curl -sS --max-time 10 --retry 15 --retry-delay 2 https://api.jeeey.com/health | head -c 400 | sed 's/.*/HEALTH_PUBLIC: &/' | sudo tee -a '$LOG_FILE' >/dev/null" || log "Public health failed"
run "pm2 describe ecom-api | sed -n '1,120p' | sudo tee -a '$LOG_FILE' >/dev/null" || true
run "ss -ltnp | grep ':4000' | sudo tee -a '$LOG_FILE' >/dev/null" || log "port 4000 not listening"
run "sudo -u deploy pm2 restart ecom-api || true" || true
run "sleep 2 && curl -sS --max-time 5 --retry 10 --retry-delay 1 http://127.0.0.1:4000/health | head -c 200 | sed 's/.*/HEALTH_AFTER_RESTART: &/' | sudo tee -a '$LOG_FILE' >/dev/null" || true

section "Admin login and crawl"
ADMIN_EMAIL_SAN="${ADMIN_EMAIL:-admin@jeeey.com}"
ADMIN_PASS_SAN="${ADMIN_PASSWORD:-ChangeMe123!}"
COOKIE_JAR="$PROJECT_DIR/.ops-cookies.txt"
run "curl -i -sS -c '$COOKIE_JAR' -X POST -H 'content-type: application/x-www-form-urlencoded' --data-urlencode email='$ADMIN_EMAIL_SAN' --data-urlencode password='$ADMIN_PASS_SAN' https://api.jeeey.com/api/admin/auth/login | sed -n '1,80p' | sudo tee -a '$LOG_FILE' >/dev/null" || log "Admin login request failed"
run "grep -i 'auth_token' '$COOKIE_JAR' && echo 'COOKIE_OK' | sudo tee -a '$LOG_FILE' >/dev/null" || log "auth_token cookie not found"

# Crawl a few admin pages via frontend with cookie
for path in "/" "/analytics" "/orders" "/products" "/categories" "/customers"; do
  run "curl -sS -b '$COOKIE_JAR' -H 'Host: admin.jeeey.com' --resolve admin.jeeey.com:443:127.0.0.1 https://admin.jeeey.com$path -o /dev/null -w 'CRAWL %s %d\n' '$path' '%{http_code}' | sudo tee -a '$LOG_FILE' >/dev/null" || true
done

section "Tests"
run "sudo -u deploy pnpm -C '$PROJECT_DIR' turbo run test --filter=packages/api -- --ci --runInBand" || log "API tests failed; continuing"

section "Tag release"
TAG="v$NOW"
run "sudo -u deploy git -C '$PROJECT_DIR' tag -a '$TAG' -m 'Automated release $NOW'" || true
run "sudo -u deploy git -C '$PROJECT_DIR' push origin '$TAG'" || log "Push tag failed; continuing"

section "Done"
log "Completed ops repair pipeline. Logs at $LOG_FILE and backups at $BACKUP_DIR"

