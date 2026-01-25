#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Quick Deployment Script
# ============================================
# This script simplifies the deployment process
# by guiding you through the necessary steps.

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR/deployment"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          CortexBuild Pro - Quick Deploy                  ║
║                                                           ║
║     Complete Construction Management Platform            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}Warning: Running as root is not recommended.${NC}"
   read -p "Continue anyway? (y/N) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
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
echo -e "${CYAN}[1/6] Checking Prerequisites...${NC}"
echo ""

ALL_DEPS_OK=true
check_command "docker" || ALL_DEPS_OK=false
check_command "docker-compose" || ALL_DEPS_OK=false
check_command "git" || ALL_DEPS_OK=false

echo ""

if [ "$ALL_DEPS_OK" = false ]; then
    echo -e "${RED}Missing required dependencies!${NC}"
    echo -e "${YELLOW}Please install the missing dependencies and try again.${NC}"
    echo ""
    echo "Installation guides:"
    echo "  Docker: https://docs.docker.com/get-docker/"
    echo "  Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if deployment directory exists
if [ ! -d "$DEPLOYMENT_DIR" ]; then
    echo -e "${RED}Error: Deployment directory not found!${NC}"
    exit 1
fi

cd "$DEPLOYMENT_DIR"

# Check for .env file
echo -e "${CYAN}[2/6] Checking Environment Configuration...${NC}"
echo ""

if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT: You need to configure your environment variables!${NC}"
    echo ""
    echo "Required configurations:"
    echo "  1. POSTGRES_PASSWORD - Set a secure database password"
    echo "  2. NEXTAUTH_SECRET - Will be auto-generated if not set"
    echo "  3. NEXTAUTH_URL - Your domain URL (e.g., https://yourdomain.com)"
    echo "  4. DOMAIN - Your domain name"
    echo "  5. SSL_EMAIL - Your email for SSL certificates"
    echo ""
    echo -e "Edit the .env file now? ${YELLOW}(Recommended)${NC}"
    read -p "Open .env in nano? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        nano .env
    else
        echo -e "${YELLOW}Please edit deployment/.env before continuing with deployment.${NC}"
        echo "Then run this script again or use: ./deployment/deploy.sh"
        exit 0
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Load and validate environment
source .env

# Auto-generate NEXTAUTH_SECRET if needed
if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your_secure_secret_here" ]; then
    echo -e "${YELLOW}Generating secure NEXTAUTH_SECRET...${NC}"
    NEW_SECRET=$(openssl rand -base64 32)
    sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEW_SECRET/" .env
    export NEXTAUTH_SECRET=$NEW_SECRET
    echo -e "${GREEN}✓ Generated NEXTAUTH_SECRET${NC}"
fi

echo ""

# Validate critical settings
echo -e "${CYAN}[3/6] Validating Configuration...${NC}"
echo ""

VALIDATION_OK=true

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your_secure_password_here" ]; then
    echo -e "${RED}✗ POSTGRES_PASSWORD not configured${NC}"
    VALIDATION_OK=false
else
    echo -e "${GREEN}✓ Database password configured${NC}"
fi

if [ -z "$NEXTAUTH_URL" ] || [ "$NEXTAUTH_URL" = "https://your-domain.com" ]; then
    echo -e "${YELLOW}⚠ NEXTAUTH_URL not configured (will use default)${NC}"
else
    echo -e "${GREEN}✓ NEXTAUTH_URL configured${NC}"
fi

if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "your-domain.com" ]; then
    echo -e "${YELLOW}⚠ DOMAIN not configured (SSL setup will be skipped)${NC}"
else
    echo -e "${GREEN}✓ Domain configured${NC}"
fi

echo ""

if [ "$VALIDATION_OK" = false ]; then
    echo -e "${RED}Configuration validation failed!${NC}"
    echo "Please update your .env file with the required values."
    exit 1
fi

# Display deployment plan
echo -e "${CYAN}[4/6] Deployment Plan${NC}"
echo ""
echo "The following will be deployed:"
echo "  • PostgreSQL 15 Database"
echo "  • CortexBuild Pro Application (Next.js)"
echo "  • Nginx Reverse Proxy"
echo "  • Certbot (SSL Certificate Management)"
echo ""
echo "Application will be available at:"
if [ ! -z "$NEXTAUTH_URL" ] && [ "$NEXTAUTH_URL" != "https://your-domain.com" ]; then
    echo "  $NEXTAUTH_URL"
else
    echo "  http://localhost:3000 (development)"
fi
echo ""

# Confirm deployment
read -p "Proceed with deployment? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}[5/6] Starting Deployment...${NC}"
echo ""

# Run the main deployment script
if [ -f deploy.sh ]; then
    ./deploy.sh
else
    echo -e "${YELLOW}deploy.sh not found, running manual deployment...${NC}"
    
    # Pull images
    echo -e "${BLUE}Pulling Docker images...${NC}"
    docker-compose pull postgres nginx certbot 2>/dev/null || true
    
    # Build application
    echo -e "${BLUE}Building application...${NC}"
    docker-compose build app
    
    # Start services
    echo -e "${BLUE}Starting services...${NC}"
    docker-compose up -d
    
    # Wait for database
    echo -e "${BLUE}Waiting for database to be ready...${NC}"
    sleep 10
    
    # Run migrations
    echo -e "${BLUE}Running database migrations...${NC}"
    docker-compose exec -T app sh -c "cd /app && npx prisma migrate deploy" || echo "Migration may have failed - check logs"
fi

echo ""
echo -e "${CYAN}[6/6] Deployment Summary${NC}"
echo ""

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Services are running${NC}"
    echo ""
    echo "Container Status:"
    docker-compose ps
    echo ""
    
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}    Deployment Successful! 🎉${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next Steps:"
    echo ""
    echo "1. Access your application:"
    if [ ! -z "$NEXTAUTH_URL" ] && [ "$NEXTAUTH_URL" != "https://your-domain.com" ]; then
        echo "   → $NEXTAUTH_URL"
    else
        echo "   → http://localhost:3000"
    fi
    echo ""
    echo "2. View logs:"
    echo "   → docker-compose -f deployment/docker-compose.yml logs -f"
    echo ""
    echo "3. Check system health:"
    if [ ! -z "$NEXTAUTH_URL" ] && [ "$NEXTAUTH_URL" != "https://your-domain.com" ]; then
        echo "   → curl $NEXTAUTH_URL/api/auth/providers"
    else
        echo "   → curl http://localhost:3000/api/auth/providers"
    fi
    echo ""
    echo "4. Access database:"
    echo "   → docker-compose -f deployment/docker-compose.yml exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB"
    echo ""
    echo "5. Stop services:"
    echo "   → docker-compose -f deployment/docker-compose.yml down"
    echo ""
    
    if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
        echo "6. Set up SSL (if not done already):"
        echo "   → cd deployment && ./setup-ssl.sh $DOMAIN $SSL_EMAIL"
        echo ""
    fi
    
    echo "For more information, see:"
    echo "  • DEPLOYMENT_GUIDE.md"
    echo "  • README.md"
    echo ""
else
    echo -e "${RED}✗ Some services may not be running properly${NC}"
    echo ""
    echo "Check logs with:"
    echo "  docker-compose -f deployment/docker-compose.yml logs"
    echo ""
    echo "For troubleshooting, see DEPLOYMENT_GUIDE.md"
fi
