#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - One-Command VPS Deployment
# ============================================
# Quick deployment script for VPS servers
# Usage: curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         CortexBuild Pro - VPS Quick Deploy               ║
║                                                           ║
║     Complete Construction Management Platform            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Set deployment directory
DEPLOY_DIR="/var/www/cortexbuild-pro"
REPO_URL="https://github.com/adrianstanca1/cortexbuild-pro.git"
BRANCH="main"

echo -e "${CYAN}[1/6] Checking Prerequisites...${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${YELLOW}This script should be run as root or with sudo${NC}"
   exit 1
fi

# Update system
echo "Updating system packages..."
apt-get update -qq

# Check and install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Check and install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

# Check and install Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Installing Git...${NC}"
    apt-get install -y git
    echo -e "${GREEN}✓ Git installed${NC}"
else
    echo -e "${GREEN}✓ Git already installed${NC}"
fi

echo ""
echo -e "${CYAN}[2/6] Configuring Firewall...${NC}"
echo ""

# Install and configure UFW firewall
if ! command -v ufw &> /dev/null; then
    apt-get install -y ufw
fi

# Set defaults and allow required ports before enabling firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 3000/tcp # Application port
ufw --force enable
echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${CYAN}[3/6] Cloning Repository...${NC}"
echo ""

# Create directory if it doesn't exist
mkdir -p /var/www
cd /var/www

# Clone or update repository
if [ -d "$DEPLOY_DIR" ]; then
    echo "Repository exists, updating..."
    cd "$DEPLOY_DIR"
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    git checkout $BRANCH
fi

echo -e "${GREEN}✓ Repository ready${NC}"

echo ""
echo -e "${CYAN}[4/6] Configuring Environment...${NC}"
echo ""

cd "$DEPLOY_DIR/deployment"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate secure passwords with fallback
    if command -v openssl >/dev/null 2>&1; then
        POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
    else
        echo -e "${YELLOW}Warning: openssl not found, generating credentials from /dev/urandom${NC}"
        POSTGRES_PASSWORD=$(head -c 48 /dev/urandom | base64 | tr -d "=+/" | cut -c1-32)
        NEXTAUTH_SECRET=$(head -c 48 /dev/urandom | base64)
    fi
    
    # Escape special characters for sed
    NEXTAUTH_SECRET_ESCAPED=$(printf '%s\n' "$NEXTAUTH_SECRET" | sed -e 's/[\/&]/\\&/g')
    
    # Update .env with generated values
    sed -i "s/your_secure_password_here/${POSTGRES_PASSWORD}/g" .env
    sed -i "s/your_secure_secret_here/${NEXTAUTH_SECRET_ESCAPED}/g" .env
    
    # Get server IP from local configuration (avoid external services)
    SERVER_IP=$(hostname -I | awk '{print $1}')
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="127.0.0.1"
    fi
    
    # Update NEXTAUTH_URL
    sed -i "s|https://your-domain.com|http://${SERVER_IP}:3000|g" .env
    
    echo -e "${GREEN}✓ Environment configured${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Save these credentials!${NC}"
    echo "Database Password: $POSTGRES_PASSWORD"
    echo "NextAuth Secret: (generated automatically)"
    echo ""
    echo "Configuration saved to: $DEPLOY_DIR/deployment/.env"
    echo ""
    # Only prompt if running in an interactive terminal
    if [ -t 0 ]; then
        read -p "Press Enter to continue..." </dev/tty
    fi
else
    echo -e "${GREEN}✓ Using existing environment configuration${NC}"
fi

echo ""
echo -e "${CYAN}[5/6] Deploying Application...${NC}"
echo ""

# Build and start services
echo "Building Docker images..."
docker compose build --no-cache app

echo "Starting services..."
docker compose up -d

# Wait for services to be ready
echo "Waiting for database to be ready..."
sleep 15

# Check if postgres is healthy
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose exec -T postgres pg_isready -U cortexbuild -d cortexbuild &> /dev/null; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo -n "."
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}⚠ Database health check timed out, but continuing...${NC}"
fi

# Run database migrations
echo "Running database migrations..."
docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy" || {
    echo -e "${YELLOW}⚠ Migration warning - check logs if needed${NC}"
}

echo -e "${GREEN}✓ Application deployed${NC}"

echo ""
echo -e "${CYAN}[6/6] Verifying Deployment...${NC}"
echo ""

# Check service status
docker compose ps

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║        ✅ Deployment Completed Successfully!             ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Access Your Application:${NC}"
echo ""
echo "  🌐 Main Application: http://${SERVER_IP}:3000"
echo "  👤 Admin Console:    http://${SERVER_IP}:3000/admin"
echo "  🔍 API Health:       http://${SERVER_IP}:3000/api/auth/providers"
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "1. Open the application in your browser"
echo "2. Click 'Sign Up' to create your first account"
echo "3. The first user becomes the platform administrator"
echo "4. Configure settings in the Admin Console"
echo ""

echo -e "${CYAN}Optional: Setup Domain & SSL${NC}"
echo ""
echo "If you have a domain pointing to this server:"
echo "  cd $DEPLOY_DIR/deployment"
echo "  ./setup-ssl.sh yourdomain.com admin@yourdomain.com"
echo ""

echo -e "${CYAN}Useful Commands:${NC}"
echo ""
echo "  View logs:      cd $DEPLOY_DIR/deployment && docker compose logs -f"
echo "  Restart app:    cd $DEPLOY_DIR/deployment && docker compose restart app"
echo "  Stop services:  cd $DEPLOY_DIR/deployment && docker compose down"
echo "  Backup DB:      cd $DEPLOY_DIR/deployment && ./backup.sh"
echo ""

echo -e "${CYAN}Configuration Location:${NC}"
echo "  $DEPLOY_DIR/deployment/.env"
echo ""

echo -e "${GREEN}Deployment completed at: $(date)${NC}"
echo ""
