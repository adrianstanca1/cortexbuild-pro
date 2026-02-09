#!/usr/bin/env bash
set -euo pipefail

# CortexBuild Pro - setup deployment dependencies and .env from exported credentials.
# Usage:
#   ./setup-env-and-deps.sh [--env-file deployment/.env] [--skip-deps]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/deployment/.env"
SKIP_DEPS="false"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options:
  --env-file <path>   Destination env file (default: deployment/.env)
  --skip-deps         Skip apt/docker dependency installation checks
  -h, --help          Show this help

Required exported vars:
  POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, NEXTAUTH_SECRET, NEXTAUTH_URL

Optional vars (if exported they are written):
  ENCRYPTION_KEY, PORT, NODE_ENV, NEXT_TELEMETRY_DISABLED,
  NEXT_PUBLIC_WEBSOCKET_URL, WEBSOCKET_PORT, DOMAIN, SSL_EMAIL,
  STORAGE_STRATEGY, LOCAL_STORAGE_PATH,
  SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME,
  ABACUSAI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY,
  AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION, AWS_FOLDER_PREFIX
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --skip-deps) SKIP_DEPS="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

install_base_deps() {
  if [[ "$SKIP_DEPS" == "true" ]]; then
    echo "[deps] skipping dependency installation checks (--skip-deps)"
    return 0
  fi

  if [[ "$(id -u)" -ne 0 ]]; then
    echo "[deps] non-root user detected; skipping apt install. Re-run with sudo/root on VPS for automatic dependency setup."
    return 0
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    echo "[deps] apt-get not found; skipping OS dependency install"
    return 0
  fi

  echo "[deps] installing system packages"
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release git

  if ! command -v docker >/dev/null 2>&1; then
    echo "[deps] installing docker"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker || true
    systemctl start docker || true
  else
    echo "[deps] docker already installed"
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo "[deps] installing docker compose plugin"
    apt-get install -y docker-compose-plugin
  else
    echo "[deps] docker compose already installed"
  fi
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

append_if_set() {
  local key="$1"
  if [[ -n "${!key:-}" ]]; then
    printf '%s=%q\n' "$key" "${!key}" >> "$ENV_FILE"
  fi
}

install_base_deps

require_var POSTGRES_USER
require_var POSTGRES_PASSWORD
require_var POSTGRES_DB
require_var NEXTAUTH_SECRET
require_var NEXTAUTH_URL

if [[ -z "${DATABASE_URL:-}" ]]; then
  DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public"
fi

mkdir -p "$(dirname "$ENV_FILE")"

cat > "$ENV_FILE" <<EOCFG
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=${DATABASE_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL}
EOCFG

append_if_set ENCRYPTION_KEY
append_if_set NODE_ENV
append_if_set PORT
append_if_set NEXT_TELEMETRY_DISABLED
append_if_set NEXT_PUBLIC_WEBSOCKET_URL
append_if_set WEBSOCKET_PORT
append_if_set DOMAIN
append_if_set SSL_EMAIL
append_if_set STORAGE_STRATEGY
append_if_set LOCAL_STORAGE_PATH
append_if_set SENDGRID_API_KEY
append_if_set SENDGRID_FROM_EMAIL
append_if_set SENDGRID_FROM_NAME
append_if_set ABACUSAI_API_KEY
append_if_set GEMINI_API_KEY
append_if_set GOOGLE_API_KEY
append_if_set AWS_ACCESS_KEY_ID
append_if_set AWS_SECRET_ACCESS_KEY
append_if_set AWS_BUCKET_NAME
append_if_set AWS_REGION
append_if_set AWS_FOLDER_PREFIX

chmod 600 "$ENV_FILE"

echo "[env] wrote $ENV_FILE"
echo "[env] permissions set to 600"
