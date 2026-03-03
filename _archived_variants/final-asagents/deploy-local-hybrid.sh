#!/bin/bash
# Quick Local Docker Test - Starts essential services only

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Local Docker Deployment Test${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from template...${NC}"
    cp .env.docker.template .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}Please edit .env with your configuration and run again${NC}"
    exit 0
fi

# Stop any running Java backend
if [ -f backend/java/application.pid ]; then
    echo -e "${YELLOW}Stopping local Java backend...${NC}"
    cd backend/java && ./deploy-local.sh stop && cd ../..
fi

# Start MySQL only (lightweight)
echo -e "${GREEN}[1/3] Starting MySQL...${NC}"
docker-compose -f docker-compose.full.yml up -d mysql
echo -e "${GREEN}✓ MySQL started${NC}"

# Wait for MySQL
echo -e "${YELLOW}Waiting for MySQL to be ready...${NC}"
sleep 10

# Start Node.js backend
echo -e "${GREEN}[2/3] Starting Node.js backend...${NC}"
docker-compose -f docker-compose.full.yml up -d node-backend
echo -e "${GREEN}✓ Node.js backend started${NC}"

# Start Java backend (local, not Docker)
echo -e "${GREEN}[3/3] Starting Java backend locally...${NC}"
cd backend/java && ./deploy-local.sh start && cd ../..
echo -e "${GREEN}✓ Java backend started${NC}"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Local Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Services running:"
echo -e "  ${GREEN}✓${NC} MySQL:         localhost:3306 (Docker)"
echo -e "  ${GREEN}✓${NC} Node.js API:   localhost:5001 (Docker)"
echo -e "  ${GREEN}✓${NC} Java API:      localhost:4001 (Native)"
echo ""
echo -e "Health checks:"
echo -e "  curl http://localhost:5001/api/health"
echo -e "  curl http://localhost:4001/actuator/health"
echo ""
echo -e "View logs:"
echo -e "  docker-compose -f docker-compose.full.yml logs -f node-backend"
echo -e "  tail -f backend/java/logs/application.log"
echo ""
echo -e "Stop services:"
echo -e "  docker-compose -f docker-compose.full.yml down"
echo -e "  cd backend/java && ./deploy-local.sh stop"
echo ""
