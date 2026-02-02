#!/bin/bash
set -e

echo "========================================"
echo "CortexBuild Pro - Full VPS Deployment"
echo "========================================"

# Configuration
APP_DIR="/root/cortexbuild"
BACKUP_DIR="/root/cortexbuild_backup_$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Stop existing containers
echo_info "Stopping existing containers..."
cd $APP_DIR 2>/dev/null && docker-compose down || true

# Step 2: Backup existing installation
if [ -d "$APP_DIR" ]; then
    echo_info "Backing up existing installation to $BACKUP_DIR..."
    mkdir -p $BACKUP_DIR
    cp -r $APP_DIR/* $BACKUP_DIR/ 2>/dev/null || true
fi

# Step 3: Create application directory
echo_info "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Step 4: Extract deployment files
if [ -f "cortexbuild_vps_deploy.tar.gz" ]; then
    echo_info "Extracting deployment package..."
    tar -xzf cortexbuild_vps_deploy.tar.gz
else
    echo_error "Deployment package not found. Please upload cortexbuild_vps_deploy.tar.gz first."
    exit 1
fi

# Step 5: Setup environment file
echo_info "Setting up environment variables..."
cat > $APP_DIR/.env << 'EOF'
# CortexBuild Pro - Production Environment
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=CortexSecure2026
POSTGRES_DB=cortexbuild_production
DATABASE_URL=postgresql://cortexbuild:CortexSecure2026@postgres:5432/cortexbuild_production?schema=public
NEXTAUTH_URL=https://cortexbuildpro.com
NEXTAUTH_SECRET=MlKVwMSzZh25ydHp6rFPiaxTQ2WT88nK
NODE_ENV=production
PORT=3000
ENCRYPTION_KEY=cortexbuild_encryption_key_2026_secure
ABACUSAI_API_KEY=aab7e27d61c14a81a2bcf4d395478e4c
EOF

# Step 6: Copy docker-compose.yml to app root
echo_info "Setting up Docker configuration..."
cp deployment/docker-compose.yml $APP_DIR/
cp deployment/Dockerfile $APP_DIR/
cp deployment/nginx.conf $APP_DIR/

# Step 7: Create docker-compose.override.yml for local env
cat > $APP_DIR/docker-compose.override.yml << 'EOF'
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
EOF

# Step 8: Build and start containers
echo_info "Building Docker images (this may take 5-10 minutes)..."
cd $APP_DIR
docker-compose build --no-cache

echo_info "Starting containers..."
docker-compose up -d

# Step 9: Wait for services to be healthy
echo_info "Waiting for services to start..."
sleep 30

# Step 10: Run database migrations
echo_info "Running database migrations..."
docker-compose exec -T app npx prisma db push --accept-data-loss || true

# Step 11: Check status
echo_info "Checking service status..."
docker-compose ps

# Step 12: Test health endpoint
echo_info "Testing application health..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/providers || echo "Health check pending..."

echo ""
echo "========================================"
echo_info "Deployment Complete!"
echo "========================================"
echo ""
echo "Application URL: https://cortexbuildpro.com"
echo "Local URL: http://localhost:3000"
echo ""
echo "Docker commands:"
echo "  View logs: docker-compose logs -f app"
echo "  Restart: docker-compose restart app"
echo "  Stop: docker-compose down"
echo ""
