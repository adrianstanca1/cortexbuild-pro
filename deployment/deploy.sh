#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Deployment Script
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║     CortexBuild Pro - Deployment Tool     ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed.${NC}" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is required but not installed.${NC}" >&2; exit 1; }

# Check .env file
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Creating from template..."
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your settings:${NC}"
    echo "  nano .env"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}Error: POSTGRES_PASSWORD is not set in .env${NC}"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your_secure_secret_here" ]; then
    echo -e "${YELLOW}Generating NEXTAUTH_SECRET...${NC}"
    NEW_SECRET=$(openssl rand -base64 32)
    sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEW_SECRET/" .env
    export NEXTAUTH_SECRET=$NEW_SECRET
fi

echo -e "${GREEN}[1/7]${NC} Pulling latest images..."
docker-compose pull postgres nginx certbot 2>/dev/null || true

echo -e "${GREEN}[2/7]${NC} Building application image..."
docker-compose build --no-cache app

echo -e "${GREEN}[3/7]${NC} Stopping existing containers..."
docker-compose down 2>/dev/null || true

echo -e "${GREEN}[4/7]${NC} Starting database..."
docker-compose up -d postgres
echo "Waiting for database to be ready..."
sleep 10

echo -e "${GREEN}[5/7]${NC} Running database migrations..."
docker-compose run --rm app sh -c "npx prisma migrate deploy" || {
    echo -e "${YELLOW}Running initial migration...${NC}"
    docker-compose run --rm app sh -c "npx prisma db push"
}

echo -e "${GREEN}[6/7]${NC} Starting application..."
docker-compose up -d app
sleep 5

echo -e "${GREEN}[7/7]${NC} Starting nginx..."
docker-compose up -d nginx

# Health check
echo ""
echo "Checking application health..."
sleep 10
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Application is running!${NC}"
else
    echo -e "${YELLOW}⚠ Application may still be starting...${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}         Deployment Complete!               ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "Your app is running at: http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Configure SSL: ./setup-ssl.sh cortexbuildpro.com"
echo "  2. Seed the database: ./seed-db.sh"
echo "  3. Access at: https://${DOMAIN:-your-domain.com}"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f app     # View app logs"
echo "  docker-compose logs -f nginx   # View nginx logs"
echo "  docker-compose ps              # Container status"
echo "  docker-compose down            # Stop all services"
echo "  ./backup.sh                    # Backup database"
