#!/bin/bash
# ============================================================
# CortexBuild Pro — Manual VPS Deployment Script
# Paste this into your VPS console (root terminal)
# Docker image is pre-built at ghcr.io/adrianstanca1/cortexbuild-pro:latest
# ============================================================
set -e

DEPLOY_DIR="/var/www/cortexbuildpro"
REPO_URL="https://github.com/adrianstanca1/cortexbuild-pro.git"
IMAGE="ghcr.io/adrianstanca1/cortexbuild-pro:latest"

echo "================================================"
echo " CortexBuild Pro — Manual Deployment"
echo "================================================"

# ── 1. Docker ────────────────────────────────────────
echo "[1/7] Checking Docker..."
if ! command -v docker &>/dev/null; then
  echo "  Installing Docker via get.docker.com..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker && systemctl start docker
fi
docker --version
if ! docker compose version &>/dev/null; then
  apt-get update -qq && apt-get install -y docker-compose-plugin
fi
echo "  ✓ Docker ready"

# ── 2. Firewall ──────────────────────────────────────
echo "[2/7] Configuring firewall..."
if command -v ufw &>/dev/null; then
  ufw allow ssh       2>/dev/null || true
  ufw allow 80/tcp    2>/dev/null || true
  ufw allow 443/tcp   2>/dev/null || true
  ufw allow 3010/tcp  2>/dev/null || true
  ufw --force enable  2>/dev/null || true
fi
echo "  ✓ Firewall OK"

# ── 3. Clone / pull repo ─────────────────────────────
echo "[3/7] Fetching latest code..."
if [ -d "$DEPLOY_DIR/.git" ]; then
  cd "$DEPLOY_DIR"
  git fetch origin
  git checkout main 2>/dev/null || git checkout Cortexbuildpro
  git pull
else
  rm -rf "$DEPLOY_DIR"
  git clone -b main "$REPO_URL" "$DEPLOY_DIR" 2>/dev/null || \
  git clone -b Cortexbuildpro "$REPO_URL" "$DEPLOY_DIR"
fi
echo "  ✓ Code at $(cd $DEPLOY_DIR && git log --oneline -1)"

# ── 4. Environment ───────────────────────────────────
echo "[4/7] Setting up environment..."
cd "$DEPLOY_DIR/deployment"
if [ ! -f .env ]; then
  POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d "/+=")
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
  cat > .env <<EOF
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=cortexbuild
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=http://${SERVER_IP}:3010
ENCRYPTION_KEY=${ENCRYPTION_KEY}
DOMAIN=${SERVER_IP}
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5:7b
AI_PROVIDER=ollama
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=eu-west-2
SENDGRID_API_KEY=
NEXT_PUBLIC_WEBSOCKET_URL=
WEBSOCKET_PORT=3000
EOF
  echo "  ✓ .env created (review and edit if needed)"
else
  echo "  ✓ .env already exists — skipping"
fi

# ── 5. Pull image & start ────────────────────────────
echo "[5/7] Pulling Docker image: $IMAGE ..."
docker pull "$IMAGE"

echo "  Stopping existing containers..."
docker compose -f docker-compose.vps.yml down app nginx 2>/dev/null || true

echo "  Starting database..."
docker compose -f docker-compose.vps.yml up -d db
echo "  Waiting for DB to be ready..."
sleep 15

echo "  Starting application..."
docker compose -f docker-compose.vps.yml up -d app
sleep 30
echo "  ✓ App container started"

# ── 6. Migrations + Seed ─────────────────────────────
echo "[6/7] Running database migrations..."
docker compose -f docker-compose.vps.yml exec -T app sh -c \
  "cd /app && npx prisma migrate deploy" 2>/dev/null \
  || echo "  ⚠ Migrations may run on first request"

echo "  Running database seed (AS Cladding & Roofing Ltd)..."
docker compose -f docker-compose.vps.yml exec -T app sh -c \
  "cd /app && npx tsx --require dotenv/config scripts/seed.ts" 2>/dev/null \
  || echo "  ⚠ Seed skipped (data may already exist)"

# ── 7. Health check ──────────────────────────────────
echo "[7/7] Health check..."
sleep 15
SERVER_IP_LIVE=$(hostname -I | awk '{print $1}')
if curl -sf "http://localhost:3010/api/health" >/dev/null 2>&1; then
  echo "  ✓ Application is LIVE!"
  echo ""
  echo "  URL:      http://${SERVER_IP_LIVE}:3010"
  echo "  Login:    adrian@ascladdingltd.co.uk"
  echo "  Password: Admin@2024!"
else
  echo "  ⚠ App may still be initialising (check logs below)..."
  docker compose -f docker-compose.vps.yml logs --tail=30 app
fi

docker compose -f docker-compose.vps.yml ps

echo ""
echo "================================================"
echo " DEPLOYMENT COMPLETE"
echo " Logs: cd $DEPLOY_DIR/deployment && docker compose -f docker-compose.vps.yml logs -f app"
echo "================================================"
