#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$REPO_ROOT/nextjs_space"
ENV_FILE="$APP_DIR/.env"

if [ ! -d "$APP_DIR" ]; then
  echo "❌ Expected app directory at $APP_DIR not found."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  touch "$ENV_FILE"
fi

TARGET_NEXTAUTH_URL="${NEXTAUTH_URL_OVERRIDE:-http://72.62.132.43}"

if grep -q '^NEXTAUTH_URL=' "$ENV_FILE"; then
  sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=${TARGET_NEXTAUTH_URL}|g" "$ENV_FILE"
else
  echo "NEXTAUTH_URL=${TARGET_NEXTAUTH_URL}" >> "$ENV_FILE"
fi

AUTH_FILE=$(find "$APP_DIR" -type f \( -name 'auth-options.ts' -o -path '*/api/auth/*/route.ts' \) | head -n 1 || true)
if [ -n "$AUTH_FILE" ]; then
  echo "✅ Auth configuration located at: $AUTH_FILE"
else
  echo "⚠️ Auth configuration file not found automatically."
fi

echo "✅ NEXTAUTH_URL updated in $ENV_FILE"

if [ "${CI:-}" = "true" ]; then
  echo "CI mode detected; skipping restart."
  exit 0
fi

echo "Restart your application process to apply runtime env changes."
