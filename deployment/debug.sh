#!/bin/bash
# =================================================================
# CortexBuild Pro - Debug & Diagnostics Script
# =================================================================
# Use this script to debug deployment issues
# =================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       CortexBuild Pro - Debug & Diagnostics                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# System Info
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  System Information${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${BLUE}OS:${NC}"
cat /etc/os-release 2>/dev/null | head -3 || echo "Unable to determine OS"
echo ""

echo -e "${BLUE}Memory:${NC}"
free -h
echo ""

echo -e "${BLUE}Disk Space:${NC}"
df -h / | tail -1
echo ""

echo -e "${BLUE}CPU:${NC}"
nproc
echo ""

# Docker Status
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Docker Status${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker is installed${NC}"
    docker --version
    echo ""
    
    echo -e "${BLUE}Docker Info:${NC}"
    docker info 2>/dev/null | head -10 || echo "Unable to get Docker info"
    echo ""
    
    if docker compose version &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose is available${NC}"
        docker compose version
    else
        echo -e "${RED}✗ Docker Compose not available${NC}"
    fi
else
    echo -e "${RED}✗ Docker is not installed${NC}"
fi
echo ""

# Container Status
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Container Status${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${BLUE}All Running Containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No containers running"
echo ""

echo -e "${BLUE}CortexBuild Containers:${NC}"
docker ps -a --filter "name=cortexbuild" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No CortexBuild containers"
echo ""

# Application Health
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Application Health${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${BLUE}Checking http://localhost:3000...${NC}"
if curl -fsS "http://localhost:3000/" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is responding${NC}"
    HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "http://localhost:3000/")
    echo "  HTTP Status: $HTTP_CODE"
else
    echo -e "${RED}✗ Application is not responding${NC}"
fi
echo ""

echo -e "${BLUE}Checking API health endpoint...${NC}"
if curl -fsS "http://localhost:3000/api/auth/providers" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ API is responding${NC}"
else
    echo -e "${YELLOW}⚠ API health check failed (may be normal during startup)${NC}"
fi
echo ""

# Database Health
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Database Status${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if docker ps --filter "name=cortexbuild-db" --format "{{.Names}}" | grep -q cortexbuild; then
    echo -e "${GREEN}✓ Database container is running${NC}"
    
    # Check if we can connect
    if docker exec cortexbuild-db pg_isready -U cortexbuild 2>/dev/null; then
        echo -e "${GREEN}✓ Database is accepting connections${NC}"
    else
        echo -e "${RED}✗ Database not accepting connections${NC}"
    fi
else
    echo -e "${RED}✗ Database container is not running${NC}"
fi
echo ""

# Logs
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Recent Logs (last 30 lines)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${BLUE}Application Logs:${NC}"
docker logs cortexbuild-app --tail=30 2>/dev/null || echo "No app container logs available"
echo ""

# Network
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Network Status${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${BLUE}Server IP:${NC}"
hostname -I | awk '{print $1}'
echo ""

echo -e "${BLUE}Listening Ports:${NC}"
ss -tlnp | grep -E '3000|5432|9000|8000' || echo "No relevant ports found"
echo ""

echo -e "${BLUE}Docker Networks:${NC}"
docker network ls 2>/dev/null || echo "Unable to list Docker networks"
echo ""

# Environment Check
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Environment Configuration${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    echo -e "${BLUE}Environment variables (sensitive values hidden):${NC}"
    grep -v -E '(PASSWORD|SECRET|KEY)' "$SCRIPT_DIR/.env" 2>/dev/null | head -10 || true
    echo "..."
else
    echo -e "${RED}✗ No .env file found in $SCRIPT_DIR${NC}"
fi
echo ""

# Docker Images
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Docker Images${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${BLUE}CortexBuild Images:${NC}"
docker images cortexbuild-app --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" 2>/dev/null || echo "No images found"
echo ""

# Resource Usage
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Resource Usage${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null | head -5 || echo "Unable to get stats"
echo ""

# Summary
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     Debug Summary                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Quick Fixes:${NC}"
echo ""
echo "  If app is not responding:"
echo "    docker compose logs app"
echo "    docker compose restart app"
echo ""
echo "  If database is not connecting:"
echo "    docker compose logs db"
echo "    docker compose restart db"
echo ""
echo "  To rebuild everything fresh:"
echo "    ./clean-build-deploy.sh"
echo ""
echo "  To redeploy to VPS:"
echo "    ./vps-public-deploy.sh"
echo ""
echo "  For Windmill automation:"
echo "    Import windmill-deploy-flow.yaml"
echo ""
