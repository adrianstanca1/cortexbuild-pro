#!/bin/bash
# =============================================================================
# CortexBuild Pro - One-Click VPS Deployment
# =============================================================================
# This script provides a complete, automated VPS deployment experience
# It handles prerequisites, setup, deployment, and verification
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_DIR="$SCRIPT_DIR"
BACKUP_DIR="/root/cortexbuild_backups"
LOG_FILE="/var/log/cortexbuild-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Print header
print_header() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "  CortexBuild Pro - One-Click VPS Deployment"
    echo "  UK Construction Management Platform"
    echo "============================================================================="
    echo -e "${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        echo "Please run: sudo bash $0"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot determine OS. /etc/os-release not found"
        exit 1
    fi
    
    . /etc/os-release
    log_info "OS: $PRETTY_NAME"
    
    # Check memory
    total_mem=$(free -m | awk '/^Mem:/{print $2}')
    if [[ $total_mem -lt 1800 ]]; then
        log_warn "System has ${total_mem}MB RAM. Minimum 2GB recommended"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Memory: ${total_mem}MB"
    fi
    
    # Check disk space
    available_disk=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $available_disk -lt 15 ]]; then
        log_warn "Only ${available_disk}GB disk space available. 20GB+ recommended"
    else
        log_success "Disk space: ${available_disk}GB available"
    fi
}

# Install Docker if needed
install_docker() {
    if command -v docker &> /dev/null; then
        log_success "Docker already installed: $(docker --version)"
        return 0
    fi
    
    log_info "Installing Docker..."
    
    # Update package index
    apt-get update -qq
    
    # Install prerequisites
    apt-get install -y -qq \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common
    
    # Install Docker using official script
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    rm /tmp/get-docker.sh
    
    # Start and enable Docker
    systemctl enable docker
    systemctl start docker
    
    log_success "Docker installed: $(docker --version)"
}

# Install Docker Compose if needed
install_docker_compose() {
    if docker compose version &> /dev/null; then
        log_success "Docker Compose already available: $(docker compose version)"
        return 0
    fi
    
    log_info "Installing Docker Compose..."
    
    # Install Docker Compose plugin
    apt-get update -qq
    apt-get install -y -qq docker-compose-plugin
    
    log_success "Docker Compose installed: $(docker compose version)"
}

# Setup environment configuration
setup_environment() {
    log_info "Setting up environment configuration..."
    
    cd "$DEPLOYMENT_DIR"
    
    if [[ -f .env ]]; then
        log_warn "Existing .env file found. Creating backup..."
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    if [[ -f .env.production ]]; then
        log_info "Using .env.production as template"
        cp .env.production .env
    elif [[ -f .env.example ]]; then
        log_info "Using .env.example as template"
        cp .env.example .env
    else
        log_error "No environment template found (.env.production or .env.example)"
        exit 1
    fi
    
    # Check if secrets need to be generated (check for weak/placeholder values)
    local needs_secrets=false
    
    # Check NEXTAUTH_SECRET - look for missing, empty, or obvious placeholders
    if ! grep -q "NEXTAUTH_SECRET=" .env; then
        needs_secrets=true
    else
        # Extract the secret value
        local secret_value=$(grep "NEXTAUTH_SECRET=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        
        # Check if it's a placeholder or too short
        if [[ -z "$secret_value" ]] || \
           [[ ${#secret_value} -lt 24 ]] || \
           echo "$secret_value" | grep -qi "secret\|placeholder\|changeme\|example"; then
            needs_secrets=true
        fi
    fi
    
    # Check password placeholders (specific patterns only)
    if grep -q "YOUR_PASSWORD_HERE\|<YOUR_PASSWORD\|REPLACE.*PASSWORD\|changeme123" .env; then
        needs_secrets=true
    fi
    
    if [[ "$needs_secrets" == "true" ]]; then
        log_info "Generating secure secrets..."
        
        # Generate NEXTAUTH_SECRET (replace weak or placeholder values)
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env
        
        # Generate DB password (replace specific placeholders only)
        DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-32)
        sed -i "s|YOUR_PASSWORD_HERE|$DB_PASSWORD|g" .env
        sed -i "s|<YOUR_PASSWORD[^>]*>|$DB_PASSWORD|gi" .env
        sed -i "s|REPLACE.*PASSWORD[^\"']*|$DB_PASSWORD|gi" .env
        sed -i "s|changeme123|$DB_PASSWORD|gi" .env
        
        log_success "Secure secrets generated"
    fi
    
    log_success "Environment configured"
}

# Create backup of existing deployment
create_backup() {
    log_info "Creating backup of existing deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Check if containers are running
    if docker compose ps -q 2>/dev/null | grep -q .; then
        # Backup database
        if docker ps --format '{{.Names}}' | grep -q cortexbuild-db; then
            BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
            log_info "Backing up database to $BACKUP_FILE..."
            
            docker compose exec -T db pg_dump -U cortexbuild cortexbuild | gzip > "$BACKUP_FILE" || log_warn "Database backup failed"
            
            if [[ -f "$BACKUP_FILE" ]]; then
                log_success "Database backed up: $BACKUP_FILE"
            fi
        fi
        
        # Backup environment
        if [[ -f .env ]]; then
            cp .env "$BACKUP_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
            log_success "Environment file backed up"
        fi
    else
        log_info "No existing deployment found, skipping backup"
    fi
}

# Stop existing containers
stop_containers() {
    log_info "Stopping existing containers..."
    
    cd "$DEPLOYMENT_DIR"
    
    if docker compose ps -q 2>/dev/null | grep -q .; then
        docker compose down
        log_success "Containers stopped"
    else
        log_info "No running containers found"
    fi
}

# Build and start services
deploy_application() {
    log_info "Building and deploying application..."
    
    cd "$DEPLOYMENT_DIR"
    
    # Build images
    log_info "Building Docker images (this may take 5-10 minutes)..."
    docker compose build --no-cache app
    
    # Start services
    log_info "Starting services..."
    docker compose up -d
    
    log_success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=0
    
    # Wait for database
    log_info "Waiting for database..."
    while [[ $attempt -lt $max_attempts ]]; do
        if docker compose exec -T db pg_isready -U cortexbuild &>/dev/null; then
            log_success "Database is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [[ $attempt -eq $max_attempts ]]; then
        log_error "Database failed to become healthy"
        return 1
    fi
    
    # Wait for app
    log_info "Waiting for application..."
    sleep 10
    
    attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf http://localhost:3000/api/auth/providers >/dev/null 2>&1; then
            log_success "Application is ready"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 3
    done
    
    log_warn "Application health check timeout, but may still be starting..."
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd "$DEPLOYMENT_DIR"
    
    # Wait a bit for app to be fully ready
    sleep 5
    
    if docker compose exec -T app npx prisma migrate deploy 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Migrations completed"
    else
        log_error "Migration failed"
        return 1
    fi
}

# Seed database (optional)
seed_database() {
    log_info "Seeding database with initial data..."
    
    cd "$DEPLOYMENT_DIR"
    
    if docker compose exec -T app npx prisma db seed 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Database seeded"
    else
        log_warn "Database seeding failed or data already exists"
    fi
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check container status
    log_info "Container status:"
    docker compose ps
    
    # Test endpoints
    log_info "Testing application endpoints..."
    
    if curl -sf http://localhost:3000/api/auth/providers >/dev/null 2>&1; then
        log_success "API endpoint responding"
    else
        log_error "API endpoint not responding"
        return 1
    fi
    
    # Check logs for errors
    if docker compose logs app | tail -50 | grep -i "error" | grep -v "warning" >/dev/null; then
        log_warn "Errors found in application logs. Check with: docker compose logs app"
    fi
    
    log_success "Deployment verified"
}

# Print deployment summary
print_summary() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "  Deployment Complete!"
    echo "============================================================================="
    echo -e "${NC}"
    echo ""
    echo -e "${GREEN}Application Status:${NC}"
    echo "  • Local URL: http://localhost:3000"
    echo "  • Docker containers running: $(docker compose ps -q | wc -l)"
    echo ""
    echo -e "${GREEN}Default Login Credentials:${NC}"
    echo "  • Super Admin: adrian.stanca1@gmail.com"
    echo "  • Company Owner: adrian@ascladdingltd.co.uk"
    echo "  • Check deployment/README-VPS-DEPLOY.md for passwords"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "  • View logs: docker compose -f $DEPLOYMENT_DIR/docker-compose.yml logs -f app"
    echo "  • Check status: docker compose -f $DEPLOYMENT_DIR/docker-compose.yml ps"
    echo "  • Restart app: docker compose -f $DEPLOYMENT_DIR/docker-compose.yml restart app"
    echo "  • Stop all: docker compose -f $DEPLOYMENT_DIR/docker-compose.yml down"
    echo ""
    echo -e "${GREEN}Backups Location:${NC}"
    echo "  • $BACKUP_DIR"
    echo ""
    echo -e "${GREEN}Log File:${NC}"
    echo "  • $LOG_FILE"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Configure your domain DNS to point to this server"
    echo "  2. Setup SSL certificate (see deployment/setup-ssl.sh)"
    echo "  3. Configure firewall (ports 80, 443, 22)"
    echo "  4. Setup automated backups"
    echo ""
}

# Main deployment flow
main() {
    print_header
    
    # Pre-flight checks
    check_root
    check_requirements
    
    # Setup Docker
    install_docker
    install_docker_compose
    
    # Prepare environment
    setup_environment
    
    # Backup existing deployment
    create_backup
    
    # Deploy
    stop_containers
    deploy_application
    
    # Post-deployment
    wait_for_services
    run_migrations
    
    # Ask about seeding
    read -p "Seed database with initial data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        seed_database
    fi
    
    # Verify
    verify_deployment
    
    # Summary
    print_summary
    
    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"
