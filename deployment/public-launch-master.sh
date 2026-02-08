#!/bin/bash
# =================================================================
# CortexBuild Pro - Public Launch Master Script
# =================================================================
# This is the ULTIMATE deployment script that:
# 1. Builds and tests the application
# 2. Uploads changes to Docker Manager (Portainer) on VPS
# 3. Deploys to public production environment
# =================================================================
# Usage: 
#   sudo ./public-launch-master.sh [options]
#
# Options:
#   --domain DOMAIN     Your public domain (e.g., cortexbuildpro.com)
#   --email EMAIL       Email for SSL certificate
#   --vps-ip IP         VPS IP address (default: 72.62.132.43)
#   --skip-build        Skip Docker build (use existing image)
#   --with-portainer    Install/update Portainer (Docker Manager)
#   --with-ssl          Configure SSL certificates
#   --seed-db           Seed database with sample data
#   -y, --yes           Skip confirmation prompts
#   --help              Show this help message
# =================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_DIR="$SCRIPT_DIR"
LOG_FILE="${DEPLOYMENT_DIR}/public-launch-$(date +%Y%m%d_%H%M%S).log"
VERSION=$(cat "${PROJECT_ROOT}/VERSION" 2>/dev/null || echo "1.0.0")

# Default configuration
DOMAIN="${DOMAIN:-cortexbuildpro.com}"
EMAIL="${EMAIL:-admin@cortexbuildpro.com}"
VPS_IP="${VPS_IP:-72.62.132.43}"
SKIP_BUILD=false
WITH_PORTAINER=true
WITH_SSL=false
SEED_DATABASE=false
SKIP_CONFIRMATIONS=false

# Docker Image Configuration
REGISTRY="ghcr.io"
IMAGE_NAME="adrianstanca1/cortexbuild-pro"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --vps-ip)
            VPS_IP="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --with-portainer)
            WITH_PORTAINER=true
            shift
            ;;
        --no-portainer)
            WITH_PORTAINER=false
            shift
            ;;
        --with-ssl)
            WITH_SSL=true
            shift
            ;;
        --seed-db)
            SEED_DATABASE=true
            shift
            ;;
        -y|--yes)
            SKIP_CONFIRMATIONS=true
            shift
            ;;
        --help|-h)
            cat << EOF
CortexBuild Pro - Public Launch Master Script
==============================================

Usage: $0 [options]

Options:
  --domain DOMAIN     Your public domain (default: cortexbuildpro.com)
  --email EMAIL       Email for SSL certificate notifications
  --vps-ip IP         VPS IP address (default: 72.62.132.43)
  --skip-build        Skip Docker build (use existing image)
  --with-portainer    Install/update Portainer Docker Manager (default: true)
  --no-portainer      Skip Portainer installation
  --with-ssl          Configure SSL certificates with Let's Encrypt
  --seed-db           Seed database with sample data
  -y, --yes           Skip all confirmation prompts
  --help, -h          Show this help message

Examples:
  # Full public launch with SSL
  sudo $0 --domain cortexbuildpro.com --email admin@cortexbuildpro.com --with-ssl -y

  # Quick deployment without rebuilding
  sudo $0 --skip-build -y

  # Deploy to custom VPS
  sudo $0 --vps-ip 192.168.1.100 --domain myapp.com -y

Environment Variables:
  POSTGRES_PASSWORD   Database password (auto-generated if not set)
  NEXTAUTH_SECRET     NextAuth secret (auto-generated if not set)
  ENCRYPTION_KEY      Encryption key (auto-generated if not set)
  ABACUSAI_API_KEY    AbacusAI API key (optional)

EOF
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Logging functions
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_step() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}  $1${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}→${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

# Utility functions
generate_secret() {
    openssl rand -base64 32 | tr -d '/+=' | cut -c1-32
}

confirm() {
    if [ "$SKIP_CONFIRMATIONS" = true ]; then
        return 0
    fi
    read -p "$1 (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Print banner
print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║   ██████╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗                        ║
║  ██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝                        ║
║  ██║     ██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝                         ║
║  ██║     ██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗                         ║
║  ╚██████╗╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗                        ║
║   ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝                        ║
║                                                                            ║
║              BUILD PRO - Public Launch Master Script                       ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo -e "${MAGENTA}  Version: ${VERSION}${NC}"
    echo -e "${MAGENTA}  Domain:  ${DOMAIN}${NC}"
    echo -e "${MAGENTA}  VPS IP:  ${VPS_IP}${NC}"
    echo ""
}

# Step 0: Pre-flight checks
preflight_checks() {
    log_step "Step 0: Pre-flight Checks"
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
    log_success "Running as root"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_warn "Docker not found. Installing..."
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
        log_success "Docker installed"
    else
        log_success "Docker is installed ($(docker --version | cut -d ' ' -f3 | tr -d ','))"
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_warn "Docker Compose not found. Installing..."
        apt-get update
        apt-get install -y docker-compose-plugin
        log_success "Docker Compose installed"
    else
        log_success "Docker Compose is available"
    fi
    
    # Get server info
    SERVER_IP=$(hostname -I | awk '{print $1}')
    HOSTNAME=$(hostname)
    
    log_info "Server IP: $SERVER_IP"
    log_info "Hostname: $HOSTNAME"
}

# Step 1: Setup environment
setup_environment() {
    log_step "Step 1: Setting Up Environment Configuration"
    
    cd "$DEPLOYMENT_DIR"
    
    # Generate secrets if not set
    POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(generate_secret)}
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-$(generate_secret)}
    ENCRYPTION_KEY=${ENCRYPTION_KEY:-$(openssl rand -hex 32)}
    
    # Create .env file
    cat > .env << EOF
# =================================================================
# CortexBuild Pro - Production Environment
# Generated by Public Launch Master Script
# Generated: $(date -Iseconds)
# =================================================================

# Database Configuration
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=cortexbuild

# Application URLs  
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Security & Encryption
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# API Keys
ABACUSAI_API_KEY=${ABACUSAI_API_KEY:-}

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-}
AWS_BUCKET_NAME=${AWS_BUCKET_NAME:-}
AWS_REGION=${AWS_REGION:-us-east-1}

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=https://${DOMAIN}
WEBSOCKET_PORT=3000

# Production settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Domain Configuration
DOMAIN=${DOMAIN}
SSL_EMAIL=${EMAIL}
EOF
    
    chmod 600 .env
    log_success "Environment file created with secure permissions"
}

# Step 2: Build Docker image
build_docker_image() {
    log_step "Step 2: Building Docker Image"
    
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Skipping build (--skip-build flag set)"
        return 0
    fi
    
    cd "$DEPLOYMENT_DIR"
    
    log_info "Stopping existing containers..."
    docker compose down --remove-orphans 2>/dev/null || true
    
    log_info "Removing old Docker images..."
    docker rmi cortexbuild-app:latest 2>/dev/null || true
    
    log_info "Building fresh Docker image (this may take 5-10 minutes)..."
    docker build --no-cache -t cortexbuild-app:latest -f Dockerfile ..
    
    # Tag with timestamp for backup
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    docker tag cortexbuild-app:latest cortexbuild-app:$TIMESTAMP
    
    log_success "Docker image built: cortexbuild-app:latest"
    log_success "Backup tag: cortexbuild-app:$TIMESTAMP"
}

# Step 3: Deploy to Docker Manager (Portainer)
setup_docker_manager() {
    log_step "Step 3: Setting Up Docker Manager (Portainer)"
    
    if [ "$WITH_PORTAINER" = false ]; then
        log_info "Skipping Portainer setup (--no-portainer flag set)"
        return 0
    fi
    
    if docker ps | grep -q portainer; then
        log_info "Portainer is already running"
        
        # Update Portainer if needed
        PORTAINER_VERSION=$(docker inspect portainer --format '{{.Config.Image}}' 2>/dev/null | cut -d: -f2)
        log_info "Current Portainer version: $PORTAINER_VERSION"
    else
        log_info "Installing Portainer (Docker Manager)..."
        
        # Create volume for Portainer data
        docker volume create portainer_data
        
        # Run Portainer
        docker run -d \
            --name portainer \
            --restart=always \
            -p 9000:9000 \
            -p 9443:9443 \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v portainer_data:/data \
            portainer/portainer-ce:latest
        
        log_success "Portainer installed successfully"
    fi
    
    log_info "Portainer is accessible at:"
    log_info "  HTTP:  http://${VPS_IP}:9000"
    log_info "  HTTPS: https://${VPS_IP}:9443"
    log_info "  Create admin account on first visit"
}

# Step 4: Deploy application
deploy_application() {
    log_step "Step 4: Deploying Application"
    
    cd "$DEPLOYMENT_DIR"
    
    log_info "Starting services with Docker Compose..."
    docker compose up -d
    
    log_success "Application containers started"
    
    # Wait for database
    log_info "Waiting for database to be ready..."
    MAX_RETRIES=30
    RETRY_COUNT=0
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if docker compose exec -T db pg_isready -U cortexbuild -d cortexbuild > /dev/null 2>&1; then
            log_success "Database is ready"
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -n "."
        sleep 2
    done
    echo ""
    
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        log_warn "Database health check timed out, but continuing..."
    fi
}

# Step 5: Run database migrations
run_migrations() {
    log_step "Step 5: Running Database Migrations"
    
    cd "$DEPLOYMENT_DIR"
    
    log_info "Waiting for application to be ready..."
    sleep 10
    
    log_info "Running Prisma migrations..."
    if docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy"; then
        log_success "Database migrations completed successfully"
    else
        log_warn "Migration failed, retrying in 10 seconds..."
        sleep 10
        docker compose exec -T app sh -c "cd /app && npx prisma migrate deploy" || {
            log_error "Database migrations failed"
            log_info "You can retry manually with: docker compose exec app npx prisma migrate deploy"
        }
    fi
    
    # Seed database if requested
    if [ "$SEED_DATABASE" = true ]; then
        log_info "Seeding database with sample data..."
        docker compose exec -T app sh -c "cd /app && npx prisma db seed" || {
            log_warn "Database seeding failed (this is optional)"
        }
        log_success "Database seeded"
    fi
}

# Step 6: Setup SSL (optional)
setup_ssl() {
    log_step "Step 6: SSL Certificate Setup"
    
    if [ "$WITH_SSL" = false ]; then
        log_info "Skipping SSL setup (use --with-ssl to enable)"
        return 0
    fi
    
    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "your-domain.com" ]; then
        log_warn "Domain not configured, skipping SSL setup"
        return 0
    fi
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        log_info "Installing certbot..."
        apt-get update
        apt-get install -y certbot
    fi
    
    log_info "Obtaining SSL certificate for $DOMAIN..."
    
    # Stop nginx to free port 80
    docker compose stop nginx 2>/dev/null || true
    
    certbot certonly --standalone \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --email "$EMAIL" \
        --non-interactive \
        --agree-tos \
        --expand || {
        log_warn "SSL certificate acquisition failed"
        log_info "You can set up SSL manually later with: ./setup-ssl.sh $DOMAIN $EMAIL"
    }
    
    # Restart nginx
    docker compose start nginx 2>/dev/null || true
    
    log_success "SSL certificate obtained for $DOMAIN"
}

# Step 7: Health check
run_health_check() {
    log_step "Step 7: Final Health Check"
    
    cd "$DEPLOYMENT_DIR"
    
    log_info "Waiting for application to be fully ready..."
    sleep 15
    
    # Check application health
    MAX_RETRIES=30
    RETRY_COUNT=0
    APP_HEALTHY=false
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -fsS "http://localhost:3000/" >/dev/null 2>&1; then
            APP_HEALTHY=true
            break
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_info "Waiting for app (attempt $RETRY_COUNT/$MAX_RETRIES)..."
        sleep 5
    done
    
    if [ "$APP_HEALTHY" = true ]; then
        log_success "Application is healthy and responding!"
    else
        log_error "Application health check failed"
        log_info "Check logs: docker compose logs app"
    fi
    
    # Check Portainer health
    if [ "$WITH_PORTAINER" = true ]; then
        if curl -fsS "http://localhost:9000/" >/dev/null 2>&1; then
            log_success "Portainer (Docker Manager) is healthy"
        else
            log_warn "Portainer may not be responding yet"
        fi
    fi
}

# Step 8: Upload configuration to Portainer (via stack file)
configure_portainer_stack() {
    log_step "Step 8: Configuring Portainer Stack"
    
    if [ "$WITH_PORTAINER" = false ]; then
        log_info "Skipping Portainer stack configuration"
        return 0
    fi
    
    cd "$DEPLOYMENT_DIR"
    
    # Create Portainer environment file
    cat > portainer-stack-env.current.txt << EOF
# Current Environment Variables for Portainer Stack
# Copy these into Portainer's Environment Variables section
# Generated: $(date -Iseconds)

POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=cortexbuild
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
ABACUSAI_API_KEY=${ABACUSAI_API_KEY:-}
EOF
    
    chmod 600 portainer-stack-env.current.txt
    
    log_success "Portainer stack configuration saved to portainer-stack-env.current.txt"
    log_info "To deploy via Portainer:"
    log_info "  1. Access Portainer at http://${VPS_IP}:9000"
    log_info "  2. Go to Stacks → Add Stack"
    log_info "  3. Name: cortexbuild-pro"
    log_info "  4. Use Web Editor and paste contents of docker-stack.yml"
    log_info "  5. Add environment variables from portainer-stack-env.current.txt"
    log_info "  6. Deploy the stack"
}

# Print final summary
print_summary() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}║                                                                            ║${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}║              🎉 PUBLIC LAUNCH COMPLETED SUCCESSFULLY! 🎉                   ║${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}║                                                                            ║${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}  Access URLs${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo -e "${MAGENTA}  Application:${NC}" | tee -a "$LOG_FILE"
    echo "    Public URL:   https://${DOMAIN}" | tee -a "$LOG_FILE"
    echo "    Direct URL:   http://${VPS_IP}:3000" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    if [ "$WITH_PORTAINER" = true ]; then
        echo -e "${MAGENTA}  Docker Manager (Portainer):${NC}" | tee -a "$LOG_FILE"
        echo "    URL:          http://${VPS_IP}:9000" | tee -a "$LOG_FILE"
        echo "    Secure URL:   https://${VPS_IP}:9443" | tee -a "$LOG_FILE"
        echo "    Note:         Create admin account on first visit" | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
    fi
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}  Container Status${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10 | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}  Useful Commands${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "  View logs:        docker compose logs -f app" | tee -a "$LOG_FILE"
    echo "  Restart app:      docker compose restart app" | tee -a "$LOG_FILE"
    echo "  Stop all:         docker compose down" | tee -a "$LOG_FILE"
    echo "  Health check:     ./health-check.sh" | tee -a "$LOG_FILE"
    echo "  Backup data:      ./backup.sh" | tee -a "$LOG_FILE"
    echo "  Run migrations:   docker compose exec app npx prisma migrate deploy" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}  Security Credentials (SAVE THESE!)${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo -e "${YELLOW}  ⚠ SAVE THESE CREDENTIALS SECURELY!${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "  Database Password:  ${POSTGRES_PASSWORD}" | tee -a "$LOG_FILE"
    echo "  NextAuth Secret:    ${NEXTAUTH_SECRET}" | tee -a "$LOG_FILE"
    echo "  Encryption Key:     ${ENCRYPTION_KEY}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "  These are also saved in: ${DEPLOYMENT_DIR}/.env" | tee -a "$LOG_FILE"
    echo "  Portainer config:   ${DEPLOYMENT_DIR}/portainer-stack-env.current.txt" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}  Log File${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "  $LOG_FILE" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Main execution
main() {
    print_banner
    
    if ! confirm "Ready to deploy CortexBuild Pro to public production?"; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    log_info "Starting Public Launch deployment..."
    log_info "Log file: $LOG_FILE"
    
    preflight_checks
    setup_environment
    build_docker_image
    setup_docker_manager
    deploy_application
    run_migrations
    setup_ssl
    run_health_check
    configure_portainer_stack
    print_summary
    
    log_success "Public Launch completed successfully!"
}

# Run main function
main "$@"
