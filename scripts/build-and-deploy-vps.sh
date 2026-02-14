#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
Build and deploy CortexBuild to a VPS.

Required environment variables:
  VPS_HOST            Target VPS host or IP.

Optional environment variables:
  VPS_USER            SSH user (default: deploy)
  VPS_PORT            SSH port (default: 22)
  VPS_SSH_KEY         Path to SSH private key
  VPS_FRONTEND_PATH   Remote frontend path (default: /home/deploy/apps/cortexbuild/frontend/dist/)
  VPS_BACKEND_PATH    Remote backend path (default: /home/deploy/apps/cortexbuild/server/dist/)
  VPS_PM2_PROCESS     PM2 process name (default: cortexbuild-backend)

Examples:
  VPS_HOST=72.62.132.43 npm run deploy:vps
  VPS_HOST=72.62.132.43 VPS_SSH_KEY=~/.ssh/id_rsa npm run deploy:vps
USAGE
  exit 0
fi

VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-deploy}"
VPS_PORT="${VPS_PORT:-22}"
VPS_SSH_KEY="${VPS_SSH_KEY:-}"
VPS_FRONTEND_PATH="${VPS_FRONTEND_PATH:-/home/deploy/apps/cortexbuild/frontend/dist/}"
VPS_BACKEND_PATH="${VPS_BACKEND_PATH:-/home/deploy/apps/cortexbuild/server/dist/}"
VPS_PM2_PROCESS="${VPS_PM2_PROCESS:-cortexbuild-backend}"

if [[ -z "$VPS_HOST" ]]; then
  echo "❌ VPS_HOST is required. Run with --help for usage."
  exit 1
fi

SSH_OPTS=(-p "$VPS_PORT" -o BatchMode=yes -o ConnectTimeout=10)
if [[ -n "$VPS_SSH_KEY" ]]; then
  SSH_OPTS+=( -i "$VPS_SSH_KEY" )
fi

echo "==> Building frontend and backend"
npm run build:prod

echo "==> Verifying SSH connectivity to ${VPS_USER}@${VPS_HOST}:${VPS_PORT}"
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "echo 'SSH OK'"

echo "==> Ensuring remote deploy directories exist"
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "mkdir -p '$VPS_FRONTEND_PATH' '$VPS_BACKEND_PATH'"

echo "==> Uploading frontend dist/"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" dist/ "${VPS_USER}@${VPS_HOST}:${VPS_FRONTEND_PATH}"

echo "==> Uploading backend server/dist/"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" server/dist/ "${VPS_USER}@${VPS_HOST}:${VPS_BACKEND_PATH}"

echo "==> Restarting PM2 process: ${VPS_PM2_PROCESS}"
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "pm2 restart '${VPS_PM2_PROCESS}' --update-env"

echo "✅ VPS deployment completed successfully"
