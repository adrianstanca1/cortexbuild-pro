#!/bin/sh
# ============================================================
# CortexBuild Pro — Container Startup Script
# Runs Prisma DB migrations then starts Next.js
# ============================================================
set -e

echo "========================================="
echo "  CortexBuild Pro — Starting up"
echo "  NODE_ENV: ${NODE_ENV:-production}"
echo "  OLLAMA:   ${OLLAMA_URL:-http://host.docker.internal:11434}"
echo "  MODEL:    ${OLLAMA_MODEL:-qwen2.5:7b}"
echo "========================================="

# Run Prisma migrations (non-fatal — app still starts if this fails)
echo "[startup] Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1 || {
  echo "[startup] WARNING: DB migration failed — app will start anyway."
  echo "[startup] Check DATABASE_URL and ensure postgres is healthy."
}

echo "[startup] Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
