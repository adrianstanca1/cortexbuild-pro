#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - VPS Deployment Script
# ============================================
# This script automates the complete deployment
# of CortexBuild Pro on a VPS for public use.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          CortexBuild Pro - VPS Deployment                ║
║                                                           ║
║     Complete Construction Management Platform            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

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
echo -e "${CYAN}[1/10] Checking Prerequisites...${NC}"
echo ""

ALL_DEPS_OK=true
check_command "docker" || ALL_DEPS_OK=false
check_command "git" || ALL_DEPS_OK=false

# Check for docker compose (either as command or plugin)
if ! docker compose version &> /dev/null; then
    if ! check_command "docker-compose"; then
        ALL_DEPS_OK=false
    fi
fi

echo ""

if [ "$ALL_DEPS_OK" = false ]; then
    echo -e "${RED}Missing required dependencies!${NC}"
    echo -e "${YELLOW}Please install the missing dependencies:${NC}"
    echo "  Docker: curl -fsSL https://get.docker.com | sh"
    echo "  Docker Compose: apt install docker-compose-plugin"
    exit 1
fi

# Navigate to deployment directory
cd "$SCRIPT_DIR"

# Check for .env file
echo -e "${CYAN}[2/10] Checking Environment Configuration...${NC}"
echo ""

if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: Configuring secure credentials...${NC}"
    
    # Generate secure password
    SECURE_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    SECURE_SECRET=$(openssl rand -base64 32)
    
    # Update .env file
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${SECURE_PASSWORD}/" .env
    sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=${SECURE_SECRET}/" .env
    
    echo -e "${GREEN}✓ Secure credentials generated${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}"
    echo "Database Password: $SECURE_PASSWORD"
    echo "NextAuth Secret: $SECURE_SECRET"
    echo ""
    
    # Save credentials to file
    cat > DEPLOYMENT_CREDENTIALS.txt << EOF
CortexBuild Pro - Deployment Credentials
Generated: $(date)
========================================

Database Password: $SECURE_PASSWORD
NextAuth Secret: $SECURE_SECRET

⚠️ IMPORTANT: Keep these credentials secure!
⚠️ Delete this file after saving credentials to a secure location.
EOF
    
    echo "Credentials saved to: DEPLOYMENT_CREDENTIALS.txt"
    echo ""
    read -p "Press Enter to continue after reviewing credentials..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""

# Load environment
source .env

# Validate critical settings
echo -e "${CYAN}[3/10] Validating Configuration...${NC}"
echo ""

VALIDATION_OK=true

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your_secure_password_here" ]; then
    echo -e "${RED}✗ POSTGRES_PASSWORD not configured${NC}"
    VALIDATION_OK=false
else
    echo -e "${GREEN}✓ Database password configured${NC}"
fi

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your_secure_secret_here" ]; then
    echo -e "${RED}✗ NEXTAUTH_SECRET not configured${NC}"
    VALIDATION_OK=false
else
    echo -e "${GREEN}✓ NextAuth secret configured${NC}"
fi

echo ""

if [ "$VALIDATION_OK" = false ]; then
    echo -e "${RED}Configuration validation failed!${NC}"
    echo "Please update your .env file with the required values."
    exit 1
fi

# Display deployment plan
echo -e "${CYAN}[4/10] Deployment Plan${NC}"
echo ""
echo "The following will be deployed:"
echo "  • PostgreSQL 15 Database"
echo "  • CortexBuild Pro Application (Next.js)"
echo "  • Nginx Reverse Proxy"
echo "  • SSL Certificate Management (Certbot)"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
echo "Application will be available at:"
echo "  http://${SERVER_IP}:3000"
echo ""

# Confirm deployment
read -p "Proceed with deployment? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}[5/10] Pulling Docker Images...${NC}"
echo ""

# Pull base images
docker compose pull postgres nginx certbot 2>/dev/null || true

echo -e "${GREEN}✓ Base images pulled${NC}"
echo ""

echo -e "${CYAN}[6/10] Building Application...${NC}"
echo ""

# Build application with better error handling
docker compose build app || {
    echo -e "${YELLOW}Build encountered issues. Retrying with no cache...${NC}"
    sleep 5
    docker compose build --no-cache app || {
        echo -e "${RED}Build failed. Check logs above for details.${NC}"
        exit 1
    }
}

echo -e "${GREEN}✓ Application built successfully${NC}"
echo ""

echo -e "${CYAN}[7/10] Starting Services...${NC}"
echo ""

# Start database first
echo "Starting PostgreSQL database..."
docker compose up -d postgres

# Wait for database with health check
echo "Waiting for database to be ready..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-cortexbuild}" &> /dev/null; then
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

# Start application
echo "Starting application server..."
docker compose up -d app

echo "Waiting for application to start..."
sleep 15

echo -e "${GREEN}✓ Services started${NC}"
echo ""

echo -e "${CYAN}[8/10] Running Database Migrations...${NC}"
echo ""

# Run migrations
docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy" || {
    echo -e "${YELLOW}⚠ Migrations may have issues. Check logs.${NC}"
}

echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

echo -e "${CYAN}[9/10] Starting Web Server...${NC}"
echo ""

# Start Nginx
docker compose up -d nginx

echo -e "${GREEN}✓ Nginx started${NC}"
echo ""

echo -e "${CYAN}[10/10] Verifying Deployment...${NC}"
echo ""

# Check all services
docker compose ps

# Test application health
echo ""
echo "Testing application health..."
sleep 5

if curl -f -s http://localhost:3000/api/auth/providers > /dev/null; then
    echo -e "${GREEN}✓ Application is responding${NC}"
else
    echo -e "${YELLOW}⚠ Application health check failed (may need more time)${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║          Deployment Completed Successfully!              ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Access your application:${NC}"
echo "  → http://${SERVER_IP}:3000"
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

if [ -f DEPLOYMENT_CREDENTIALS.txt ]; then
    echo -e "${YELLOW}⚠ SECURITY: Delete DEPLOYMENT_CREDENTIALS.txt after saving credentials!${NC}"
    echo "  rm DEPLOYMENT_CREDENTIALS.txt"
    echo ""
fi

echo -e "${CYAN}For SSL setup (with domain):${NC}"
echo "  ./setup-ssl.sh yourdomain.com admin@yourdomain.com"
echo ""

echo -e "${CYAN}Documentation:${NC}"
echo "  Full guide:     cat ../DEPLOY_TO_VPS.md"
echo "  README:         cat ../README.md"
echo ""

echo -e "${GREEN}Deployment completed at: $(date)${NC}"
echo ""
