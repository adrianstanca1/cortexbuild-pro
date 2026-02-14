#!/bin/bash
# =============================================================================
# CortexBuild Pro - Full Remote Deployment (One-Shot)
# =============================================================================
# Deploys CortexBuild Pro to a VPS entirely over SSH.
# Installs Docker, clones repo, configures DB + nginx, builds & starts services.
#
# Usage:
#   ./remote-deploy-full.sh
#   ./remote-deploy-full.sh --host YOUR_VPS_IP --user root --password 'YourPass'
#   ./remote-deploy-full.sh --host YOUR_VPS_IP --domain cortexbuildpro.com --ssl
#
# This script requires: sshpass (installed automatically if missing on macOS/Linux)
# =============================================================================

set -euo pipefail

# --------------- configuration ------------------------------------------------
VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-root}"
VPS_PASS="${VPS_PASS:-}"
VPS_SSH_KEY="${VPS_SSH_KEY:-}"
VPS_PORT="${VPS_PORT:-22}"
INSTALL_DIR="/var/www/cortexbuild-pro"
REPO_URL="https://github.com/adrianstanca1/cortexbuild-pro.git"
REPO_BRANCH="main"
DOMAIN="${DOMAIN:-cortexbuildpro.com}"
ENABLE_SSL=false

# --------------- colours ------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

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
        --password)   VPS_PASS="$2"; shift 2 ;;
        --ssh-key)    VPS_SSH_KEY="$2"; shift 2 ;;
        --port)       VPS_PORT="$2"; shift 2 ;;
        --domain)     DOMAIN="$2"; shift 2 ;;
        --branch)     REPO_BRANCH="$2"; shift 2 ;;
        --ssl)        ENABLE_SSL=true; shift ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --host HOST        VPS IP or hostname (required)"
            echo "  --user USER        SSH user (default: root)"
            echo "  --password PASS    SSH password (or set VPS_PASS env var)"
            echo "  --ssh-key PATH     SSH private key path (key auth, no password prompt)"
            echo "  --port PORT        SSH port (default: 22)"
            echo "  --domain DOMAIN    Domain name (default: cortexbuildpro.com)"
            echo "  --branch BRANCH    Git branch to deploy (default: main)"
            echo "  --ssl              Enable SSL via Let's Encrypt after deploy"
            echo "  -h, --help         Show this help"
            exit 0
            ;;
        *) log_error "Unknown flag: $1"; exit 1 ;;
    esac
done

if [[ -z "$VPS_HOST" ]]; then
    log_error "VPS_HOST is required. Set via --host flag or VPS_HOST env var"
    exit 1
fi

# --------------- prompt for password if not provided --------------------------
if [[ -z "$VPS_PASS" && -z "$VPS_SSH_KEY" ]]; then
    if [[ -t 0 ]]; then
        read -rsp "SSH password for ${VPS_USER}@${VPS_HOST}: " VPS_PASS
        echo ""
    else
        log_error "No authentication method provided in non-interactive mode. Set VPS_PASS or VPS_SSH_KEY."
        exit 1
    fi
fi

# --------------- install sshpass if needed ------------------------------------
if [[ -z "$VPS_SSH_KEY" ]] && ! command -v sshpass >/dev/null 2>&1; then
    log_info "Installing sshpass..."
    if [[ "$(uname)" == "Darwin" ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get install -y sshpass 2>/dev/null || sudo yum install -y sshpass
    fi
fi

# --------------- SSH helper using SSHPASS env var -----------------------------
if [[ -n "$VPS_PASS" ]]; then
    export SSHPASS="$VPS_PASS"
fi

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=30 -p ${VPS_PORT}"
if [[ -n "$VPS_SSH_KEY" ]]; then
    SSH_OPTS+=" -i ${VPS_SSH_KEY}"
fi

ssh_wrapper() {
    if [[ -n "$VPS_SSH_KEY" ]]; then
        ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "$@"
    else
        sshpass -e ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "$@"
    fi
}

run_remote() {
    if [[ -n "$VPS_SSH_KEY" ]]; then
        ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "bash -s"
    else
        sshpass -e ssh $SSH_OPTS "${VPS_USER}@${VPS_HOST}" "bash -s"
    fi
}

# --------------- step 1: test connectivity ------------------------------------
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  CortexBuild Pro - Full VPS Deployment ${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

log_info "Step 1/7: Testing VPS connectivity..."

if ! ssh_wrapper "echo connected" >/dev/null 2>&1; then
    log_error "Cannot connect to ${VPS_USER}@${VPS_HOST}:${VPS_PORT}"
    log_error "Check IP, credentials, and that SSH is enabled on the VPS."
    exit 1
fi
log_success "Connected to ${VPS_USER}@${VPS_HOST}"

# --------------- step 2: system setup & Docker install ------------------------
log_info "Step 2/7: Installing system dependencies & Docker..."

run_remote << 'REMOTE_SETUP'
set -e
export DEBIAN_FRONTEND=noninteractive

echo ">>> Updating system packages..."
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

echo ">>> Installing prerequisites..."
apt-get install -y curl git ufw

echo ">>> Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ">>> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker already installed: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin
fi

echo ">>> Docker $(docker --version)"
echo ">>> $(docker compose version)"
echo ">>> System setup complete"
REMOTE_SETUP

log_success "System dependencies & Docker ready"

# --------------- step 3: clone / update repository ----------------------------
log_info "Step 3/7: Cloning repository..."

run_remote << REMOTE_CLONE
set -e
if [ ! -d "${INSTALL_DIR}" ]; then
    echo ">>> Cloning repository..."
    mkdir -p /var/www
    cd /var/www
    git clone ${REPO_URL} cortexbuild-pro
    cd cortexbuild-pro
    git checkout ${REPO_BRANCH}
    echo ">>> Repository cloned to ${INSTALL_DIR}"
else
    echo ">>> Repository exists, pulling latest..."
    cd ${INSTALL_DIR}
    git fetch origin
    git checkout ${REPO_BRANCH}
    git pull origin ${REPO_BRANCH} || echo "Pull failed, continuing with current state"
    echo ">>> Repository updated"
fi
REMOTE_CLONE

log_success "Repository ready at ${INSTALL_DIR}"

# --------------- step 4: configure environment --------------------------------
log_info "Step 4/7: Configuring environment variables..."

run_remote << REMOTE_ENV
set -e
cd ${INSTALL_DIR}/deployment

if [ ! -f .env ]; then
    echo ">>> Creating .env from template..."
    cp .env.example .env

    # Generate secure credentials
    POSTGRES_PASS=\$(openssl rand -base64 24 | tr -d '/+=')
    AUTH_SECRET=\$(openssl rand -base64 32)
    ENC_KEY=\$(openssl rand -hex 32)

    # Set credentials
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=\${POSTGRES_PASS}|" .env
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\${AUTH_SECRET}|" .env
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\${ENC_KEY}|" .env

    # Set domain
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://www.${DOMAIN}|" .env
    sed -i "s|NEXT_PUBLIC_WEBSOCKET_URL=.*|NEXT_PUBLIC_WEBSOCKET_URL=https://www.${DOMAIN}|" .env
    sed -i "s|DOMAIN=.*|DOMAIN=${DOMAIN}|" .env
    sed -i "s|SSL_EMAIL=.*|SSL_EMAIL=admin@${DOMAIN}|" .env

    chmod 600 .env
    echo ">>> .env created with secure auto-generated credentials"
else
    echo ">>> .env already exists, keeping current configuration"
fi

echo ">>> Environment configured"
REMOTE_ENV

log_success "Environment configured"

# --------------- step 5: build & start database -------------------------------
log_info "Step 5/7: Building Docker image & starting database..."

run_remote << REMOTE_BUILD
set -e
cd ${INSTALL_DIR}/deployment

echo ">>> Stopping any existing services..."
docker compose down --remove-orphans 2>/dev/null || true

echo ">>> Building Docker image (this may take 5-10 minutes on first run)..."
docker compose build --no-cache app

echo ">>> Starting PostgreSQL database..."
docker compose up -d db
echo ">>> Waiting for database to be healthy..."

MAX_RETRIES=30
RETRY=0
while [ \$RETRY -lt \$MAX_RETRIES ]; do
    if docker compose exec -T db pg_isready -U cortexbuild >/dev/null 2>&1; then
        echo ">>> Database is ready"
        break
    fi
    RETRY=\$((RETRY + 1))
    echo "  Waiting for DB... attempt \$RETRY/\$MAX_RETRIES"
    sleep 5
done

if [ \$RETRY -ge \$MAX_RETRIES ]; then
    echo "ERROR: Database did not become healthy"
    docker compose logs db
    exit 1
fi
REMOTE_BUILD

log_success "Docker image built & database running"

# --------------- step 6: start app & nginx ------------------------------------
log_info "Step 6/7: Starting application & nginx..."

run_remote << REMOTE_START
set -e
cd ${INSTALL_DIR}/deployment

echo ">>> Starting application..."
docker compose up -d app

echo ">>> Waiting for application health check..."
MAX_RETRIES=40
RETRY=0
while [ \$RETRY -lt \$MAX_RETRIES ]; do
    STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [ "\$STATUS" = "200" ]; then
        echo ">>> Application is healthy (HTTP 200)"
        break
    fi
    RETRY=\$((RETRY + 1))
    echo "  Waiting... attempt \$RETRY/\$MAX_RETRIES (status: \$STATUS)"
    sleep 10
done

if [ \$RETRY -ge \$MAX_RETRIES ]; then
    echo "WARNING: App did not become healthy within timeout"
    echo "--- Recent logs ---"
    docker compose logs --tail=40 app
    echo "Continuing anyway..."
fi

echo ">>> Running database migrations..."
docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy" || \
    echo "WARNING: Migrations may have failed or already been applied"

echo ">>> Starting Nginx reverse proxy..."
docker compose up -d nginx
sleep 5

echo ""
echo "=== Container Status ==="
docker compose ps
echo ""
echo "=== Quick Health Check ==="
curl -s http://localhost/api/health || echo "(nginx may still be starting)"
echo ""
REMOTE_START

log_success "Application & Nginx running"

# --------------- step 7: SSL setup (optional) ---------------------------------
if [[ "$ENABLE_SSL" == true ]]; then
    log_info "Step 7/7: Setting up SSL for ${DOMAIN}..."

    run_remote << REMOTE_SSL
set -e
cd ${INSTALL_DIR}/deployment

echo ">>> Requesting SSL certificate for ${DOMAIN}..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@${DOMAIN} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN} \
    -d www.${DOMAIN} || {
        echo "WARNING: Certbot failed. DNS may not be pointing to this server yet."
        echo "After DNS propagation, run manually:"
        echo "  cd ${INSTALL_DIR}/deployment && ./setup-ssl.sh ${DOMAIN}"
        exit 0
    }

echo ">>> Switching to SSL nginx configuration..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx
docker compose restart app
sleep 5

echo ">>> SSL enabled"
docker compose ps
REMOTE_SSL

    log_success "SSL configured for ${DOMAIN}"
else
    log_info "Step 7/7: Skipping SSL (use --ssl flag to enable, or run setup-ssl.sh on VPS later)"
fi

# --------------- summary ------------------------------------------------------
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
if [[ "$ENABLE_SSL" == true ]]; then
    echo -e "  Application: ${GREEN}https://www.${DOMAIN}${NC}"
else
    echo -e "  Application: ${GREEN}http://${VPS_HOST}${NC}"
    echo -e "  Direct:      ${GREEN}http://${VPS_HOST}:3000${NC}"
fi
echo ""
echo "  SSH into VPS:  ssh ${VPS_USER}@${VPS_HOST}"
echo ""
echo "  Useful commands (on VPS):"
echo "    cd ${INSTALL_DIR}/deployment"
echo "    docker compose ps              # check status"
echo "    docker compose logs -f app     # view app logs"
echo "    docker compose logs -f nginx   # view nginx logs"
echo "    docker compose restart app     # restart app"
echo "    ./setup-ssl.sh ${DOMAIN}       # setup SSL later"
echo ""
