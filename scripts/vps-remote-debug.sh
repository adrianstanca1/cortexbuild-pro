#!/usr/bin/env bash
set -euo pipefail

# Remote VPS debug helper for CortexBuild deployments.
# Usage:
#   VPS_HOST=1.2.3.4 VPS_USER=root ./scripts/vps-remote-debug.sh
#   VPS_HOST=1.2.3.4 VPS_USER=ubuntu VPS_SSH_KEY=~/.ssh/id_rsa ./scripts/vps-remote-debug.sh
# Optional:
#   APP_DIR=/root/cortexbuild_pro COMPOSE_FILE=docker-compose.yml

VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
VPS_SSH_KEY="${VPS_SSH_KEY:-}"
APP_DIR="${APP_DIR:-/root/cortexbuild_pro}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

if [[ -z "$VPS_HOST" ]]; then
  echo "❌ VPS_HOST is required. Example: VPS_HOST=72.62.132.43 VPS_USER=root $0"
  exit 1
fi

SSH_OPTS=("-p" "$VPS_PORT" "-o" "BatchMode=yes" "-o" "ConnectTimeout=10")
if [[ -n "$VPS_SSH_KEY" ]]; then
  SSH_OPTS+=("-i" "$VPS_SSH_KEY")
fi

remote() {
  ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "$@"
}

echo "==> Checking SSH connectivity to $VPS_USER@$VPS_HOST:$VPS_PORT"
if ! remote "echo connected" >/dev/null 2>&1; then
  echo "❌ SSH connection failed. Verify VPS_HOST/VPS_USER/VPS_PORT/VPS_SSH_KEY and key installation in ~/.ssh/authorized_keys."
  exit 2
fi
echo "✅ SSH connection OK"

echo
echo "==> System summary"
remote 'set -e; uname -a; echo; uptime; echo; df -h /; echo; free -h || true'

echo
echo "==> Docker status"
remote 'set -e; docker --version; echo; docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true'

echo
echo "==> App directory check: $APP_DIR"
remote "set -e; if [ -d '$APP_DIR' ]; then echo '✅ Found app dir'; else echo '❌ Missing app dir: $APP_DIR'; exit 3; fi"

echo
echo "==> Git state"
remote "set -e; cd '$APP_DIR'; git rev-parse --abbrev-ref HEAD; git rev-parse --short HEAD; git status --short"

echo
echo "==> Compose config validation"
remote "set -e; cd '$APP_DIR'; if [ -f '$COMPOSE_FILE' ]; then docker compose -f '$COMPOSE_FILE' config >/dev/null && echo '✅ compose config valid'; else echo '⚠️ compose file not found: $COMPOSE_FILE'; fi"

echo
echo "==> Recent container logs (last 120 lines per container)"
remote "set -e; cd '$APP_DIR'; if [ -f '$COMPOSE_FILE' ]; then for c in \$(docker compose -f '$COMPOSE_FILE' ps -q); do n=\$(docker inspect --format='{{.Name}}' \"\$c\" | sed 's#^/##'); echo; echo '--- logs:' \$n '---'; docker logs --tail 120 \"\$c\" 2>&1 || true; done; else echo '⚠️ skipped: compose file not found'; fi"

echo
echo "==> HTTP health probes"
remote "set -e; for url in http://127.0.0.1:3000 http://127.0.0.1:4000/health http://127.0.0.1:8080/health; do echo \"Probing \$url\"; curl -fsS --max-time 5 \"\$url\" >/dev/null && echo '✅ OK' || echo '⚠️ no response'; done"

echo
echo "==> Done. If issues were found, re-run with the same env vars and capture output for targeted fixes."
