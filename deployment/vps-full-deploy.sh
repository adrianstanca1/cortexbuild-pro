#!/bin/bash
# =================================================================
# CortexBuild Pro - Complete VPS Deployment Script
# =================================================================
# This script performs a complete production deployment to VPS
# Server: 72.62.132.43
# Usage: Run this script directly on the VPS server
# =================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="72.62.132.43"
REPO_URL="https://github.com/adrianstanca1/cortexbuild-pro.git"
PROJECT_DIR="/root/cortexbuild-pro"
DEPLOYMENT_DIR="$PROJECT_DIR/deployment"
DOMAIN="cortexbuildpro.com"

# Print banner
print_banner() {
    echo ""
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}    CortexBuild Pro - VPS Deployment${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${CYAN}Server: $VPS_IP${NC}"
    echo -e "${CYAN}Domain: $DOMAIN${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo ""
}

# Print step header
print_step() {
    echo ""
    echo -e "${YELLOW}>>> $1${NC}"
    echo ""
}

# Print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root or with sudo"
        echo "Example: sudo bash vps-full-deploy.sh"
        exit 1
    fi
}

# Install Docker if not present
install_docker() {
    print_step "Step 1: Checking Docker Installation"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Installing Docker..."
        
        # Update package list
        apt-get update -qq
        
        # Install prerequisites
        apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker's official GPG key
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        # Set up the repository
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        apt-get update -qq
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        # Start and enable Docker
        systemctl enable docker
        systemctl start docker
        
        print_success "Docker installed successfully"
    else
        print_success "Docker is already installed"
        docker --version
    fi
    
    # Verify Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose plugin not available"
        apt-get install -y docker-compose-plugin
    fi
    
    print_success "Docker Compose is available"
    docker compose version
}

# Install Git if not present
install_git() {
    print_step "Step 2: Checking Git Installation"
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        echo "Installing Git..."
        apt-get update -qq
        apt-get install -y git
        print_success "Git installed successfully"
    else
        print_success "Git is already installed"
        git --version
    fi
}

# Clone or update repository
setup_repository() {
    print_step "Step 3: Setting Up Repository"
    
    if [ -d "$PROJECT_DIR" ]; then
        echo "Repository directory exists, updating..."
        cd "$PROJECT_DIR"
        
        # Stash any local changes
        git stash
        
        # Pull latest changes
        git pull origin main || git pull origin cortexbuildpro || true
        
        print_success "Repository updated"
    else
        echo "Cloning repository..."
        git clone "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
        print_success "Repository cloned"
    fi
    
    echo "Current directory: $(pwd)"
    echo "Branch: $(git branch --show-current)"
}

# Setup environment variables
setup_environment() {
    print_step "Step 4: Configuring Environment Variables"
    
    cd "$PROJECT_DIR"
    
    # Check if .env already exists in root
    if [ -f ".env" ]; then
        print_success ".env file already exists in root"
        echo "Backing up existing .env to .env.backup"
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    else
        echo "Creating .env file from deployment/.env.production"
        if [ -f "$DEPLOYMENT_DIR/.env.production" ]; then
            cp "$DEPLOYMENT_DIR/.env.production" .env
            print_success "Created .env from .env.production"
        else
            print_error ".env.production not found"
            echo "Creating .env from template..."
            cp .env.template .env
            print_error "WARNING: Please edit .env with production values!"
        fi
    fi
    
    # Set proper permissions
    chmod 600 .env
    print_success "Set .env permissions to 600"
    
    # Display current environment (without sensitive values)
    echo ""
    echo "Current environment configuration:"
    grep -E "^(NODE_ENV|NEXTAUTH_URL|POSTGRES_USER|POSTGRES_DB)=" .env || true
}

# Build Docker image
build_docker_image() {
    print_step "Step 5: Building Docker Image"
    
    cd "$DEPLOYMENT_DIR"
    
    echo "Building image with no cache for fresh build..."
    echo "This may take 5-10 minutes..."
    
    # Build with no cache
    docker build \
        --no-cache \
        -t cortexbuild-app:latest \
        -f Dockerfile \
        ..
    
    # Tag with timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    docker tag cortexbuild-app:latest cortexbuild-app:$TIMESTAMP
    
    print_success "Image built: cortexbuild-app:latest"
    print_success "Backup tag: cortexbuild-app:$TIMESTAMP"
    
    # Show image info
    echo ""
    docker images | grep cortexbuild-app
}

# Deploy with Docker Compose
deploy_application() {
    print_step "Step 6: Deploying Application"
    
    cd "$DEPLOYMENT_DIR"
    
    echo "Stopping existing containers..."
    docker compose down || true
    
    echo "Starting services..."
    docker compose up -d
    
    print_success "Services started"
    
    # Wait for database to be ready
    echo ""
    echo "Waiting for database to be ready..."
    sleep 15
    
    # Check database health
    for i in {1..30}; do
        if docker compose exec -T db pg_isready -U cortexbuild -d cortexbuild > /dev/null 2>&1; then
            print_success "Database is ready"
            break
        fi
        echo "Waiting for database... ($i/30)"
        sleep 2
    done
    
    # Show container status
    echo ""
    docker compose ps
}

# Run database migrations
run_migrations() {
    print_step "Step 7: Running Database Migrations"
    
    cd "$DEPLOYMENT_DIR"
    
    echo "Waiting for application to be ready..."
    sleep 10
    
    echo "Running Prisma migrations..."
    if docker compose exec -T app npx prisma migrate deploy; then
        print_success "Database migrations completed successfully"
    else
        print_error "Database migrations failed"
        echo "You can retry manually with:"
        echo "  cd $DEPLOYMENT_DIR"
        echo "  docker compose exec app npx prisma migrate deploy"
        return 1
    fi
}

# Seed database (optional)
seed_database() {
    print_step "Step 8: Seeding Database (Optional)"
    
    cd "$DEPLOYMENT_DIR"
    
    read -p "Do you want to seed the database with initial data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Seeding database..."
        if docker compose exec -T app npx prisma db seed; then
            print_success "Database seeded successfully"
        else
            print_error "Database seeding failed (this is optional)"
        fi
    else
        echo "Skipping database seeding"
    fi
}

# Setup firewall
setup_firewall() {
    print_step "Step 9: Configuring Firewall"
    
    if command -v ufw &> /dev/null; then
        echo "Configuring UFW firewall..."
        
        # Allow SSH, HTTP, and HTTPS
        ufw allow 22/tcp comment 'SSH' || true
        ufw allow 80/tcp comment 'HTTP' || true
        ufw allow 443/tcp comment 'HTTPS' || true
        
        # Enable UFW if not already enabled
        echo "y" | ufw enable || true
        
        ufw status
        print_success "Firewall configured"
    else
        print_error "UFW not installed, skipping firewall configuration"
        echo "Install with: apt-get install ufw"
    fi
}

# Health check
run_health_check() {
    print_step "Step 10: Running Health Checks"
    
    cd "$DEPLOYMENT_DIR"
    
    echo "Checking container status..."
    docker compose ps
    echo ""
    
    echo "Checking database connection..."
    if docker compose exec -T db pg_isready -U cortexbuild -d cortexbuild > /dev/null 2>&1; then
        print_success "Database connection: OK"
    else
        print_error "Database connection: FAILED"
    fi
    
    echo ""
    echo "Checking application health..."
    sleep 5
    
    # Test application endpoint
    if curl -f -s -o /dev/null http://localhost:3000/ 2>/dev/null || \
       docker compose exec -T app wget --spider -q http://localhost:3000/ 2>/dev/null; then
        print_success "Application health: OK"
    else
        print_error "Application health: FAILED (may still be starting up)"
    fi
    
    echo ""
    echo "Container logs (last 20 lines):"
    docker compose logs --tail=20 app
}

# Setup SSL (optional)
setup_ssl_certificates() {
    print_step "Step 11: SSL Certificate Setup (Optional)"
    
    read -p "Do you want to set up SSL certificates with Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$DEPLOYMENT_DIR"
        if [ -f "setup-ssl.sh" ]; then
            bash setup-ssl.sh
        else
            print_error "setup-ssl.sh not found"
            echo "You can set up SSL manually later"
        fi
    else
        echo "Skipping SSL setup. You can run it later with:"
        echo "  cd $DEPLOYMENT_DIR"
        echo "  bash setup-ssl.sh"
    fi
}

# Print final summary
print_summary() {
    print_step "Deployment Complete!"
    
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}   Deployment Summary${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo -e "${CYAN}Application URL:${NC}"
    echo "  http://$VPS_IP:3000"
    echo "  http://$DOMAIN:3000"
    echo ""
    echo -e "${CYAN}Services Status:${NC}"
    docker compose ps
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo "  View logs:         docker compose logs -f app"
    echo "  Restart app:       docker compose restart app"
    echo "  Stop all:          docker compose down"
    echo "  Start all:         docker compose up -d"
    echo "  Run migrations:    docker compose exec app npx prisma migrate deploy"
    echo "  Database backup:   bash backup.sh"
    echo "  Health check:      bash health-check.sh"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Test the application at http://$VPS_IP:3000"
    echo "  2. Set up domain DNS to point to $VPS_IP"
    echo "  3. Configure SSL certificates"
    echo "  4. Set up automated backups"
    echo "  5. Configure monitoring"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo "  README: $PROJECT_DIR/README.md"
    echo "  Deployment: $DEPLOYMENT_DIR/README.md"
    echo "  Docker Manager: $DEPLOYMENT_DIR/README-DOCKER-MANAGER.md"
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}Happy deploying! 🚀${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
}

# Main execution
main() {
    print_banner
    
    # Check root privileges
    check_root
    
    # Run deployment steps
    install_docker
    install_git
    setup_repository
    setup_environment
    build_docker_image
    deploy_application
    run_migrations
    seed_database
    setup_firewall
    run_health_check
    setup_ssl_certificates
    print_summary
    
    print_success "Deployment script completed successfully!"
}

# Run main function
main "$@"
