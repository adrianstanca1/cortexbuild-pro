#!/usr/bin/env bash
set -euo pipefail

# CortexBuild Pro - Remote VPS redeploy helper
# Uploads a deployment package and performs a remote rebuild + redeploy.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_SCRIPT="$ROOT_DIR/scripts/create-deployment-package.sh"
PACKAGE_PATH="$ROOT_DIR/cortexbuild_vps_deploy.tar.gz"

VPS_HOST="${VPS_HOST:-72.62.132.43}"
VPS_USER="${VPS_USER:-root}"
VPS_DEPLOY_DIR="${VPS_DEPLOY_DIR:-/root/cortexbuild}"
SSH_KEY_PATH="${SSH_KEY_PATH:-}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_MODE="${DEPLOY_MODE:-docker-manager}" # docker-manager|compose

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options:
  --host <host>         VPS hostname or IP
  --user <user>         SSH user (default: root)
  --dir <remote_dir>    Remote deployment directory (default: /root/cortexbuild)
  --key <ssh_key>       SSH private key path
  --port <ssh_port>     SSH port (default: 22)
  --mode <mode>         Deployment mode: docker-manager | compose (default: docker-manager)
  --skip-package        Skip creating package (requires local cortexbuild_vps_deploy.tar.gz)
  -h, --help            Show this help

Environment overrides:
  VPS_HOST, VPS_USER, VPS_DEPLOY_DIR, SSH_KEY_PATH, SSH_PORT, DEPLOY_MODE

Examples:
  $(basename "$0") --host 203.0.113.10 --user root --key ~/.ssh/id_rsa
  $(basename "$0") --mode compose --host 203.0.113.10 --key ~/.ssh/prod
USAGE
}

SKIP_PACKAGE="false"

if ! command -v ssh >/dev/null 2>&1 || ! command -v scp >/dev/null 2>&1; then
  echo "ssh/scp commands are required but not available in PATH" >&2
  exit 1
fi

if [[ ! -f "$PACKAGE_SCRIPT" ]]; then
  echo "Package script is missing: $PACKAGE_SCRIPT" >&2
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) VPS_HOST="$2"; shift 2 ;;
    --user) VPS_USER="$2"; shift 2 ;;
    --dir) VPS_DEPLOY_DIR="$2"; shift 2 ;;
    --key) SSH_KEY_PATH="$2"; shift 2 ;;
    --port) SSH_PORT="$2"; shift 2 ;;
    --mode) DEPLOY_MODE="$2"; shift 2 ;;
    --skip-package) SKIP_PACKAGE="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ "$DEPLOY_MODE" != "docker-manager" && "$DEPLOY_MODE" != "compose" ]]; then
  echo "Invalid --mode: $DEPLOY_MODE (expected docker-manager or compose)" >&2
  exit 1
fi

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=20 -p "$SSH_PORT")
SCP_OPTS=(-o BatchMode=yes -o ConnectTimeout=20 -P "$SSH_PORT")
if [[ -n "$SSH_KEY_PATH" ]]; then
  if [[ ! -f "$SSH_KEY_PATH" ]]; then
    echo "SSH key file not found: $SSH_KEY_PATH" >&2
    exit 1
  fi
  if grep -qE '^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256) ' "$SSH_KEY_PATH"; then
    echo "Provided --key appears to be a public key. Please provide a private key file." >&2
    exit 1
  fi
  SSH_OPTS+=(-i "$SSH_KEY_PATH")
  SCP_OPTS+=(-i "$SSH_KEY_PATH")
fi
REMOTE="$VPS_USER@$VPS_HOST"
REMOTE_APP_DIR="$VPS_DEPLOY_DIR/cortexbuild/deployment"

if [[ "$SKIP_PACKAGE" != "true" ]]; then
  echo "[1/6] Creating deployment package..."
  bash "$PACKAGE_SCRIPT"
fi

echo "[2/6] Verifying local package..."
if [[ ! -f "$PACKAGE_PATH" ]]; then
  echo "Deployment package not found: $PACKAGE_PATH" >&2
  exit 1
fi

echo "[3/6] Testing SSH connectivity to $REMOTE:$SSH_PORT..."
ssh "${SSH_OPTS[@]}" "$REMOTE" "echo 'SSH connection OK'"

echo "[4/6] Uploading package to $VPS_DEPLOY_DIR..."
ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$VPS_DEPLOY_DIR'"
scp "${SCP_OPTS[@]}" "$PACKAGE_PATH" "$REMOTE:$VPS_DEPLOY_DIR/cortexbuild_vps_deploy.tar.gz"

echo "[5/6] Extracting package on VPS..."
ssh "${SSH_OPTS[@]}" "$REMOTE" "cd '$VPS_DEPLOY_DIR' && rm -rf cortexbuild && tar -xzf cortexbuild_vps_deploy.tar.gz"

echo "[6/6] Rebuilding and redeploying in $DEPLOY_MODE mode..."
if [[ "$DEPLOY_MODE" == "docker-manager" ]]; then
  ssh "${SSH_OPTS[@]}" "$REMOTE" "REMOTE_APP_DIR='$REMOTE_APP_DIR' bash -s" <<'EOSSH'
set -euo pipefail
cd "$REMOTE_APP_DIR"

echo "Building fresh app image (no cache)..."
docker build --no-cache -t cortexbuild-app:latest -f Dockerfile ..

echo "Tagging backup image..."
TS=$(date +%Y%m%d_%H%M%S)
docker tag cortexbuild-app:latest "cortexbuild-app:$TS"

echo "Restarting stack with docker compose..."
docker compose down || true
docker compose up -d

echo "Running database migrations..."
docker compose exec -T app npx prisma migrate deploy

echo "Deployment complete."
EOSSH
else
  ssh "${SSH_OPTS[@]}" "$REMOTE" "REMOTE_APP_DIR='$REMOTE_APP_DIR' bash -s" <<'EOSSH'
set -euo pipefail
cd "$REMOTE_APP_DIR"

echo "Rebuilding compose services..."
docker compose build --no-cache app
docker compose up -d --force-recreate

echo "Running database migrations..."
docker compose exec -T app npx prisma migrate deploy

echo "Deployment complete."
EOSSH
fi

echo "Redeploy succeeded on $REMOTE using mode=$DEPLOY_MODE"
