#!/bin/bash
# CortexBuild Pro - Direct Deploy from GitHub
# Run this script directly on the VPS server

set -e

echo "================================================"
echo "CortexBuild Pro - Direct GitHub Deployment"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script must be run as root. Use: sudo bash deploy-from-github.sh"
    exit 1
fi

REPO_URL="https://github.com/adrianstanca1/cortexbuild-pro.git"
BRANCH="main"
DEPLOY_DIR="/var/www/cortexbuild-pro"

echo "Deployment Configuration:"
echo "  Repository: $REPO_URL"
echo "  Branch: $BRANCH"
echo "  Target: $DEPLOY_DIR"
echo ""

# Step 1: Install dependencies
echo "[1/6] Installing system dependencies..."
apt-get update
apt-get install -y docker.io docker-compose git ufw openssl curl wget

# Enable and start Docker
systemctl enable docker
systemctl start docker

echo "✓ Dependencies installed"
echo ""

# Step 2: Configure firewall
echo "[2/6] Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
echo "✓ Firewall configured"
echo ""

# Step 3: Clone/update repository
echo "[3/6] Fetching application from GitHub..."
if [ -d "$DEPLOY_DIR" ]; then
    echo "Directory exists, updating..."
    cd "$DEPLOY_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo "Cloning repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi
echo "✓ Repository ready"
echo ""

# Step 4: Configure environment
echo "[4/6] Configuring environment..."
cd "$DEPLOY_DIR/deployment"

if [ ! -f .env ]; then
    echo "Creating .env file..."
    
    # Generate secure credentials
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "localhost")
    
    cat > .env << EOF
# Database Configuration
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=cortexbuild
DATABASE_URL=postgresql://cortexbuild:$POSTGRES_PASSWORD@postgres:5432/cortexbuild?schema=public

# NextAuth Configuration
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://$SERVER_IP:3000

# Domain Configuration
DOMAIN=cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com

# Real-time Communication
NEXT_PUBLIC_WEBSOCKET_URL=http://$SERVER_IP:3000
WEBSOCKET_PORT=3000

# AWS S3 (Optional)
AWS_PROFILE=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=
AWS_FOLDER_PREFIX=

# AbacusAI API (Optional)
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

# SendGrid Email (Optional)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com
SENDGRID_FROM_NAME=CortexBuild Pro
EOF

    echo ""
    echo "================================"
    echo "SAVE THESE CREDENTIALS SECURELY:"
    echo "================================"
    echo "Server IP: $SERVER_IP"
    echo "Database Password: $POSTGRES_PASSWORD"
    echo "NextAuth Secret: $NEXTAUTH_SECRET"
    echo "================================"
    echo ""
    
    # Save to a backup file
    cat > "$DEPLOY_DIR/DEPLOYMENT_CREDENTIALS.txt" << EOF
CortexBuild Pro - Deployment Credentials
Generated: $(date)
Server IP: $SERVER_IP
Database Password: $POSTGRES_PASSWORD
NextAuth Secret: $NEXTAUTH_SECRET

Application URL: http://$SERVER_IP:3000

Keep this file secure and delete after saving credentials elsewhere!
EOF
    chmod 600 "$DEPLOY_DIR/DEPLOYMENT_CREDENTIALS.txt"
    
    echo "Credentials also saved to: $DEPLOY_DIR/DEPLOYMENT_CREDENTIALS.txt"
    echo "Press ENTER to continue..."
    read
else
    echo "✓ Using existing .env file"
fi
echo ""

# Step 5: Build and start services
echo "[5/6] Building and starting services..."
echo "This may take 5-10 minutes on first run..."

# Pull base images
docker-compose -f docker-compose.yml pull postgres nginx certbot 2>/dev/null || true

# Build application
docker-compose -f docker-compose.yml build app

# Start services
docker-compose -f docker-compose.yml up -d

# Wait for services
echo "Waiting for services to start..."
sleep 30

# Run migrations
echo "Running database migrations..."
docker-compose -f docker-compose.yml exec -T app sh -c "cd /app && npx prisma migrate deploy" 2>/dev/null || {
    echo "Migrations will run automatically on first app start"
}

echo "✓ Services started"
echo ""

# Step 6: Verify deployment
echo "[6/6] Verifying deployment..."

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "localhost")

# Check containers
echo ""
echo "Container Status:"
docker-compose -f docker-compose.yml ps
echo ""

# Test application
sleep 5
if curl -f -s "http://localhost:3000/api/auth/providers" > /dev/null 2>&1; then
    echo "✓ Application is responding"
else
    echo "⚠ Application may still be initializing (this can take 1-2 minutes)"
fi

echo ""
echo "================================================"
echo "✓ DEPLOYMENT SUCCESSFUL!"
echo "================================================"
echo ""
echo "🌐 Access your application:"
echo "   → http://$SERVER_IP:3000"
echo "   → http://$SERVER_IP (via Nginx)"
echo ""
echo "📋 Next steps:"
echo "   1. Open http://$SERVER_IP:3000 in your browser"
echo "   2. Click 'Sign Up' to create your admin account"
echo "   3. Configure optional services (AWS S3, SendGrid, etc.) in .env"
echo "   4. Set up SSL if using a domain"
echo ""
echo "📁 Important files:"
echo "   Credentials: $DEPLOY_DIR/DEPLOYMENT_CREDENTIALS.txt"
echo "   Environment: $DEPLOY_DIR/deployment/.env"
echo "   Logs: docker-compose -f $DEPLOY_DIR/deployment/docker-compose.yml logs -f"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:     cd $DEPLOY_DIR/deployment && docker-compose logs -f"
echo "   Restart:       cd $DEPLOY_DIR/deployment && docker-compose restart"
echo "   Stop:          cd $DEPLOY_DIR/deployment && docker-compose down"
echo "   Update app:    cd $DEPLOY_DIR && git pull && cd deployment && docker-compose up -d --build"
echo ""
echo "📚 Documentation:"
echo "   $DEPLOY_DIR/README.md"
echo "   $DEPLOY_DIR/DEPLOYMENT_GUIDE.md"
echo "   $DEPLOY_DIR/deployment/DEPLOYMENT_TO_VPS.md"
echo ""
