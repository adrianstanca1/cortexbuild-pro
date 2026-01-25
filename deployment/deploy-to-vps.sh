#!/bin/bash
# CortexBuild Pro - VPS Auto-Deploy Script
# Run this script ON THE VPS after transferring files

set -e

echo "================================================"
echo "CortexBuild Pro - VPS Deployment"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (or use sudo)"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Install dependencies
echo "[1/7] Installing dependencies..."
apt-get update
apt-get install -y docker.io docker-compose git ufw openssl curl wget

# Ensure Docker is running
systemctl enable docker
systemctl start docker

echo "✓ Dependencies installed"
echo ""

# Step 2: Configure firewall
echo "[2/7] Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
echo "✓ Firewall configured"
echo ""

# Step 3: Configure environment
echo "[3/7] Configuring environment..."
cd "$SCRIPT_DIR"

# Generate secure passwords if .env doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
    
    cat > .env << EOF
# Database Configuration
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=cortexbuild
DATABASE_URL=postgresql://cortexbuild:$POSTGRES_PASSWORD@postgres:5432/cortexbuild?schema=public

# NextAuth Configuration
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://$SERVER_IP:3000

# Domain Configuration (update these with your actual domain)
DOMAIN=cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com

# Real-time Communication
NEXT_PUBLIC_WEBSOCKET_URL=http://$SERVER_IP:3000
WEBSOCKET_PORT=3000

# AWS S3 (Optional - configure later via admin panel)
AWS_PROFILE=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=
AWS_FOLDER_PREFIX=

# AbacusAI API (Optional - configure later via admin panel)
ABACUSAI_API_KEY=
WEB_APP_ID=

# Notification IDs
NOTIF_ID_MILESTONE_DEADLINE_REMINDER=
NOTIF_ID_TOOLBOX_TALK_COMPLETED=
NOTIF_ID_MEWP_CHECK_COMPLETED=
NOTIF_ID_TOOL_CHECK_COMPLETED=

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SendGrid Email Service (Optional)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com
SENDGRID_FROM_NAME=CortexBuild Pro
EOF

    echo "✓ Environment file created"
    echo ""
    echo "================================"
    echo "IMPORTANT - SAVE THESE CREDENTIALS:"
    echo "================================"
    echo "Database Password: $POSTGRES_PASSWORD"
    echo "NextAuth Secret: $NEXTAUTH_SECRET"
    echo "Server IP: $SERVER_IP"
    echo "================================"
    echo ""
    echo "Press ENTER to continue..."
    read
else
    echo "✓ Using existing .env file"
fi
echo ""

# Step 4: Pull Docker images
echo "[4/7] Pulling Docker images..."
docker-compose -f docker-compose.yml pull postgres nginx certbot 2>/dev/null || echo "Some images will be built locally"
echo "✓ Images pulled"
echo ""

# Step 5: Build application
echo "[5/7] Building application..."
echo "This may take several minutes..."
docker-compose -f docker-compose.yml build app
echo "✓ Application built"
echo ""

# Step 6: Start services
echo "[6/7] Starting services..."
docker-compose -f docker-compose.yml up -d

# Wait for database
echo "Waiting for database to be ready..."
sleep 20

# Run migrations
echo "Running database migrations..."
docker-compose -f docker-compose.yml exec -T app sh -c "cd /app && npx prisma migrate deploy" || {
    echo "Migration will run automatically on container start"
}
echo "✓ Services started"
echo ""

# Step 7: Verify deployment
echo "[7/7] Verifying deployment..."
sleep 5

# Get server IP for display
SERVER_IP=$(curl -s ifconfig.me || echo "localhost")

# Check service status
echo ""
echo "Container Status:"
docker-compose -f docker-compose.yml ps
echo ""

# Try to access health endpoint
if curl -f -s "http://localhost:3000/api/auth/providers" > /dev/null 2>&1; then
    echo "✓ Application is responding"
else
    echo "⚠ Application may still be starting (this is normal)"
    echo "  Check logs with: docker-compose -f $SCRIPT_DIR/docker-compose.yml logs -f"
fi
echo ""

echo "================================================"
echo "✓ Deployment Complete!"
echo "================================================"
echo ""
echo "Access your application at:"
echo "  → http://$SERVER_IP:3000"
echo "  → http://$SERVER_IP (via Nginx)"
echo ""
echo "Useful commands:"
echo "  View logs:"
echo "    cd $SCRIPT_DIR && docker-compose logs -f"
echo ""
echo "  Restart services:"
echo "    cd $SCRIPT_DIR && docker-compose restart"
echo ""
echo "  Stop services:"
echo "    cd $SCRIPT_DIR && docker-compose down"
echo ""
echo "  Access database:"
echo "    cd $SCRIPT_DIR && docker-compose exec postgres psql -U cortexbuild -d cortexbuild"
echo ""
echo "Next steps:"
echo "  1. Access the application in your browser"
echo "  2. Create your first admin account"
echo "  3. Configure domain and SSL (if needed)"
echo "  4. Configure external services (AWS S3, SendGrid, etc.)"
echo ""
echo "For detailed documentation, see:"
echo "  - DEPLOYMENT_GUIDE.md"
echo "  - DEPLOYMENT_TO_VPS.md"
echo "  - README.md"
echo ""
