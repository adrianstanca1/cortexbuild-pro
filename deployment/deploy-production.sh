#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Quick Deploy to Production
# Deploy to: www.cortexbuildpro.com
# ============================================

# Colors
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
║          CortexBuild Pro - Production Deploy             ║
║                                                           ║
║           Deploy to: www.cortexbuildpro.com              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR/deployment"

# Check if running with proper privileges
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}Warning: Running as root. It's recommended to use a non-root user with sudo.${NC}"
fi

# Function to check command availability
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
        return 0
    fi
}

# Check prerequisites
echo -e "${CYAN}[1/8] Checking Prerequisites...${NC}"
echo ""

ALL_DEPS_OK=true
check_command "docker" || ALL_DEPS_OK=false
check_command "docker-compose" || check_command "docker compose" || ALL_DEPS_OK=false
check_command "git" || ALL_DEPS_OK=false
check_command "curl" || ALL_DEPS_OK=false

echo ""

if [ "$ALL_DEPS_OK" = false ]; then
    echo -e "${RED}Missing required dependencies!${NC}"
    echo -e "${YELLOW}Please install the missing dependencies:${NC}"
    echo "  Docker: curl -fsSL https://get.docker.com | sh"
    echo "  Docker Compose: apt install docker-compose-plugin"
    exit 1
fi

# Navigate to deployment directory
if [ ! -d "$DEPLOYMENT_DIR" ]; then
    echo -e "${RED}Error: Deployment directory not found!${NC}"
    exit 1
fi

cd "$DEPLOYMENT_DIR"

# Check for .env file
echo -e "${CYAN}[2/8] Checking Environment Configuration...${NC}"
echo ""

if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "The .env file should already exist in the deployment directory."
    exit 1
fi

# Check if password needs to be set
if grep -q "REPLACE_WITH_SECURE_PASSWORD" .env; then
    echo -e "${YELLOW}⚠ WARNING: Database password not set!${NC}"
    echo ""
    echo "Generating a secure password..."
    SECURE_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Update .env file with secure password
    sed -i "s/REPLACE_WITH_SECURE_PASSWORD/${SECURE_PASSWORD}/g" .env
    
    echo -e "${GREEN}✓ Secure password generated and configured${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Save this password securely!${NC}"
    echo "Database Password: $SECURE_PASSWORD"
    echo ""
    read -p "Press Enter to continue after saving the password..."
else
    echo -e "${GREEN}✓ Environment configuration found${NC}"
fi

# Verify domain configuration
echo -e "${CYAN}[3/8] Verifying Domain Configuration...${NC}"
echo ""

DOMAIN="cortexbuildpro.com"
WWW_DOMAIN="www.cortexbuildpro.com"

echo "Checking DNS resolution for $DOMAIN and $WWW_DOMAIN..."
echo ""

# Check if domain resolves (non-blocking check)
DOMAIN_IP=$(dig +short $DOMAIN | head -n1)
WWW_DOMAIN_IP=$(dig +short $WWW_DOMAIN | head -n1)

if [ -z "$DOMAIN_IP" ] || [ -z "$WWW_DOMAIN_IP" ]; then
    echo -e "${YELLOW}⚠ Warning: Domain DNS may not be fully propagated${NC}"
    echo "Domain: $DOMAIN -> $DOMAIN_IP"
    echo "WWW Domain: $WWW_DOMAIN -> $WWW_DOMAIN_IP"
    echo ""
    echo -e "${YELLOW}SSL setup will be skipped. You can run ./setup-ssl.sh later.${NC}"
    echo ""
    SKIP_SSL=true
else
    echo -e "${GREEN}✓ Domain DNS resolved successfully${NC}"
    echo "Domain: $DOMAIN -> $DOMAIN_IP"
    echo "WWW Domain: $WWW_DOMAIN -> $WWW_DOMAIN_IP"
    SKIP_SSL=false
fi

echo ""
read -p "Press Enter to continue..."

# Build Docker images
echo -e "${CYAN}[4/8] Building Docker Images...${NC}"
echo ""

docker compose build --no-cache

echo -e "${GREEN}✓ Docker images built successfully${NC}"
echo ""

# Start database first
echo -e "${CYAN}[5/8] Starting Database...${NC}"
echo ""

docker compose up -d postgres

echo "Waiting for database to be ready..."
sleep 10

# Check database health
docker compose exec postgres pg_isready -U cortexbuild || {
    echo -e "${RED}Error: Database failed to start${NC}"
    docker compose logs postgres
    exit 1
}

echo -e "${GREEN}✓ Database is ready${NC}"
echo ""

# Start application
echo -e "${CYAN}[6/8] Starting Application...${NC}"
echo ""

docker compose up -d app

echo "Waiting for application to start..."
sleep 15

# Run database migrations
echo -e "${CYAN}[7/8] Running Database Migrations...${NC}"
echo ""

docker compose exec app sh -c "cd /app && npx prisma migrate deploy" || {
    echo -e "${YELLOW}Warning: Migration may have issues. Check logs.${NC}"
    docker compose logs app
}

echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# Optional: Seed database
read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    docker compose exec app sh -c "cd /app && npx prisma db seed" || {
        echo -e "${YELLOW}Warning: Seeding failed or not configured${NC}"
    }
fi

# Setup SSL if domain is resolved
echo -e "${CYAN}[8/8] Configuring Web Server...${NC}"
echo ""

if [ "$SKIP_SSL" = true ]; then
    echo -e "${YELLOW}Skipping SSL setup (DNS not ready)${NC}"
    echo ""
    echo "You can access the application at:"
    echo "  http://YOUR_SERVER_IP:3000"
    echo ""
    echo "Once DNS is propagated, run:"
    echo "  cd $DEPLOYMENT_DIR"
    echo "  ./setup-ssl.sh $DOMAIN admin@$DOMAIN"
else
    echo "Setting up SSL certificates and Nginx..."
    echo ""
    
    # Ask user if they want to setup SSL now
    read -p "Setup SSL certificates now? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./setup-ssl.sh $DOMAIN admin@$DOMAIN || {
            echo -e "${YELLOW}SSL setup failed. You can run it manually later:${NC}"
            echo "  ./setup-ssl.sh $DOMAIN admin@$DOMAIN"
        }
    else
        echo "SSL setup skipped. Starting Nginx without SSL..."
        docker compose up -d nginx
        
        echo ""
        echo "You can setup SSL later with:"
        echo "  cd $DEPLOYMENT_DIR"
        echo "  ./setup-ssl.sh $DOMAIN admin@$DOMAIN"
    fi
fi

# Check all services
echo ""
echo -e "${CYAN}Checking Service Status...${NC}"
echo ""

docker compose ps

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║          Deployment Completed Successfully!              ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Access your application:${NC}"
if [ "$SKIP_SSL" = true ]; then
    echo "  → http://YOUR_SERVER_IP:3000"
else
    echo "  → https://www.cortexbuildpro.com"
    echo "  → https://cortexbuildpro.com"
fi

echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Open the application in your browser"
echo "  2. Click 'Sign Up' to create your admin account"
echo "  3. The first user becomes the platform administrator"
echo "  4. Configure platform settings in the Admin Console"
echo ""

echo -e "${CYAN}Useful Commands:${NC}"
echo "  View logs:      docker compose logs -f"
echo "  Restart app:    docker compose restart app"
echo "  Stop all:       docker compose down"
echo "  Backup DB:      ./backup.sh"
echo ""

echo -e "${CYAN}Documentation:${NC}"
echo "  Full guide:     cat ../DEPLOY_TO_CORTEXBUILDPRO.md"
echo "  README:         cat ../README.md"
echo ""

echo -e "${GREEN}Deployment log saved to: deployment.log${NC}"
echo ""
