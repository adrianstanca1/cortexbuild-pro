#!/bin/bash
# =================================================================
# CortexBuild Pro - Clean Build and Deploy Script
# =================================================================
# This script kills all dependencies, reinstalls them fresh,
# builds for production, and deploys to public VPS with
# Windmill and Docker Manager integration
# =================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NEXTJS_DIR="$PROJECT_ROOT/nextjs_space"
DEPLOYMENT_DIR="$SCRIPT_DIR"

# Default settings
SKIP_DEPS_CLEAN=${SKIP_DEPS_CLEAN:-false}
SKIP_BUILD=${SKIP_BUILD:-false}
DEPLOY_TO_VPS=${DEPLOY_TO_VPS:-false}
VPS_HOST=${VPS_HOST:-""}
VPS_USER=${VPS_USER:-"root"}
DEBUG_MODE=${DEBUG_MODE:-false}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps-clean)
            SKIP_DEPS_CLEAN=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --deploy)
            DEPLOY_TO_VPS=true
            shift
            ;;
        --vps-host)
            VPS_HOST="$2"
            DEPLOY_TO_VPS=true
            shift 2
            ;;
        --vps-user)
            VPS_USER="$2"
            shift 2
            ;;
        --debug)
            DEBUG_MODE=true
            set -x
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-deps-clean   Skip cleaning and reinstalling dependencies"
            echo "  --skip-build        Skip building the Docker image"
            echo "  --deploy            Deploy to VPS after build"
            echo "  --vps-host HOST     VPS hostname or IP (enables --deploy)"
            echo "  --vps-user USER     VPS username (default: root)"
            echo "  --debug             Enable debug mode"
            echo "  --help, -h          Show this help"
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
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       CortexBuild Pro - Clean Build & Deploy System          ║"
echo "║                     Production Ready                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Clean Dependencies
if [ "$SKIP_DEPS_CLEAN" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Step 1: Cleaning Dependencies (Kill All & Start Fresh)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd "$NEXTJS_DIR"
    
    # Remove node_modules
    if [ -d "node_modules" ]; then
        echo -e "${BLUE}→ Removing node_modules...${NC}"
        rm -rf node_modules
        echo -e "${GREEN}✓ node_modules removed${NC}"
    fi
    
    # Remove package-lock.json for completely fresh start
    if [ -f "package-lock.json" ]; then
        echo -e "${BLUE}→ Removing package-lock.json for fresh lock file...${NC}"
        rm -f package-lock.json
        echo -e "${GREEN}✓ package-lock.json removed${NC}"
    fi
    
    # Remove yarn.lock if exists
    if [ -f "yarn.lock" ]; then
        echo -e "${BLUE}→ Removing yarn.lock...${NC}"
        rm -f yarn.lock
        echo -e "${GREEN}✓ yarn.lock removed${NC}"
    fi
    
    # Remove .next build directory
    if [ -d ".next" ]; then
        echo -e "${BLUE}→ Removing .next build cache...${NC}"
        rm -rf .next
        echo -e "${GREEN}✓ .next removed${NC}"
    fi
    
    # Remove generated Prisma client
    if [ -d "node_modules/.prisma" ]; then
        echo -e "${BLUE}→ Removing Prisma generated client...${NC}"
        rm -rf node_modules/.prisma
        echo -e "${GREEN}✓ Prisma client removed${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✓ All dependencies and caches cleaned!${NC}"
    echo ""
else
    echo -e "${YELLOW}Skipping dependency cleanup (--skip-deps-clean)${NC}"
    echo ""
fi

# Step 2: Fresh Install Dependencies (only locally if needed for inspection)
if [ "$SKIP_DEPS_CLEAN" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Step 2: Fresh Install Dependencies${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd "$NEXTJS_DIR"
    
    # Check Node.js version
    echo -e "${BLUE}→ Checking Node.js version...${NC}"
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"
    
    # Fresh npm install with legacy peer deps for compatibility
    echo -e "${BLUE}→ Running npm install with legacy peer deps...${NC}"
    npm install --legacy-peer-deps
    
    echo -e "${GREEN}✓ Dependencies installed fresh!${NC}"
    echo ""
    
    # Generate Prisma Client
    echo -e "${BLUE}→ Generating Prisma Client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✓ Prisma Client generated!${NC}"
    echo ""
fi

# Step 3: Build Docker Image for Production
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Step 3: Building Docker Image for Production${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd "$DEPLOYMENT_DIR"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        echo "Please install Docker first: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is available${NC}"
    
    # Build with no cache for completely fresh build
    echo -e "${BLUE}→ Building Docker image (no cache for fresh build)...${NC}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    docker build \
        --no-cache \
        --progress=plain \
        -t cortexbuild-app:latest \
        -t cortexbuild-app:$TIMESTAMP \
        -f Dockerfile \
        .. 2>&1 | tee /tmp/docker-build-$TIMESTAMP.log
    
    BUILD_STATUS=${PIPESTATUS[0]}
    
    if [ $BUILD_STATUS -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Docker image built successfully!${NC}"
        echo -e "${GREEN}  Tags: cortexbuild-app:latest, cortexbuild-app:$TIMESTAMP${NC}"
        echo -e "${GREEN}  Build log: /tmp/docker-build-$TIMESTAMP.log${NC}"
    else
        echo ""
        echo -e "${RED}✗ Docker build failed!${NC}"
        echo -e "${RED}  Check log: /tmp/docker-build-$TIMESTAMP.log${NC}"
        exit 1
    fi
    echo ""
else
    echo -e "${YELLOW}Skipping Docker build (--skip-build)${NC}"
    echo ""
fi

# Step 4: Deploy to VPS (if requested)
if [ "$DEPLOY_TO_VPS" = true ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Step 4: Deploying to VPS${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -z "$VPS_HOST" ]; then
        echo -e "${RED}Error: VPS host not specified${NC}"
        echo "Use --vps-host YOUR_VPS_IP or set VPS_HOST environment variable"
        exit 1
    fi
    
    echo -e "${BLUE}→ Deploying to $VPS_USER@$VPS_HOST...${NC}"
    
    # Save image to tar
    echo -e "${BLUE}→ Saving Docker image...${NC}"
    docker save cortexbuild-app:latest | gzip > /tmp/cortexbuild-app.tar.gz
    
    # Transfer to VPS
    echo -e "${BLUE}→ Transferring image to VPS...${NC}"
    scp /tmp/cortexbuild-app.tar.gz "$VPS_USER@$VPS_HOST:/tmp/"
    
    # Transfer deployment files
    echo -e "${BLUE}→ Transferring deployment files...${NC}"
    scp -r "$DEPLOYMENT_DIR" "$VPS_USER@$VPS_HOST:/root/cortexbuild_deployment/"
    
    # Execute remote deployment
    echo -e "${BLUE}→ Executing remote deployment...${NC}"
    ssh "$VPS_USER@$VPS_HOST" << 'REMOTE_SCRIPT'
        set -e
        
        # Load the image
        echo "Loading Docker image..."
        gunzip -c /tmp/cortexbuild-app.tar.gz | docker load
        
        # Navigate to deployment directory
        cd /root/cortexbuild_deployment
        
        # Start services
        echo "Starting services..."
        docker compose down 2>/dev/null || true
        docker compose up -d
        
        # Wait for services
        echo "Waiting for services to be ready..."
        sleep 30
        
        # Run migrations
        echo "Running database migrations..."
        docker compose exec -T app npx prisma migrate deploy || true
        
        # Show status
        docker compose ps
        
        echo "Deployment complete!"
REMOTE_SCRIPT
    
    echo ""
    echo -e "${GREEN}✓ Deployment to VPS completed!${NC}"
    echo -e "${BLUE}  Access your app at: http://$VPS_HOST:3000${NC}"
    echo ""
fi

# Final Summary
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Build Summary                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}✓ All tasks completed successfully!${NC}"
echo ""
echo -e "${BLUE}Docker Image:${NC}"
echo "  • cortexbuild-app:latest"
echo "  • cortexbuild-app:$TIMESTAMP (backup)"
echo ""
echo -e "${BLUE}Next Steps for VPS Deployment:${NC}"
echo "  1. Configure .env file with your production settings"
echo "  2. Run: ./clean-build-deploy.sh --deploy --vps-host YOUR_VPS_IP"
echo "  3. Or use Windmill for automated deployments"
echo "  4. Or use Docker Manager (Portainer) for visual management"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  • Start locally: docker compose up -d"
echo "  • View logs: docker compose logs -f app"
echo "  • Run migrations: docker compose exec app npx prisma migrate deploy"
echo ""
echo -e "${GREEN}Ready for production deployment!${NC}"
