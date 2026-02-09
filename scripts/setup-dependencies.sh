#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/nextjs_space"

echo "[1/3] Checking runtime prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

NODE_VERSION="$(node -v)"
NPM_VERSION="$(npm -v)"
echo "✅ Node.js: $NODE_VERSION"
echo "✅ npm: $NPM_VERSION"

echo "[2/3] Installing Next.js application dependencies..."
cd "$APP_DIR"
npm ci --legacy-peer-deps

echo "[3/3] Dependency setup complete."
echo "✅ Dependencies are installed for $APP_DIR"
