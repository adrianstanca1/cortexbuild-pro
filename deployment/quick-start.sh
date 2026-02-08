#!/bin/bash
# =============================================================================
# CortexBuild Pro - Quick Start VPS Deployment Script
# =============================================================================
# This script automates the complete deployment process for CortexBuild Pro
# on a fresh VPS with Ubuntu 20.04+
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/quick-start.sh | bash
#   OR
#   ./quick-start.sh
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="www.cortexbuildpro.com"
INSTALL_DIR="/var/www/cortexbuild-pro"
REPO_URL="https://github.com/adrianstanca1/cortexbuild-pro.git"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_success "Running with root privileges"
        return 0
    else
        print_warning "This script requires sudo privileges"
        return 1
    fi
}

# Main script
main() {
    print_header "CortexBuild Pro - Quick Start Deployment"
    
    print_info "This script will:"
    echo "  1. Update system packages"
    echo "  2. Install Docker and Docker Compose"
    echo "  3. Configure firewall"
    echo "  4. Clone the repository"
    echo "  5. Set up environment variables"
    echo "  6. Deploy the application"
    echo ""
    
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    # Step 1: Run VPS setup
    print_header "Step 1: VPS Setup"
    if [ -f "deployment/vps-setup.sh" ]; then
        bash deployment/vps-setup.sh
    else
        print_warning "VPS setup script not found, running minimal setup..."
        
        # Update system
        print_info "Updating system packages..."
        sudo apt-get update -y
        sudo apt-get upgrade -y
        
        # Install Docker
        print_info "Installing Docker..."
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com | sh
            sudo systemctl enable docker
            sudo systemctl start docker
        fi
        
        # Install Docker Compose
        print_info "Installing Docker Compose..."
        if ! docker compose version &> /dev/null; then
            sudo apt-get install -y docker-compose-plugin
        fi
        
        # Configure firewall
        print_info "Configuring firewall..."
        sudo apt-get install -y ufw
        sudo ufw --force reset
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 3000/tcp
        sudo ufw --force enable
    fi
    print_success "VPS setup complete"
    
    # Step 2: Clone repository if not already present
    print_header "Step 2: Repository Setup"
    if [ ! -d "$INSTALL_DIR" ]; then
        print_info "Cloning repository..."
        sudo mkdir -p /var/www
        cd /var/www
        sudo git clone $REPO_URL cortexbuild-pro
        sudo chown -R $USER:$USER cortexbuild-pro
        cd cortexbuild-pro
        print_success "Repository cloned to $INSTALL_DIR"
    else
        print_info "Repository already exists at $INSTALL_DIR"
        cd $INSTALL_DIR
        print_info "Pulling latest changes..."
        git pull origin main || print_warning "Failed to pull latest changes"
    fi
    
    # Step 3: Configure environment
    print_header "Step 3: Environment Configuration"
    cd $INSTALL_DIR/deployment
    
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from example..."
        cp .env.example .env
        
        # Generate secure passwords
        POSTGRES_PASS=$(openssl rand -base64 24)
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        
        # Update .env file
        sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASS|g" .env
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://cortexbuild:$POSTGRES_PASS@postgres:5432/cortexbuild?schema=public&connection_limit=10&pool_timeout=20\"|g" .env
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEXTAUTH_SECRET|g" .env
        sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|g" .env
        sed -i "s|NEXT_PUBLIC_WEBSOCKET_URL=.*|NEXT_PUBLIC_WEBSOCKET_URL=https://$DOMAIN|g" .env
        sed -i "s|DOMAIN=.*|DOMAIN=$DOMAIN|g" .env
        
        print_success "Environment configured with secure credentials"
        print_warning "Review and update .env file if needed: nano $INSTALL_DIR/deployment/.env"
    else
        print_info ".env file already exists"
    fi
    
    # Step 4: Build and start services
    print_header "Step 4: Building and Starting Services"
    cd $INSTALL_DIR/deployment
    
    print_info "Building Docker images (this may take several minutes)..."
    docker compose build --no-cache
    
    print_info "Starting database and application..."
    docker compose up -d postgres app
    
    print_info "Waiting for services to be healthy..."
    sleep 30
    
    # Run migrations
    print_info "Running database migrations..."
    docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy" || print_warning "Migrations failed or already applied"
    
    print_success "Services started successfully"
    
    # Step 5: Display status
    print_header "Deployment Status"
    docker compose ps
    
    # Step 6: Final instructions
    print_header "Next Steps"
    echo ""
    echo -e "${GREEN}✓ CortexBuild Pro is now running!${NC}"
    echo ""
    echo "To complete the setup:"
    echo ""
    echo "1. Test the application (without SSL):"
    echo -e "   ${BLUE}curl http://localhost:3000/api/auth/providers${NC}"
    echo ""
    echo "2. Set up SSL/HTTPS (required for production):"
    echo -e "   ${BLUE}cd $INSTALL_DIR/deployment${NC}"
    echo -e "   ${BLUE}./setup-ssl.sh $DOMAIN admin@$DOMAIN${NC}"
    echo ""
    echo "3. Access the application:"
    echo -e "   ${BLUE}https://$DOMAIN${NC}"
    echo ""
    echo "4. Create your admin account via the signup page"
    echo ""
    echo "5. View logs:"
    echo -e "   ${BLUE}docker compose logs -f${NC}"
    echo ""
    echo "6. Monitor services:"
    echo -e "   ${BLUE}docker compose ps${NC}"
    echo ""
    print_info "For troubleshooting, see: $INSTALL_DIR/GITHUB_SECRETS_GUIDE.md"
    echo ""
}

# Run main function
main "$@"
