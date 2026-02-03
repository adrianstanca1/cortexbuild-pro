#!/bin/bash
# =================================================================
# CortexBuild Pro - Docker Manager (Portainer) Deployment Script
# =================================================================
# This script helps deploy CortexBuild Pro using Docker Manager/Portainer
# Run this on your VPS where Docker Manager is installed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}CortexBuild Pro - Docker Manager Setup${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root or with sudo${NC}"
  exit 1
fi

# Configuration
PROJECT_DIR="/root/cortexbuild_pro"
DEPLOYMENT_DIR="$PROJECT_DIR/deployment"

# Step 1: Check Docker installation
echo -e "${YELLOW}Step 1: Verifying Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}✓ Docker is installed${NC}"
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose plugin...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin
fi
echo -e "${GREEN}✓ Docker Compose is available${NC}"
echo ""

# Step 2: Build the Docker image
echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
cd "$DEPLOYMENT_DIR"

docker build -t cortexbuild-app:latest -f Dockerfile ..

# Tag with timestamp for backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker tag cortexbuild-app:latest cortexbuild-app:$TIMESTAMP

echo -e "${GREEN}✓ Image built: cortexbuild-app:latest${NC}"
echo -e "${GREEN}✓ Backup tag: cortexbuild-app:$TIMESTAMP${NC}"
echo ""

# Step 3: Check environment file
echo -e "${YELLOW}Step 3: Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        echo "Copying .env.production to .env"
        cp .env.production .env
    else
        echo -e "${RED}Error: No .env or .env.production file found${NC}"
        echo "Please create a .env file with required configuration"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Environment file exists${NC}"
echo ""

# Step 4: Display deployment options
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Deployment Options${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "You have two deployment options:"
echo ""
echo -e "${GREEN}Option 1: Docker Compose (Simple)${NC}"
echo "  Run: docker compose up -d"
echo ""
echo -e "${GREEN}Option 2: Docker Manager/Portainer (Recommended)${NC}"
echo "  Steps:"
echo "  1. Access your Docker Manager/Portainer UI"
echo "  2. Go to 'Stacks' and click 'Add Stack'"
echo "  3. Name: cortexbuild-pro"
echo "  4. Build method: Upload or Repository"
echo "  5. Select docker-stack.yml file"
echo "  6. Add environment variables from portainer-stack-env.txt"
echo "  7. Click 'Deploy the stack'"
echo ""
echo -e "${GREEN}Option 3: Docker Swarm Stack${NC}"
echo "  Initialize swarm: docker swarm init"
echo "  Deploy stack: docker stack deploy -c docker-stack.yml cortexbuild"
echo ""

# Step 5: Interactive deployment
read -p "Would you like to deploy using Docker Compose now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deploying with Docker Compose...${NC}"
    
    # Stop existing containers
    docker compose down 2>/dev/null || true
    
    # Start services
    docker compose up -d
    
    echo -e "${GREEN}✓ Services started${NC}"
    echo ""
    
    # Wait for database
    echo -e "${YELLOW}Waiting for database to be ready...${NC}"
    sleep 20
    
    # Run migrations
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker compose exec -T app npx prisma migrate deploy || echo "Migrations may need retry"
    
    # Show status
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}Deployment Complete!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    docker compose ps
    echo ""
    echo -e "${BLUE}Access your application at: http://localhost:3000${NC}"
    echo -e "${BLUE}Or via your server IP: http://$(hostname -I | awk '{print $1}'):3000${NC}"
    echo ""
fi

# Step 6: Display next steps
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Next Steps & Useful Commands${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "  docker compose logs -f app"
echo ""
echo -e "${YELLOW}Check status:${NC}"
echo "  docker compose ps"
echo "  docker ps"
echo ""
echo -e "${YELLOW}Restart application:${NC}"
echo "  docker compose restart app"
echo ""
echo -e "${YELLOW}Update application:${NC}"
echo "  git pull"
echo "  ./docker-manager-deploy.sh"
echo ""
echo -e "${YELLOW}View in Docker Manager:${NC}"
echo "  Access Portainer UI and go to 'Containers' or 'Stacks'"
echo ""
echo -e "${YELLOW}Database migrations:${NC}"
echo "  docker compose exec app npx prisma migrate deploy"
echo ""
echo -e "${YELLOW}Seed database (first time):${NC}"
echo "  docker compose exec app npx prisma db seed"
echo ""

echo -e "${GREEN}Setup complete!${NC}"
