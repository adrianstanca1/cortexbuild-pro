#!/bin/bash
# ===========================================
# CortexBuild Pro - VPS Docker Setup Script
# Run as root on a fresh Ubuntu 22.04 VPS:
#   bash vps-docker-setup.sh
# ===========================================
set -e

# ── Configuration ─────────────────────────────────────────
DOMAIN="cortexbuildpro.com"
APP_DIR="/root/cortexbuild_pro"
REPO="https://github.com/adrianstanca1/cortexbuild-pro.git"
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   CortexBuild Pro - VPS Deployment Setup    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: System packages ───────────────────────────────
info "Step 1/9 — Installing system packages..."
apt-get update -qq
apt-get install -y -qq git curl openssl ufw fail2ban

# ── Step 2: Docker ────────────────────────────────────────
info "Step 2/9 — Setting up Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
log "Docker $(docker --version)"

if ! docker compose version &>/dev/null 2>&1; then
    apt-get install -y docker-compose-plugin
fi
log "Docker Compose available"

# ── Step 3: Clone repo ────────────────────────────────────
info "Step 3/9 — Cloning repository..."
if [ -d "$APP_DIR" ]; then
    warn "Directory exists — pulling latest..."
    cd "$APP_DIR" && git pull origin main
else
    git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"
log "Repository ready at $APP_DIR"

# ── Step 4: Create .env file ──────────────────────────────
info "Step 4/9 — Creating .env file..."
cd "$APP_DIR/deployment"

if [ -f ".env" ]; then
    warn ".env already exists — backing up to .env.bak"
    cp .env .env.bak
fi

cat > .env << EOF
# ── PostgreSQL ────────────────────────────────
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=cortexbuild

# ── NextAuth ──────────────────────────────────
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}

# ── Domain ────────────────────────────────────
DOMAIN=${DOMAIN}
SSL_EMAIL=admin@${DOMAIN}

# ── Google OAuth ──────────────────────────────
# Get from: https://console.cloud.google.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── AWS S3 (file uploads) ─────────────────────
# NOTE: Use access keys, not AWS_PROFILE (doesn't work in Docker)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-west-2
AWS_BUCKET_NAME=
AWS_FOLDER_PREFIX=cortexbuild/

# ── Ollama AI (local AI — install separately) ─
# If Ollama runs on the host: http://host.docker.internal:11434
# If Ollama runs in its own container: http://ollama:11434
OLLAMA_API_URL=http://host.docker.internal:11434

# ── SendGrid Email ────────────────────────────
# Get from: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@${DOMAIN}
SENDGRID_FROM_NAME=CortexBuild Pro

# ── Real-time / WebSocket ─────────────────────
NEXT_PUBLIC_WEBSOCKET_URL=https://${DOMAIN}
WEBSOCKET_PORT=3000

# ── Notification IDs ──────────────────────────
NOTIF_ID_MILESTONE_DEADLINE_REMINDER=
NOTIF_ID_TOOLBOX_TALK_COMPLETED=
NOTIF_ID_MEWP_CHECK_COMPLETED=
NOTIF_ID_TOOL_CHECK_COMPLETED=
EOF
log ".env created (DB password auto-generated)"
echo ""
echo -e "${YELLOW}  DB Password: ${DB_PASSWORD}${NC}"
echo -e "${YELLOW}  Save this somewhere safe!${NC}"
echo ""

# ── Step 5: Firewall ──────────────────────────────────────
info "Step 5/9 — Configuring firewall..."
ufw --force reset > /dev/null
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow ssh > /dev/null
ufw allow 80/tcp > /dev/null
ufw allow 443/tcp > /dev/null
ufw --force enable > /dev/null
log "Firewall configured (SSH, 80, 443 open)"

# ── Step 6: Build Docker images ───────────────────────────
info "Step 6/9 — Building Docker images (this takes ~5 minutes)..."
docker compose -f "$APP_DIR/deployment/docker-compose.yml" build --no-cache
log "Images built"

# ── Step 7: Start services ────────────────────────────────
info "Step 7/9 — Starting services..."
docker compose -f "$APP_DIR/deployment/docker-compose.yml" up -d postgres
echo "Waiting for database to be healthy..."
sleep 15
docker compose -f "$APP_DIR/deployment/docker-compose.yml" up -d app
sleep 10
docker compose -f "$APP_DIR/deployment/docker-compose.yml" up -d nginx certbot
log "All services started"

# ── Step 8: DB migrations + seed ─────────────────────────
info "Step 8/9 — Running database migrations..."
docker compose -f "$APP_DIR/deployment/docker-compose.yml" exec -T app \
    npx prisma migrate deploy || {
    warn "migrate deploy failed — trying db push (first-run fallback)..."
    docker compose -f "$APP_DIR/deployment/docker-compose.yml" exec -T app \
        npx prisma db push --accept-data-loss
}
log "Migrations complete"

docker compose -f "$APP_DIR/deployment/docker-compose.yml" exec -T app \
    npx prisma db seed 2>/dev/null && log "Database seeded" || warn "Seed skipped (may already exist)"

# ── Step 9: Setup cron for backups ───────────────────────
info "Step 9/9 — Setting up automated backups..."
CRON_JOB="0 2 * * * cd $APP_DIR/deployment && bash backup.sh >> /var/log/cortexbuild-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "cortexbuild" ; echo "$CRON_JOB") | crontab -
log "Daily backup scheduled at 2 AM"

# ── Summary ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        ✅  Deployment Complete!              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo "  App running at:  http://${DOMAIN} (HTTP, no SSL yet)"
echo ""
echo -e "${YELLOW}  ⚠  Next: Set up SSL${NC}"
echo "  cd $APP_DIR/deployment"
echo "  bash setup-ssl.sh ${DOMAIN} admin@${DOMAIN}"
echo ""
echo "  Useful commands:"
echo "  docker compose -f $APP_DIR/deployment/docker-compose.yml logs -f app"
echo "  docker compose -f $APP_DIR/deployment/docker-compose.yml ps"
echo "  docker compose -f $APP_DIR/deployment/docker-compose.yml restart app"
echo ""
