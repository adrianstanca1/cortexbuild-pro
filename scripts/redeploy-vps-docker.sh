#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage:
  $(basename "$0") --host <vps_host> --user <vps_user> [options]

Required:
  --host <host>                VPS hostname or IP
  --user <user>                SSH user

Options:
  --ssh-key <path>             SSH private key
  --branch <branch>            Git branch to deploy (default: work)
  --repo-dir <path>            Repo path on VPS (default: /root/cortexbuild_pro)
  --env-file <path>            Local env file to upload as deployment/.env
  --domain <domain>            Public domain to verify (default: www.cortexbuildpro.com)
  --check-only                 Run remote checks only (no restart)
  --skip-build                 Skip docker compose build step
  --help                       Show this help
USAGE
}

HOST=""
SSH_USER=""
SSH_KEY=""
BRANCH="work"
REPO_DIR="/root/cortexbuild_pro"
ENV_FILE=""
DOMAIN="www.cortexbuildpro.com"
CHECK_ONLY=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="${2:-}"; shift 2 ;;
    --user) SSH_USER="${2:-}"; shift 2 ;;
    --ssh-key) SSH_KEY="${2:-}"; shift 2 ;;
    --branch) BRANCH="${2:-}"; shift 2 ;;
    --repo-dir) REPO_DIR="${2:-}"; shift 2 ;;
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --check-only) CHECK_ONLY=true; shift ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1"; usage; exit 1 ;;
  esac
done

[[ -n "$HOST" ]] || { echo "--host is required"; usage; exit 1; }
[[ -n "$SSH_USER" ]] || { echo "--user is required"; usage; exit 1; }
[[ -n "$DOMAIN" ]] || { echo "--domain is required"; usage; exit 1; }

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "$SSH_KEY" ]]; then
  [[ -f "$SSH_KEY" ]] || { echo "ssh key not found: $SSH_KEY"; exit 1; }
  SSH_OPTS+=(-i "$SSH_KEY")
fi

REMOTE="$SSH_USER@$HOST"

if [[ -n "$ENV_FILE" ]]; then
  [[ -f "$ENV_FILE" ]] || { echo "env file not found: $ENV_FILE"; exit 1; }
  echo "Uploading env file to $REMOTE:$REPO_DIR/deployment/.env"
  scp "${SSH_OPTS[@]}" "$ENV_FILE" "$REMOTE:$REPO_DIR/deployment/.env"
fi

echo "Executing remote deployment on $REMOTE"
ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "BRANCH=$(printf %q "$BRANCH") REPO_DIR=$(printf %q "$REPO_DIR") CHECK_ONLY=$(printf %q "$CHECK_ONLY") SKIP_BUILD=$(printf %q "$SKIP_BUILD") DOMAIN=$(printf %q "$DOMAIN") bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

: "${BRANCH:?missing BRANCH}"
: "${REPO_DIR:?missing REPO_DIR}"
: "${CHECK_ONLY:?missing CHECK_ONLY}"
: "${SKIP_BUILD:?missing SKIP_BUILD}"
: "${DOMAIN:?missing DOMAIN}"

echo "== Preflight checks =="
command -v git >/dev/null
command -v docker >/dev/null
command -v curl >/dev/null

[[ -d "$REPO_DIR" ]] || { echo "Repository directory does not exist: $REPO_DIR"; exit 1; }

cd "$REPO_DIR"
echo "== Repo sync =="
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only

echo "== Compose validation =="
cd deployment
POSTGRES_PASSWORD=check NEXTAUTH_SECRET=check ENCRYPTION_KEY=0123456789abcdef0123456789abcdef docker compose config >/dev/null

if [[ "$CHECK_ONLY" == "true" ]]; then
  echo "Check-only mode complete"
  exit 0
fi

echo "== Rebuild/restart =="
docker compose down
if [[ "$SKIP_BUILD" == "true" ]]; then
  echo "Skipping build (--skip-build)"
else
  docker compose build --no-cache app
fi
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "== Health checks =="
docker compose ps
for attempt in 1 2 3 4 5; do
  if curl -fsS "https://$DOMAIN" >/dev/null && curl -fsS "https://$DOMAIN/api/health" >/dev/null; then
    echo "Public health checks passed on attempt $attempt"
    exit 0
  fi
  echo "Health check attempt $attempt failed; retrying in 5s..."
  sleep 5
done

echo "Public health checks failed after retries"
exit 1
REMOTE_SCRIPT
