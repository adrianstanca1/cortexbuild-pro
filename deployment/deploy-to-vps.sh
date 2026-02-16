#!/bin/bash
# =============================================================================
# CortexBuild Pro - Deploy to VPS via Docker
# =============================================================================
# Single-command deployment: builds the Docker image locally (or from registry),
# transfers it to your VPS, and starts the full stack (PostgreSQL + App + Nginx).
#
# Prerequisites:
#   - SSH access to your VPS (key-based auth recommended)
#   - Docker installed locally (for local build mode)
#   - Docker installed on the VPS
#
# Usage:
#   ./deploy-to-vps.sh                          # interactive mode
#   ./deploy-to-vps.sh --host 1.2.3.4           # specify VPS host
#   ./deploy-to-vps.sh --host 1.2.3.4 --registry  # pull from GHCR instead of local build
#   ./deploy-to-vps.sh --host 1.2.3.4 --ssl     # enable SSL after deploy
#   ./deploy-to-vps.sh --host 1.2.3.4 --password 'your-password'  # password auth
#
# Environment variables (override flags):
#   VPS_HOST, VPS_USER, VPS_PORT, VPS_DEPLOY_PATH, DOMAIN
# =============================================================================

set -euo pipefail

# --------------- configuration ------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="cortexbuild-pro"
IMAGE_TAG="latest"
REGISTRY_IMAGE="ghcr.io/adrianstanca1/cortexbuild-pro"

# Defaults (overridden by flags or env vars)
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
VPS_DEPLOY_PATH="${VPS_DEPLOY_PATH:-/var/www/cortexbuild-pro}"
DOMAIN="${DOMAIN:-}"
USE_REGISTRY=false
ENABLE_SSL=false
SKIP_BUILD=false
RUN_MIGRATIONS=true
SSH_PASSWORD="${SSH_PASSWORD:-}"

# --------------- colours ------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log()         { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }

# --------------- parse flags --------------------------------------------------
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)       VPS_HOST="$2"; shift 2 ;;
        --user)       VPS_USER="$2"; shift 2 ;;
        --port)       VPS_PORT="$2"; shift 2 ;;
        --path)       VPS_DEPLOY_PATH="$2"; shift 2 ;;
        --domain)     DOMAIN="$2"; shift 2 ;;
        --password)   SSH_PASSWORD="$2"; shift 2 ;;
        --registry)   USE_REGISTRY=true; shift ;;
        --ssl)        ENABLE_SSL=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --no-migrate) RUN_MIGRATIONS=false; shift ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --host HOST        VPS IP or hostname (required)"
            echo "  --user USER        SSH user (default: root)"
            echo "  --port PORT        SSH port (default: 22)"
            echo "  --path PATH        Deploy path on VPS (default: /var/www/cortexbuild-pro)"
            echo "  --domain DOMAIN    Domain name for SSL"
            echo "  --password PASS    SSH password (uses sshpass; key auth is preferred)"
            echo "  --registry         Pull image from GHCR instead of local build + transfer"
            echo "  --ssl              Enable SSL via Let's Encrypt after deploy"
            echo "  --skip-build       Skip building, use existing image on VPS"
            echo "  --no-migrate       Skip database migrations"
            echo "  -h, --help         Show this help"
            exit 0
            ;;
        *) log_error "Unknown flag: $1"; exit 1 ;;
    esac
done

# --------------- validate -----------------------------------------------------
if [[ -z "$VPS_HOST" ]]; then
    echo -e "${CYAN}"
    echo "========================================"
    echo "  CortexBuild Pro - Deploy to VPS"
    echo "========================================"
    echo -e "${NC}"
    read -rp "VPS host (IP or hostname): " VPS_HOST
    read -rp "SSH user [root]: " input_user
    VPS_USER="${input_user:-root}"
    read -rp "SSH port [22]: " input_port
    VPS_PORT="${input_port:-22}"
    read -rp "Deploy path [/var/www/cortexbuild-pro]: " input_path
    VPS_DEPLOY_PATH="${input_path:-/var/www/cortexbuild-pro}"
    read -rp "Domain name (leave blank to skip SSL): " DOMAIN
    if [[ -n "$DOMAIN" ]]; then
        ENABLE_SSL=true
    fi
    echo ""
fi

SSH_CMD="ssh -o StrictHostKeyChecking=accept-new -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}"
SCP_CMD="scp -o StrictHostKeyChecking=accept-new -P ${VPS_PORT}"

if [[ -n "$SSH_PASSWORD" ]]; then
    if ! command -v sshpass >/dev/null 2>&1; then
        log_error "sshpass is required for --password auth. Install it and retry."
        exit 1
    fi

    log_warn "Using password-based SSH auth. Key-based auth is strongly recommended for production."
    SSH_CMD="SSHPASS='${SSH_PASSWORD}' sshpass -e ssh -o StrictHostKeyChecking=accept-new -p ${VPS_PORT} ${VPS_USER}@${VPS_HOST}"
    SCP_CMD="SSHPASS='${SSH_PASSWORD}' sshpass -e scp -o StrictHostKeyChecking=accept-new -P ${VPS_PORT}"
fi

log "Deploying to ${VPS_USER}@${VPS_HOST}:${VPS_DEPLOY_PATH}"

# --------------- step 1: verify VPS connectivity ------------------------------
log_info "Step 1/6: Verifying VPS connectivity..."

if ! $SSH_CMD "echo 'connected'" >/dev/null 2>&1; then
    log_error "Cannot connect to ${VPS_USER}@${VPS_HOST}:${VPS_PORT}"
    log_error "Ensure SSH key-based auth is configured and the host is reachable."
    exit 1
fi
log_success "VPS is reachable"

# Ensure Docker is installed on VPS
$SSH_CMD "bash -s" <<'REMOTE_DOCKER_CHECK'
if ! command -v docker >/dev/null 2>&1; then
    echo "Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
if ! docker compose version >/dev/null 2>&1; then
    echo "Docker Compose plugin not found. Installing..."
    apt-get update -y && apt-get install -y docker-compose-plugin
fi
echo "Docker $(docker --version) ready"
echo "Docker Compose $(docker compose version) ready"
REMOTE_DOCKER_CHECK

log_success "Docker is available on VPS"

# --------------- step 2: build or pull image ----------------------------------
log_info "Step 2/6: Preparing Docker image..."

if [[ "$USE_REGISTRY" == true ]]; then
    log_info "Will pull from registry on VPS: ${REGISTRY_IMAGE}:${IMAGE_TAG}"
elif [[ "$SKIP_BUILD" == true ]]; then
    log_info "Skipping build, using existing image on VPS"
else
    log_info "Building Docker image locally..."
    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" -f "${SCRIPT_DIR}/Dockerfile" "$APP_ROOT"
    log_success "Image built: ${IMAGE_NAME}:${IMAGE_TAG}"

    log_info "Saving and transferring image to VPS (this may take a few minutes)..."
    docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip | \
        $SSH_CMD "docker load"
    log_success "Image transferred to VPS"
fi

# --------------- step 3: transfer deployment files ----------------------------
log_info "Step 3/6: Transferring deployment files..."

$SSH_CMD "mkdir -p ${VPS_DEPLOY_PATH}/deployment"

# Transfer deployment configs
for file in docker-compose.yml docker-compose.prod.yml nginx.conf nginx-ssl.conf .env.example; do
    if [[ -f "${SCRIPT_DIR}/${file}" ]]; then
        $SCP_CMD "${SCRIPT_DIR}/${file}" "${VPS_USER}@${VPS_HOST}:${VPS_DEPLOY_PATH}/deployment/"
    fi
done

# Transfer setup-ssl.sh if it exists
if [[ -f "${SCRIPT_DIR}/setup-ssl.sh" ]]; then
    $SCP_CMD "${SCRIPT_DIR}/setup-ssl.sh" "${VPS_USER}@${VPS_HOST}:${VPS_DEPLOY_PATH}/deployment/"
    $SSH_CMD "chmod +x ${VPS_DEPLOY_PATH}/deployment/setup-ssl.sh"
fi

# Transfer prisma schema + migrations for DB migrations
$SSH_CMD "mkdir -p ${VPS_DEPLOY_PATH}/nextjs_space/prisma"
$SCP_CMD -r "${APP_ROOT}/nextjs_space/prisma/." \
    "${VPS_USER}@${VPS_HOST}:${VPS_DEPLOY_PATH}/nextjs_space/prisma/"

# Transfer Dockerfile (needed for docker-compose build context)
$SCP_CMD "${SCRIPT_DIR}/Dockerfile" "${VPS_USER}@${VPS_HOST}:${VPS_DEPLOY_PATH}/deployment/"

log_success "Deployment files transferred"

# --------------- step 4: configure env on VPS ---------------------------------
log_info "Step 4/6: Configuring environment on VPS..."

$SSH_CMD "bash -s" <<REMOTE_ENV
cd ${VPS_DEPLOY_PATH}/deployment

if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env

    # Generate secure secrets
    POSTGRES_PASS=\$(openssl rand -base64 24 | tr -d '/+=')
    AUTH_SECRET=\$(openssl rand -base64 32)
    ENC_KEY=\$(openssl rand -hex 32)

    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\${POSTGRES_PASS}|" .env
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\${AUTH_SECRET}|" .env
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\${ENC_KEY}|" .env

    if [ -n "${DOMAIN}" ]; then
        sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://${DOMAIN}|" .env
        sed -i "s|NEXT_PUBLIC_WEBSOCKET_URL=.*|NEXT_PUBLIC_WEBSOCKET_URL=https://${DOMAIN}|" .env
    fi

    chmod 600 .env
    echo "Generated .env with secure credentials"
else
    echo ".env already exists, keeping current configuration"
fi
REMOTE_ENV

log_success "Environment configured"

# --------------- step 5: deploy on VPS ---------------------------------------
log_info "Step 5/6: Starting services on VPS..."

# Resolve image reference used by docker compose on VPS
if [[ "$USE_REGISTRY" == true ]]; then
    APP_IMAGE="${REGISTRY_IMAGE}:${IMAGE_TAG}"
elif [[ "$SKIP_BUILD" == true ]]; then
    APP_IMAGE="${REGISTRY_IMAGE}:${IMAGE_TAG}"
else
    APP_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
fi

$SSH_CMD "bash -s" <<REMOTE_DEPLOY
set -e
cd ${VPS_DEPLOY_PATH}/deployment

# Ensure docker compose points to the intended app image
export APP_IMAGE="${APP_IMAGE}"

# Stop existing services gracefully
echo "Stopping existing services..."
docker compose down --remove-orphans 2>/dev/null || true

if [ "${USE_REGISTRY}" = "true" ]; then
    echo "Pulling latest image from registry..."
    docker compose pull app
elif [ "${SKIP_BUILD}" = "true" ]; then
    echo "Skip-build requested. Expecting image '${APP_IMAGE}' to already exist on VPS..."
fi

# Start the stack
echo "Starting services..."
docker compose up -d db
echo "Waiting for database to be healthy..."
sleep 15

docker compose up -d app
echo "Waiting for application to start..."

# Wait for app health check
MAX_RETRIES=40
RETRY=0
while [ \$RETRY -lt \$MAX_RETRIES ]; do
    STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [ "\$STATUS" = "200" ]; then
        echo "Application is healthy"
        break
    fi
    RETRY=\$((RETRY + 1))
    echo "  Waiting... attempt \$RETRY/\$MAX_RETRIES (status: \$STATUS)"
    sleep 10
done

if [ \$RETRY -ge \$MAX_RETRIES ]; then
    echo "WARNING: Application did not become healthy within timeout"
    echo "--- Recent logs ---"
    docker compose logs --tail=30 app
fi

# Start nginx
docker compose up -d nginx
echo "Nginx started"

# Run migrations
if [ "${RUN_MIGRATIONS}" = "true" ]; then
    echo "Running database migrations..."
    docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy" || \
        echo "WARNING: Migrations failed or already applied. Check manually."
fi

echo ""
echo "=== Container Status ==="
docker compose ps
REMOTE_DEPLOY

log_success "Services deployed"

# --------------- step 6: SSL setup (optional) ---------------------------------
if [[ "$ENABLE_SSL" == true && -n "$DOMAIN" ]]; then
    log_info "Step 6/6: Setting up SSL for ${DOMAIN}..."

    $SSH_CMD "bash -s" <<REMOTE_SSL
set -e
cd ${VPS_DEPLOY_PATH}/deployment

# Request certificate via certbot
echo "Requesting SSL certificate for ${DOMAIN}..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@${DOMAIN} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN} \
    -d www.${DOMAIN} || {
        echo "WARNING: Certbot failed. You can retry manually:"
        echo "  docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d ${DOMAIN}"
        exit 0
    }

# Update nginx-ssl.conf with the actual domain
sed -i "s|cortexbuildpro.com|${DOMAIN}|g" nginx-ssl.conf

# Switch to SSL nginx config
echo "Switching to SSL configuration..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx

echo "SSL enabled for ${DOMAIN}"
REMOTE_SSL

    log_success "SSL configured for ${DOMAIN}"
else
    log_info "Step 6/6: Skipping SSL (no domain specified)"
    log_info "To enable SSL later, run: ./setup-ssl.sh --domain YOUR_DOMAIN"
fi

# --------------- summary ------------------------------------------------------
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Deployment Complete${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
if [[ -n "$DOMAIN" && "$ENABLE_SSL" == true ]]; then
    echo -e "  Application: ${GREEN}https://${DOMAIN}${NC}"
else
    echo -e "  Application: ${GREEN}http://${VPS_HOST}:3000${NC}"
    echo -e "  Via Nginx:   ${GREEN}http://${VPS_HOST}${NC}"
fi
echo ""
echo "  Useful commands (run on VPS):"
echo "    cd ${VPS_DEPLOY_PATH}/deployment"
echo "    docker compose ps              # check status"
echo "    docker compose logs -f app     # view app logs"
echo "    docker compose logs -f nginx   # view nginx logs"
echo "    docker compose exec app sh -c 'cd /app && npx prisma migrate deploy'  # run migrations"
echo "    docker compose restart app     # restart app"
echo ""
