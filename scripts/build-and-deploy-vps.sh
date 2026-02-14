#!/usr/bin/env bash
set -euo pipefail

print_usage() {
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
  BACKEND_ENV_FILE    Optional backend .env file to sync before restarting PM2

CLI flags:
  --dry-run           Print commands without executing
  --skip-build        Skip npm run build:prod
  --help              Print this help text

Examples:
  VPS_HOST=72.62.132.43 npm run deploy:vps
  VPS_HOST=72.62.132.43 VPS_SSH_KEY=~/.ssh/id_rsa npm run deploy:vps
  VPS_HOST=72.62.132.43 npm run deploy:vps -- --dry-run
USAGE
}

DRY_RUN=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help)
      print_usage
      exit 0
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --skip-build)
      SKIP_BUILD=true
      ;;
    *)
      echo "❌ Unknown flag: $1"
      print_usage
      exit 1
      ;;
  esac
  shift
done

VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-deploy}"
VPS_PORT="${VPS_PORT:-22}"
VPS_SSH_KEY="${VPS_SSH_KEY:-}"
VPS_FRONTEND_PATH="${VPS_FRONTEND_PATH:-/home/deploy/apps/cortexbuild/frontend/dist/}"
VPS_BACKEND_PATH="${VPS_BACKEND_PATH:-/home/deploy/apps/cortexbuild/server/dist/}"
VPS_PM2_PROCESS="${VPS_PM2_PROCESS:-cortexbuild-backend}"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-}"

if [[ -z "$VPS_HOST" ]]; then
  echo "❌ VPS_HOST is required. Run with --help for usage."
  exit 1
fi

SSH_OPTS=(-p "$VPS_PORT" -o BatchMode=yes -o ConnectTimeout=10)
if [[ -n "$VPS_SSH_KEY" ]]; then
  SSH_OPTS+=( -i "$VPS_SSH_KEY" )
fi

run_cmd() {
  if $DRY_RUN; then
    printf '[dry-run] '
    printf '%q ' "$@"
    printf '\n'
    return 0
  fi

  "$@"
}

if ! command -v rsync >/dev/null 2>&1; then
  echo "❌ rsync is required but not installed"
  exit 1
fi

if ! $SKIP_BUILD; then
  echo "==> Building frontend and backend"
  run_cmd npm run build:prod
else
  echo "==> Skipping build (requested via --skip-build)"
fi

echo "==> Verifying SSH connectivity to ${VPS_USER}@${VPS_HOST}:${VPS_PORT}"
run_cmd ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "echo 'SSH OK'"

echo "==> Ensuring remote deploy directories exist"
run_cmd ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "mkdir -p '$VPS_FRONTEND_PATH' '$VPS_BACKEND_PATH'"

echo "==> Uploading frontend dist/"
run_cmd rsync -az --delete -e "ssh ${SSH_OPTS[*]}" dist/ "${VPS_USER}@${VPS_HOST}:${VPS_FRONTEND_PATH}"

echo "==> Uploading backend server/dist/"
run_cmd rsync -az --delete -e "ssh ${SSH_OPTS[*]}" server/dist/ "${VPS_USER}@${VPS_HOST}:${VPS_BACKEND_PATH}"

if [[ -n "$BACKEND_ENV_FILE" ]]; then
  if [[ ! -f "$BACKEND_ENV_FILE" ]]; then
    echo "❌ BACKEND_ENV_FILE does not exist: $BACKEND_ENV_FILE"
    exit 1
  fi

  echo "==> Uploading backend environment file"
  run_cmd rsync -az -e "ssh ${SSH_OPTS[*]}" "$BACKEND_ENV_FILE" "${VPS_USER}@${VPS_HOST}:${VPS_BACKEND_PATH}/../.env"
fi

echo "==> Restarting PM2 process: ${VPS_PM2_PROCESS}"
run_cmd ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "pm2 restart '${VPS_PM2_PROCESS}' --update-env"

echo "✅ VPS deployment completed successfully"
