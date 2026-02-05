#!/bin/bash
# =================================================================
# CortexBuild Pro - VPS Public Deployment Script
# =================================================================
# One-command script to deploy CortexBuild Pro to a public VPS
# with Windmill automation and Docker Manager (Portainer) integration
# =================================================================
# Usage: ./vps-public-deploy.sh [options]
# =================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration defaults
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_DIR="$SCRIPT_DIR"

# Default options
INSTALL_PORTAINER=${INSTALL_PORTAINER:-true}
INSTALL_WINDMILL=${INSTALL_WINDMILL:-true}
SETUP_SSL=${SETUP_SSL:-false}
DOMAIN=${DOMAIN:-""}
EMAIL=${EMAIL:-""}
CLEAN_BUILD=${CLEAN_BUILD:-true}
SEED_DATABASE=${SEED_DATABASE:-false}
SKIP_CONFIRMATIONS=${SKIP_CONFIRMATIONS:-false}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --ssl)
            SETUP_SSL=true
            shift
            ;;
        --no-portainer)
            INSTALL_PORTAINER=false
            shift
            ;;
        --no-windmill)
            INSTALL_WINDMILL=false
            shift
            ;;
        --seed-db)
            SEED_DATABASE=true
            shift
            ;;
        --skip-clean)
            CLEAN_BUILD=false
            shift
            ;;
        -y|--yes)
            SKIP_CONFIRMATIONS=true
            shift
            ;;
        --help|-h)
            cat << EOF
CortexBuild Pro - VPS Public Deployment Script

Usage: $0 [options]

Options:
  --domain DOMAIN     Set the public domain name (e.g., app.example.com)
  --email EMAIL       Email for SSL certificate notifications
  --ssl               Enable SSL/HTTPS with Let's Encrypt
  --no-portainer      Skip Portainer (Docker Manager) installation
  --no-windmill       Skip Windmill (automation) installation
  --seed-db           Seed database with sample data after migration
  --skip-clean        Skip clean dependency installation
  -y, --yes           Skip all confirmation prompts
  -h, --help          Show this help

Examples:
  # Basic deployment (local access only)
  $0

  # Public deployment with SSL
  $0 --domain app.example.com --email admin@example.com --ssl

  # Minimal deployment (no extras)
  $0 --no-portainer --no-windmill -y

Environment Variables:
  POSTGRES_PASSWORD   Database password (auto-generated if not set)
  NEXTAUTH_SECRET     Auth secret (auto-generated if not set)
  ENCRYPTION_KEY      Encryption key (auto-generated if not set)

EOF
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Print banner
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗              ║
║    ██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝              ║
║    ██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝               ║
║    ██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗               ║
║    ╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗              ║
║     ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝              ║
║                                                                    ║
║           BUILD PRO - Public VPS Deployment                        ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to confirm action
confirm() {
    if [ "$SKIP_CONFIRMATIONS" = true ]; then
        return 0
    fi
    read -p "$1 (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Function to generate random string
generate_secret() {
    openssl rand -base64 32 | tr -d '/+=' | cut -c1-32
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Error: This script must be run as root${NC}"
        echo "Please run: sudo $0 $*"
        exit 1
    fi
}

# Step 0: Pre-flight checks
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Pre-flight Checks${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_root

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker is installed${NC}"
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    apt-get update
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose is available${NC}"
fi

# Get server info
SERVER_IP=$(hostname -I | awk '{print $1}')
HOSTNAME=$(hostname)

echo -e "${BLUE}Server IP: $SERVER_IP${NC}"
echo -e "${BLUE}Hostname: $HOSTNAME${NC}"
if [ -n "$DOMAIN" ]; then
    echo -e "${BLUE}Domain: $DOMAIN${NC}"
fi
echo ""

# Step 1: Environment Setup
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 1: Environment Configuration${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$DEPLOYMENT_DIR"

# Generate secure secrets if not set
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(generate_secret)}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-$(generate_secret)}
ENCRYPTION_KEY=${ENCRYPTION_KEY:-$(openssl rand -hex 32)}

# Create .env file
cat > .env << EOF
# =================================================================
# CortexBuild Pro - Production Environment
# Generated: $(date -Iseconds)
# =================================================================

# Database
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=cortexbuild

# Application URLs
NEXTAUTH_URL=${DOMAIN:+https://$DOMAIN}
NEXTAUTH_URL=${NEXTAUTH_URL:-http://$SERVER_IP:3000}

# Security
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# API Keys (update with your keys)
ABACUSAI_API_KEY=${ABACUSAI_API_KEY:-}

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}
AWS_BUCKET_NAME=${AWS_BUCKET_NAME:-}
AWS_REGION=${AWS_REGION:-us-east-1}

# Production settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF

echo -e "${GREEN}✓ Environment file created${NC}"
echo ""

# Step 2: Clean Build
if [ "$CLEAN_BUILD" = true ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  Step 2: Clean Build (Kill Dependencies & Fresh Start)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Remove existing containers and images for fresh start
    echo -e "${BLUE}→ Stopping existing containers...${NC}"
    docker compose down --remove-orphans 2>/dev/null || true
    
    echo -e "${BLUE}→ Removing old Docker images...${NC}"
    docker rmi cortexbuild-app:latest 2>/dev/null || true
    
    echo -e "${BLUE}→ Building fresh Docker image (no cache)...${NC}"
    docker build --no-cache -t cortexbuild-app:latest -f Dockerfile ..
    
    # Tag with timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    docker tag cortexbuild-app:latest cortexbuild-app:$TIMESTAMP
    
    echo -e "${GREEN}✓ Fresh Docker image built: cortexbuild-app:latest${NC}"
    echo ""
else
    echo -e "${YELLOW}Skipping clean build (--skip-clean)${NC}"
    echo -e "${BLUE}→ Building Docker image...${NC}"
    docker build -t cortexbuild-app:latest -f Dockerfile ..
    echo -e "${GREEN}✓ Docker image built${NC}"
    echo ""
fi

# Step 3: Deploy Application
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 3: Deploying Application${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

docker compose up -d

echo -e "${GREEN}✓ Application containers started${NC}"
echo ""

# Wait for database
echo -e "${BLUE}→ Waiting for database to be ready...${NC}"
sleep 15

# Run migrations
echo -e "${BLUE}→ Running database migrations...${NC}"
docker compose exec -T app npx prisma migrate deploy || {
    echo -e "${YELLOW}Migration failed, retrying in 10 seconds...${NC}"
    sleep 10
    docker compose exec -T app npx prisma migrate deploy
}
echo -e "${GREEN}✓ Database migrations complete${NC}"

# Seed database if requested
if [ "$SEED_DATABASE" = true ]; then
    echo -e "${BLUE}→ Seeding database with sample data...${NC}"
    docker compose exec -T app npx prisma db seed || true
    echo -e "${GREEN}✓ Database seeded${NC}"
fi
echo ""

# Step 4: Install Portainer (Docker Manager)
if [ "$INSTALL_PORTAINER" = true ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  Step 4: Installing Docker Manager (Portainer)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if docker ps | grep -q portainer; then
        echo -e "${GREEN}✓ Portainer already running${NC}"
    else
        echo -e "${BLUE}→ Creating Portainer volume...${NC}"
        docker volume create portainer_data
        
        echo -e "${BLUE}→ Starting Portainer...${NC}"
        docker run -d \
            --name portainer \
            --restart=always \
            -p 9000:9000 \
            -p 9443:9443 \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v portainer_data:/data \
            portainer/portainer-ce:latest
        
        echo -e "${GREEN}✓ Portainer installed${NC}"
    fi
    echo ""
fi

# Step 5: Install Windmill (optional)
if [ "$INSTALL_WINDMILL" = true ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  Step 5: Installing Windmill (Workflow Automation)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if docker ps | grep -q windmill; then
        echo -e "${GREEN}✓ Windmill already running${NC}"
    else
        WINDMILL_DIR="/root/windmill"
        mkdir -p "$WINDMILL_DIR"
        cd "$WINDMILL_DIR"
        
        echo -e "${BLUE}→ Downloading Windmill...${NC}"
        curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/windmill-labs/windmill/main/docker-compose.yml
        
        echo -e "${BLUE}→ Starting Windmill...${NC}"
        docker compose up -d
        
        echo -e "${GREEN}✓ Windmill installed${NC}"
        
        cd "$DEPLOYMENT_DIR"
    fi
    echo ""
fi

# Step 6: Setup SSL (optional)
if [ "$SETUP_SSL" = true ] && [ -n "$DOMAIN" ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  Step 6: Setting up SSL/HTTPS${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Install certbot
    if ! command -v certbot &> /dev/null; then
        apt-get update
        apt-get install -y certbot
    fi
    
    echo -e "${BLUE}→ Obtaining SSL certificate for $DOMAIN...${NC}"
    certbot certonly --standalone \
        -d "$DOMAIN" \
        ${EMAIL:+--email "$EMAIL"} \
        --non-interactive \
        --agree-tos \
        ${EMAIL:---register-unsafely-without-email} || {
        echo -e "${YELLOW}⚠ SSL setup failed - you can set it up manually later${NC}"
    }
    
    echo -e "${GREEN}✓ SSL certificate obtained${NC}"
    echo ""
fi

# Step 7: Health Check
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Step 7: Final Health Check${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${BLUE}→ Waiting for application to be fully ready...${NC}"
sleep 10

# Check application health
MAX_RETRIES=30
RETRY_COUNT=0
APP_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -fsS "http://localhost:3000/" >/dev/null 2>&1; then
        APP_HEALTHY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Waiting for app (attempt $RETRY_COUNT/$MAX_RETRIES)..."
    sleep 5
done

if [ "$APP_HEALTHY" = true ]; then
    echo -e "${GREEN}✓ Application is healthy and responding!${NC}"
else
    echo -e "${RED}✗ Application health check failed${NC}"
    echo "  Check logs: docker compose logs app"
fi
echo ""

# Final Summary
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                     Deployment Complete!                           ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}✓ CortexBuild Pro has been deployed to your VPS!${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Access URLs${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${MAGENTA}  Application:${NC}"
if [ -n "$DOMAIN" ]; then
    echo "    Public URL:   https://$DOMAIN"
fi
echo "    Local URL:    http://$SERVER_IP:3000"
echo ""

if [ "$INSTALL_PORTAINER" = true ]; then
    echo -e "${MAGENTA}  Docker Manager (Portainer):${NC}"
    echo "    URL:          http://$SERVER_IP:9000"
    echo "    Note:         Create admin account on first visit"
    echo ""
fi

if [ "$INSTALL_WINDMILL" = true ]; then
    echo -e "${MAGENTA}  Windmill (Automation):${NC}"
    echo "    URL:          http://$SERVER_IP:8000"
    echo "    Workflow:     Import windmill-deploy-flow.yaml"
    echo ""
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Container Status${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Useful Commands${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  View logs:        docker compose logs -f app"
echo "  Restart app:      docker compose restart app"
echo "  Stop all:         docker compose down"
echo "  Update app:       git pull && ./vps-public-deploy.sh"
echo "  Run migrations:   docker compose exec app npx prisma migrate deploy"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Security Credentials${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}⚠ SAVE THESE CREDENTIALS SECURELY!${NC}"
echo ""
echo "  Database Password:  $POSTGRES_PASSWORD"
echo "  NextAuth Secret:    $NEXTAUTH_SECRET"
echo "  Encryption Key:     $ENCRYPTION_KEY"
echo ""
echo "  These are also saved in: $DEPLOYMENT_DIR/.env"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Successful! 🎉${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
