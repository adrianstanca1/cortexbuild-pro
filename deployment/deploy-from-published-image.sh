#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Deploy from GitHub Container Registry
# This script pulls the latest published Docker image and deploys it
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
║     CortexBuild Pro - Deploy from Published Image        ║
║                                                           ║
║       Deploy to: www.cortexbuildpro.com                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$SCRIPT_DIR"

# Configuration
REGISTRY="ghcr.io"
IMAGE_NAME="adrianstanca1/cortexbuild-pro"
IMAGE_TAG="${1:-latest}"
FULL_IMAGE="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG"

echo -e "${CYAN}[1/7] Configuration${NC}"
echo ""
echo "Registry: $REGISTRY"
echo "Image: $IMAGE_NAME"
echo "Tag: $IMAGE_TAG"
echo "Full Image: $FULL_IMAGE"
echo ""

# Check prerequisites
echo -e "${CYAN}[2/7] Checking Prerequisites...${NC}"
echo ""

ALL_DEPS_OK=true
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ docker is not installed${NC}"
    ALL_DEPS_OK=false
else
    echo -e "${GREEN}✓ docker is installed${NC}"
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ docker compose is not installed${NC}"
    ALL_DEPS_OK=false
else
    echo -e "${GREEN}✓ docker compose is installed${NC}"
fi

echo ""

if [ "$ALL_DEPS_OK" = false ]; then
    echo -e "${RED}Missing required dependencies!${NC}"
    exit 1
fi

# Navigate to deployment directory
cd "$DEPLOYMENT_DIR"

# Check for .env file
echo -e "${CYAN}[3/7] Checking Environment Configuration...${NC}"
echo ""

if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create a .env file from .env.example first."
    echo ""
    echo "Steps:"
    echo "  1. cp .env.example .env"
    echo "  2. Edit .env and set POSTGRES_PASSWORD"
    echo "  3. Run this script again"
    exit 1
fi

# Check if password is set
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

echo ""

# Pull the Docker image
echo -e "${CYAN}[4/7] Pulling Docker Image...${NC}"
echo ""

# Check if image is public or requires authentication
echo "Attempting to pull image: $FULL_IMAGE"
echo ""

if docker pull "$FULL_IMAGE"; then
    echo -e "${GREEN}✓ Docker image pulled successfully${NC}"
else
    echo -e "${YELLOW}⚠ Failed to pull image. It may be private.${NC}"
    echo ""
    echo "If the repository is private, you need to authenticate:"
    echo ""
    echo "  1. Create a Personal Access Token (PAT) on GitHub:"
    echo "     https://github.com/settings/tokens/new"
    echo "     Permissions needed: read:packages"
    echo ""
    echo "  2. Login to GitHub Container Registry:"
    echo "     echo YOUR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin"
    echo ""
    echo "  3. Run this script again"
    echo ""
    exit 1
fi

echo ""

# Create docker-compose-published.yml that uses the pulled image
echo -e "${CYAN}[5/7] Configuring Services...${NC}"
echo ""

cat > docker-compose-published.yml << EOL
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: cortexbuild-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-cortexbuild}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB:-cortexbuild}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - cortexbuild-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-cortexbuild} -d \${POSTGRES_DB:-cortexbuild}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Next.js Application (from published image)
  app:
    image: $FULL_IMAGE
    container_name: cortexbuild-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://\${POSTGRES_USER:-cortexbuild}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB:-cortexbuild}?schema=public
      - NEXTAUTH_URL=\${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
      - AWS_PROFILE=\${AWS_PROFILE:-}
      - AWS_REGION=\${AWS_REGION:-}
      - AWS_BUCKET_NAME=\${AWS_BUCKET_NAME:-}
      - AWS_FOLDER_PREFIX=\${AWS_FOLDER_PREFIX:-}
      - ABACUSAI_API_KEY=\${ABACUSAI_API_KEY:-}
      - WEB_APP_ID=\${WEB_APP_ID:-}
      - NOTIF_ID_MILESTONE_DEADLINE_REMINDER=\${NOTIF_ID_MILESTONE_DEADLINE_REMINDER:-}
      - NOTIF_ID_TOOLBOX_TALK_COMPLETED=\${NOTIF_ID_TOOLBOX_TALK_COMPLETED:-}
      - NOTIF_ID_MEWP_CHECK_COMPLETED=\${NOTIF_ID_MEWP_CHECK_COMPLETED:-}
      - NOTIF_ID_TOOL_CHECK_COMPLETED=\${NOTIF_ID_TOOL_CHECK_COMPLETED:-}
      - GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID:-}
      - GOOGLE_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET:-}
      - NEXT_PUBLIC_WEBSOCKET_URL=\${NEXT_PUBLIC_WEBSOCKET_URL:-https://www.cortexbuildpro.com}
      - WEBSOCKET_PORT=\${WEBSOCKET_PORT:-3000}
      - SENDGRID_API_KEY=\${SENDGRID_API_KEY:-}
      - SENDGRID_FROM_EMAIL=\${SENDGRID_FROM_EMAIL:-noreply@cortexbuildpro.com}
      - SENDGRID_FROM_NAME=\${SENDGRID_FROM_NAME:-CortexBuild Pro}
    volumes:
      - nextjs_static:/app/shared_static
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - cortexbuild-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/auth/providers"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: cortexbuild-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - certbot-webroot:/var/www/certbot:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - nextjs_static:/var/www/_next/static
    depends_on:
      - app
    networks:
      - cortexbuild-network

  # Certbot for SSL
  certbot:
    image: certbot/certbot:latest
    container_name: cortexbuild-certbot
    volumes:
      - certbot-webroot:/var/www/certbot
      - certbot-etc:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"
    networks:
      - cortexbuild-network

networks:
  cortexbuild-network:
    driver: bridge

volumes:
  postgres_data:
  certbot-webroot:
  certbot-etc:
  nextjs_static:
EOL

echo -e "${GREEN}✓ Docker Compose configuration created${NC}"
echo ""

# Start services
echo -e "${CYAN}[6/7] Starting Services...${NC}"
echo ""

# Start database first
echo "Starting database..."
docker compose -f docker-compose-published.yml up -d postgres

echo "Waiting for database to be ready..."
sleep 10

# Check database health
docker compose -f docker-compose-published.yml exec postgres pg_isready -U cortexbuild || {
    echo -e "${RED}Error: Database failed to start${NC}"
    docker compose -f docker-compose-published.yml logs postgres
    exit 1
}

echo -e "${GREEN}✓ Database is ready${NC}"
echo ""

# Start application
echo "Starting application..."
docker compose -f docker-compose-published.yml up -d app

echo "Waiting for application to start..."
sleep 15

# Run database migrations
echo -e "${CYAN}[7/7] Running Database Migrations...${NC}"
echo ""

docker compose -f docker-compose-published.yml exec app sh -c "cd /app && npx prisma migrate deploy" || {
    echo -e "${YELLOW}Warning: Migration may have issues. Check logs.${NC}"
    docker compose -f docker-compose-published.yml logs app
}

echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# Check services status
echo -e "${CYAN}Service Status:${NC}"
echo ""
docker compose -f docker-compose-published.yml ps

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║          Deployment Completed Successfully!              ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Next Steps:"
echo ""
echo "1. Access your application:"
echo "   → http://localhost:3000"
echo "   → https://www.cortexbuildpro.com (if DNS configured)"
echo ""
echo "2. View logs:"
echo "   → docker compose -f docker-compose-published.yml logs -f"
echo ""
echo "3. Setup SSL (if not done already):"
echo "   → ./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com"
echo ""
echo "4. Stop services:"
echo "   → docker compose -f docker-compose-published.yml down"
echo ""
echo "5. Update to latest image:"
echo "   → docker compose -f docker-compose-published.yml pull app"
echo "   → docker compose -f docker-compose-published.yml up -d app"
echo ""
