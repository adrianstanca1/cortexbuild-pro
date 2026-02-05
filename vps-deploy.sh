#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - VPS Deployment Script
# ============================================
# This script should be run on the VPS server after uploading the tarball

# Colors for output
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
║          CortexBuild Pro - VPS Deployment                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
DEPLOYMENT_TARBALL="cortexbuild_vps_deploy.tar.gz"
BUILD_LOG="/root/docker_build.log"
DEPLOYMENT_DIR="/root/cortexbuild"

echo -e "${CYAN}[1/6] Pre-deployment checks...${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Warning: Not running as root. You may need sudo privileges.${NC}"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo ""
    echo "Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com | sh"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo ""
    echo "Please install Docker Compose first:"
    echo "  apt-get install -y docker-compose-plugin"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is available${NC}"

echo ""

# Change to deployment directory
cd "$DEPLOYMENT_DIR" || {
    echo -e "${RED}Error: Could not change to $DEPLOYMENT_DIR${NC}"
    exit 1
}

echo -e "${CYAN}[2/6] Extracting deployment package...${NC}"
echo ""

# Check if tarball exists
if [ ! -f "$DEPLOYMENT_TARBALL" ]; then
    echo -e "${RED}✗ Deployment tarball not found: $DEPLOYMENT_TARBALL${NC}"
    echo ""
    echo "Expected file: $DEPLOYMENT_DIR/$DEPLOYMENT_TARBALL"
    echo ""
    echo "Please upload the tarball first:"
    echo "  scp cortexbuild_vps_deploy.tar.gz root@72.62.132.43:/root/cortexbuild/"
    exit 1
fi

# Extract tarball
echo "Extracting $DEPLOYMENT_TARBALL..."
tar -xzf "$DEPLOYMENT_TARBALL"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Package extracted successfully${NC}"
else
    echo -e "${RED}✗ Failed to extract package${NC}"
    exit 1
fi

echo ""

# Change to extracted directory
cd cortexbuild || {
    echo -e "${RED}Error: Extracted directory not found${NC}"
    exit 1
}

echo -e "${CYAN}[3/6] Checking environment configuration...${NC}"
echo ""

# Check if deployment directory exists
if [ ! -d "deployment" ]; then
    echo -e "${RED}✗ Deployment directory not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Deployment directory found${NC}"

# Check for .env file
if [ ! -f "deployment/.env" ]; then
    echo -e "${YELLOW}⚠ No .env file found${NC}"
    
    if [ -f "deployment/.env.example" ]; then
        echo "Creating .env from template..."
        cp deployment/.env.example deployment/.env
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo ""
        echo -e "${YELLOW}IMPORTANT: You must configure the .env file before continuing!${NC}"
        echo ""
        echo "Edit deployment/.env and set:"
        echo "  - POSTGRES_PASSWORD"
        echo "  - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
        echo "  - NEXTAUTH_URL"
        echo "  - Other required variables"
        echo ""
        if [ -t 0 ]; then
            read -p "Press Enter after configuring .env file..." 
        else
            echo -e "${YELLOW}Non-interactive environment detected; skipping .env confirmation prompt.${NC}"
        fi 
    else
        echo -e "${RED}✗ No .env.example found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Environment configuration found${NC}"
fi

echo ""

echo -e "${CYAN}[4/6] Stopping existing services (if any)...${NC}"
echo ""

cd deployment

# Check if docker is running before attempting to check containers
if ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Docker daemon is not running or not accessible${NC}"
    echo "Please ensure Docker is running before continuing"
else
    # Stop existing containers
    if docker compose ps 2>/dev/null | grep -q "Up"; then
        echo "Stopping existing containers..."
        docker compose down || true
        echo -e "${GREEN}✓ Existing services stopped${NC}"
    else
        echo "No running services found"
    fi
fi

echo ""

echo -e "${CYAN}[5/6] Building Docker images...${NC}"
echo ""

# Build in background and log output
echo "Starting Docker build in background..."
echo "Build log: $BUILD_LOG"
echo ""

# Run build in background with nohup
nohup docker compose build --no-cache app > "$BUILD_LOG" 2>&1 &
BUILD_PID=$!

echo -e "${GREEN}✓ Build started (PID: $BUILD_PID)${NC}"
echo ""
echo "The build is running in the background."
echo "You can:"
echo "  - Monitor progress: tail -f $BUILD_LOG"
echo "  - Check process: ps aux | grep $BUILD_PID"
echo "  - Wait for completion and continue with deployment"
echo ""

# Wait a moment to check if build started successfully
sleep 5

# Initial check: did the process actually start?
if ! ps -p $BUILD_PID > /dev/null 2>&1; then
    echo -e "${RED}✗ Build process failed to start or exited immediately${NC}"
    echo ""
    echo "Check the build log:"
    echo "  cat $BUILD_LOG"
    exit 1
fi

# Give it a bit more time to stabilize
sleep 5

if ps -p $BUILD_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build process is running${NC}"
    echo ""
    echo "Showing initial build output..."
    echo "----------------------------------------"
    head -20 "$BUILD_LOG" 2>/dev/null || echo "Waiting for log output..."
    echo "----------------------------------------"
    echo ""
else
    echo -e "${RED}✗ Build process exited shortly after starting${NC}"
    echo ""
    echo "Check the build log for details:"
    echo "  cat $BUILD_LOG"
    exit 1
fi

echo -e "${CYAN}[6/6] Next steps...${NC}"
echo ""

echo -e "${YELLOW}Build is running in background. Wait for it to complete.${NC}"
echo ""
echo "To monitor build progress:"
echo "  → tail -f $BUILD_LOG"
echo ""
echo "After build completes, start the services:"
echo "  → cd $DEPLOYMENT_DIR/cortexbuild/deployment"
echo "  → docker compose up -d"
echo ""
echo "Run database migrations:"
echo "  → docker compose exec app sh -c \"cd /app && npx prisma migrate deploy\""
echo ""
echo "Check service status:"
echo "  → docker compose ps"
echo ""
echo "View logs:"
echo "  → docker compose logs -f app"
echo ""
echo "Access application:"
echo "  → http://72.62.132.43:3000"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║     Deployment Started Successfully! 🚀                  ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create a helper script for post-build deployment
cat > /tmp/complete-deployment.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

DEPLOYMENT_DIR="/root/cortexbuild/cortexbuild/deployment"
cd "$DEPLOYMENT_DIR"

echo "Starting services..."
docker compose up -d

echo "Waiting for services to start..."
sleep 15

echo "Running database migrations..."
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

echo ""
echo "Deployment complete!"
echo ""
echo "Check status: docker compose ps"
echo "View logs: docker compose logs -f app"
echo "Access: http://72.62.132.43:3000"
EOFSCRIPT

chmod +x /tmp/complete-deployment.sh

echo "A helper script has been created: /tmp/complete-deployment.sh"
echo "Run it after the build completes to finish deployment."
echo ""
