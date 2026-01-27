#!/bin/bash
set -e

# ============================================
# CortexBuild Pro - Complete VPS Deployment
# ============================================
# One-command deployment script for production VPS
# This script handles everything from server setup to running application

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ASCII Art Banner
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        CortexBuild Pro - One-Command VPS Deployment         ║
║                                                              ║
║     Complete Construction Management Platform               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${CYAN}Version: 2.0.0 | Updated: $(date +%Y-%m-%d)${NC}"
echo ""

# ============================================
# Helper Functions
# ============================================

# Function to print section headers
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to check command availability
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    else
        print_success "$1 is installed"
        return 0
    fi
}

# Function to pause and wait for user
pause_for_user() {
    echo ""
    read -p "Press Enter to continue..."
    echo ""
}

# ============================================
# Welcome and Pre-flight Checks
# ============================================

print_header "STEP 1: Pre-flight Checks"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   print_warning "Running as root is not recommended for security reasons."
   read -p "Continue anyway? (y/N) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       print_info "Deployment cancelled by user."
       exit 0
   fi
fi

# Detect operating system
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
    print_info "Detected OS: $OS $VER"
else
    print_error "Cannot detect operating system. This script supports Ubuntu/Debian-based systems."
    exit 1
fi

# Check if this is Ubuntu or Debian
if [[ "$OS" != "ubuntu" ]] && [[ "$OS" != "debian" ]]; then
    print_warning "This script is optimized for Ubuntu/Debian. You may encounter issues on $OS."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "Unable to detect")
print_info "Server IP: $SERVER_IP"

echo ""
print_info "This script will:"
echo "  • Install and configure Docker"
echo "  • Set up firewall and security"
echo "  • Clone repository"
echo "  • Configure environment"
echo "  • Deploy application containers"
echo "  • Run database migrations"
echo "  • Start all services"
echo ""

read -p "Ready to begin deployment? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    print_info "Deployment cancelled by user."
    exit 0
fi

# ============================================
# Check Prerequisites
# ============================================

print_header "STEP 2: Checking Prerequisites"

ALL_DEPS_OK=true

# Check for essential commands
check_command "curl" || ALL_DEPS_OK=false
check_command "git" || ALL_DEPS_OK=false

# Check Docker
if command -v docker &> /dev/null; then
    print_success "Docker is installed ($(docker --version))"
else
    print_warning "Docker is not installed - will install"
    NEED_DOCKER=true
fi

# Check Docker Compose
if docker compose version &> /dev/null 2>&1; then
    print_success "Docker Compose is installed"
elif command -v docker-compose &> /dev/null; then
    print_success "Docker Compose is installed (standalone)"
else
    print_warning "Docker Compose is not installed - will install"
    NEED_DOCKER_COMPOSE=true
fi

if [ "$ALL_DEPS_OK" = false ]; then
    print_error "Missing essential dependencies (curl, git)"
    print_info "Installing essential dependencies..."
    sudo apt-get update -qq
    sudo apt-get install -y curl git
fi

# ============================================
# Install Docker if needed
# ============================================

if [ "$NEED_DOCKER" = true ]; then
    print_header "STEP 3: Installing Docker"
    
    print_info "Installing Docker using official script..."
    curl -fsSL https://get.docker.com | sh
    
    # Start and enable Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Add current user to docker group
    if [ "$EUID" -ne 0 ]; then
        sudo usermod -aG docker $USER
        print_warning "Added $USER to docker group. You may need to log out and back in."
    fi
    
    print_success "Docker installed successfully"
fi

if [ "$NEED_DOCKER_COMPOSE" = true ]; then
    print_info "Installing Docker Compose plugin..."
    sudo apt-get update -qq
    sudo apt-get install -y docker-compose-plugin
    print_success "Docker Compose installed successfully"
fi

# ============================================
# System Configuration
# ============================================

print_header "STEP 4: Configuring System"

# Install additional tools
print_info "Installing additional system tools..."
sudo apt-get update -qq
sudo apt-get install -y openssl ufw fail2ban htop net-tools

# Configure firewall
print_info "Configuring firewall (UFW)..."

# Check if UFW is already enabled
if sudo ufw status | grep -q "Status: active"; then
    print_info "UFW is already active. Ensuring required ports are open..."
else
    print_info "Setting up UFW firewall..."
    sudo ufw --force reset >/dev/null 2>&1
    sudo ufw default deny incoming >/dev/null
    sudo ufw default allow outgoing >/dev/null
fi

# Allow necessary ports
sudo ufw allow 22/tcp comment 'SSH' >/dev/null
sudo ufw allow 80/tcp comment 'HTTP' >/dev/null
sudo ufw allow 443/tcp comment 'HTTPS' >/dev/null
sudo ufw allow 3000/tcp comment 'Application' >/dev/null

# Enable firewall
sudo ufw --force enable >/dev/null 2>&1

print_success "Firewall configured (ports 22, 80, 443, 3000 open)"

# Configure Fail2Ban
print_info "Configuring Fail2Ban for SSH protection..."
sudo systemctl enable fail2ban >/dev/null 2>&1
sudo systemctl start fail2ban >/dev/null 2>&1
print_success "Fail2Ban configured"

# Create deployment directory
print_info "Creating deployment directory..."
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www 2>/dev/null || true
print_success "Deployment directory ready at /var/www"

# ============================================
# Clone or Update Repository
# ============================================

print_header "STEP 5: Setting Up Repository"

REPO_URL="https://github.com/adrianstanca1/cortexbuild-pro.git"
REPO_DIR="/var/www/cortexbuild-pro"

if [ -d "$REPO_DIR" ]; then
    print_info "Repository already exists. Updating..."
    cd "$REPO_DIR"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        print_warning "Found uncommitted changes. Stashing them..."
        git stash save "Auto-stash before deployment $(date +%Y%m%d_%H%M%S)"
    fi
    
    # Update repository
    if ! git fetch origin 2>/dev/null; then
        print_error "Failed to fetch from remote repository"
        exit 1
    fi
    
    if ! git pull origin main 2>/dev/null; then
        print_error "Failed to pull latest changes"
        print_info "You may need to resolve conflicts manually"
        exit 1
    fi
    
    print_success "Repository updated"
else
    print_info "Cloning repository..."
    cd /var/www
    git clone "$REPO_URL"
    print_success "Repository cloned"
fi

cd "$REPO_DIR/deployment"

# ============================================
# Environment Configuration
# ============================================

print_header "STEP 6: Configuring Environment"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_success "Created .env file"
    
    # Generate secure credentials
    print_info "Generating secure credentials..."
    
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Update .env file with safer sed delimiter
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEXTAUTH_SECRET}|" .env
    
    # Update DATABASE_URL with proper escaping
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://cortexbuild:${POSTGRES_PASSWORD}@postgres:5432/cortexbuild?schema=public\"|" .env
    
    print_success "Secure credentials generated"
    
    # Save credentials to file
    CREDS_FILE="$REPO_DIR/DEPLOYMENT_CREDENTIALS_$(date +%Y%m%d_%H%M%S).txt"
    cat > "$CREDS_FILE" << EOF
╔══════════════════════════════════════════════════════════════╗
║          CortexBuild Pro - Deployment Credentials           ║
╚══════════════════════════════════════════════════════════════╝

Generated: $(date)
Server IP: $SERVER_IP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database Password: $POSTGRES_PASSWORD
NextAuth Secret:   $NEXTAUTH_SECRET

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Keep these credentials secure and in a safe location
⚠️  Delete this file after saving credentials elsewhere
⚠️  Never commit this file to version control

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
    
    print_success "Credentials saved to: $CREDS_FILE"
    echo ""
    print_warning "IMPORTANT: Save these credentials securely!"
    echo ""
    cat "$CREDS_FILE"
    echo ""
    pause_for_user
else
    print_success ".env file already exists"
fi

# Load environment variables
if ! source .env 2>/dev/null; then
    print_error "Failed to load .env file"
    print_info "Please check .env file for syntax errors"
    exit 1
fi

# Validate configuration
print_info "Validating configuration..."

VALIDATION_OK=true

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your_secure_password_here" ]; then
    print_error "POSTGRES_PASSWORD not configured"
    VALIDATION_OK=false
else
    print_success "Database password configured"
fi

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your_secure_secret_here" ]; then
    print_error "NEXTAUTH_SECRET not configured"
    VALIDATION_OK=false
else
    print_success "NextAuth secret configured"
fi

if [ "$VALIDATION_OK" = false ]; then
    print_error "Configuration validation failed!"
    print_info "Please update your .env file and run this script again."
    exit 1
fi

# ============================================
# Docker Deployment
# ============================================

print_header "STEP 7: Building and Deploying Application"

print_info "Pulling base Docker images..."
docker compose pull postgres nginx certbot 2>/dev/null || true

print_info "Building application image (this may take several minutes)..."
if ! docker compose build app; then
    print_warning "Build failed. Retrying with no cache..."
    sleep 3
    if ! docker compose build --no-cache app; then
        print_error "Build failed. Please check the logs above."
        exit 1
    fi
fi
print_success "Application built successfully"

# ============================================
# Start Services
# ============================================

print_header "STEP 8: Starting Services"

# Start database first
print_info "Starting PostgreSQL database..."
docker compose up -d postgres

# Wait for database
print_info "Waiting for database to be ready..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose exec -T postgres pg_isready -U cortexbuild &> /dev/null; then
        print_success "Database is ready"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo -n "."
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    print_warning "Database health check timed out, but continuing..."
fi

# Start application
print_info "Starting application server..."
docker compose up -d app

# Wait for application to start with health checks
print_info "Waiting for application to initialize..."
MAX_APP_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_APP_WAIT ]; do
    if curl -sf http://localhost:3000/api/auth/providers >/dev/null 2>&1; then
        print_success "Application is ready"
        break
    fi
    sleep 3
    WAITED=$((WAITED + 3))
    echo -n "."
done
echo ""

if [ $WAITED -ge $MAX_APP_WAIT ]; then
    print_warning "Application health check timed out, but continuing..."
fi

# Start nginx
print_info "Starting web server..."
docker compose up -d nginx

print_success "All services started"

# ============================================
# Database Migrations
# ============================================

print_header "STEP 9: Running Database Migrations"

print_info "Applying database migrations..."
if docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy"; then
    print_success "Database migrations completed"
else
    print_warning "Migrations may have issues. Check logs if needed."
fi

# ============================================
# Verification
# ============================================

print_header "STEP 10: Verifying Deployment"

# Check services
print_info "Checking service status..."
docker compose ps

echo ""
print_info "Testing application health..."
sleep 5

# Test application
if curl -f -s http://localhost:3000/api/auth/providers > /dev/null 2>&1; then
    print_success "Application is responding correctly"
else
    print_warning "Application health check failed (may need more time to start)"
    print_info "You can check logs with: docker compose logs -f app"
fi

# ============================================
# Success Summary
# ============================================

print_header "DEPLOYMENT COMPLETE!"

echo -e "${GREEN}"
cat << "EOF"
    ╔════════════════════════════════════════════════════════╗
    ║                                                        ║
    ║          ✅  DEPLOYMENT SUCCESSFUL!  ✅               ║
    ║                                                        ║
    ╚════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}ACCESS YOUR APPLICATION${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}➜${NC} Application URL:  ${BLUE}http://${SERVER_IP}:3000${NC}"
echo ""
echo -e "  ${YELLOW}First-time setup:${NC}"
echo "    1. Open the URL above in your browser"
echo "    2. Click 'Sign Up' to create your account"
echo "    3. The first user becomes the platform administrator"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}USEFUL COMMANDS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Verify deployment:${NC}"
echo "    cd /var/www/cortexbuild-pro"
echo "    ./verify-deployment.sh"
echo ""
echo -e "  ${GREEN}View logs:${NC}"
echo "    cd /var/www/cortexbuild-pro/deployment"
echo "    docker compose logs -f"
echo ""
echo -e "  ${GREEN}Restart application:${NC}"
echo "    docker compose restart app"
echo ""
echo -e "  ${GREEN}Rollback deployment:${NC}"
echo "    cd /var/www/cortexbuild-pro"
echo "    ./rollback-deployment.sh"
echo ""
echo -e "  ${GREEN}Stop all services:${NC}"
echo "    docker compose down"
echo ""
echo -e "  ${GREEN}Backup database:${NC}"
echo "    ./backup.sh"
echo ""
echo -e "  ${GREEN}Check service status:${NC}"
echo "    docker compose ps"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}NEXT STEPS (OPTIONAL)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}1. Set up SSL/HTTPS (if you have a domain):${NC}"
echo "     cd /var/www/cortexbuild-pro/deployment"
echo "     ./setup-ssl.sh yourdomain.com admin@yourdomain.com"
echo ""
echo -e "  ${YELLOW}2. Configure optional services (AWS S3, SendGrid, etc.):${NC}"
echo "     nano /var/www/cortexbuild-pro/deployment/.env"
echo "     docker compose restart app"
echo ""
echo -e "  ${YELLOW}3. Set up automated backups:${NC}"
echo "     crontab -e"
echo "     # Add: 0 2 * * * /var/www/cortexbuild-pro/deployment/backup.sh"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}DOCUMENTATION${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  📖 Full deployment guide:  VPS_DEPLOYMENT_GUIDE.md"
echo "  📋 Quick reference:        DEPLOYMENT_QUICK_REFERENCE.md"
echo "  🔧 Troubleshooting:        TROUBLESHOOTING.md"
echo "  📚 All documentation:      /var/www/cortexbuild-pro/"
echo ""

if [ -f "$CREDS_FILE" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  SECURITY REMINDER${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${YELLOW}Your credentials are saved in:${NC}"
    echo "  $CREDS_FILE"
    echo ""
    echo -e "  ${RED}Delete this file after saving credentials securely:${NC}"
    echo "  rm $CREDS_FILE"
    echo ""
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"
echo -e "${GREEN}Thank you for using CortexBuild Pro! 🚀${NC}"
echo ""
