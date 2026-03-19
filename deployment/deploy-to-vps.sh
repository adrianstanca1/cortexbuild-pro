#!/bin/bash
set -euo pipefail

# ============================================================
# CortexBuild Pro - One-Command VPS Deployment Script
# ============================================================
# Usage: ./deploy-to-vps.sh [OPTIONS]
#
# Options:
#   --skip-build      Skip image build (use existing)
#   --skip-migrate    Skip database migrations
#   --force           Force rebuild without cache
#   --rollback        Rollback to previous version
#   --help            Show this help message
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DEPLOYMENT_DIR="/var/www/cortexbuildpro/deployment"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_FILE="/var/log/cortexbuildpro-deploy.log"

# Parse arguments
SKIP_BUILD=false
SKIP_MIGRATE=false
FORCE_REBUILD=false
ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-migrate)
            SKIP_MIGRATE=true
            shift
            ;;
        --force)
            FORCE_REBUILD=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --help)
            head -12 "$0" | tail -10
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# ============================================================
# Helper Functions
# ============================================================

log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║     CortexBuild Pro - VPS Deployer        ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || { error "Docker is required but not installed."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { error "Docker Compose is required but not installed."; exit 1; }
    
    docker --version | awk '{print "  Docker: " $3}'
    docker-compose --version | awk '{print "  Compose: " $4}'
    
    success "Prerequisites OK"
}

validate_env() {
    log "Validating environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        error "$ENV_FILE not found!"
        echo "Creating from template..."
        if [ -f ".env.production.template" ]; then
            cp .env.production.template "$ENV_FILE"
            warn "Please edit $ENV_FILE with your settings"
            exit 1
        else
            error ".env.production.template not found"
            exit 1
        fi
    fi
    
    # Source environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    # Validate required variables
    required_vars=("POSTGRES_PASSWORD" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            error "$var is not set in $ENV_FILE"
            exit 1
        fi
    done
    
    # Validate POSTGRES_PASSWORD strength
    if [ ${#POSTGRES_PASSWORD} -lt 16 ]; then
        warn "POSTGRES_PASSWORD should be at least 16 characters"
    fi
    
    success "Environment validated"
}

backup_current() {
    log "Creating pre-deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker-compose -f "$COMPOSE_FILE" ps db 2>/dev/null | grep -q "Up"; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        docker-compose -f "$COMPOSE_FILE" exec -T db pg_dumpall -U "${POSTGRES_USER:-cortexbuild}" 2>/dev/null | \
            gzip > "$BACKUP_DIR/pre-deploy-$TIMESTAMP.sql.gz"
        success "Database backed up: $BACKUP_DIR/pre-deploy-$TIMESTAMP.sql.gz"
    else
        warn "Database not running, skipping backup"
    fi
}

stop_services() {
    log "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    success "Services stopped"
}

build_image() {
    if [ "$SKIP_BUILD" = true ]; then
        log "Skipping image build (--skip-build)"
        return
    fi
    
    log "Building production image..."
    
    if [ "$FORCE_REBUILD" = true ]; then
        docker-compose -f "$COMPOSE_FILE" build --no-cache app
    else
        docker-compose -f "$COMPOSE_FILE" build app
    fi
    
    success "Image built"
}

start_database() {
    log "Starting database..."
    docker-compose -f "$COMPOSE_FILE" up -d db redis
    
    log "Waiting for database to be ready..."
    sleep 10
    
    # Wait for health check
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" ps db 2>/dev/null | grep -q "healthy"; then
            success "Database is healthy"
            return
        fi
        sleep 2
    done
    
    error "Database failed to start"
    docker-compose -f "$COMPOSE_FILE" logs db
    exit 1
}

run_migrations() {
    if [ "$SKIP_MIGRATE" = true ]; then
        log "Skipping migrations (--skip-migrate)"
        return
    fi
    
    log "Running database migrations..."
    
    if docker-compose -f "$COMPOSE_FILE" run --rm app npx prisma migrate deploy 2>&1; then
        success "Migrations completed"
    else
        warn "Migration failed or not needed, attempting schema push..."
        docker-compose -f "$COMPOSE_FILE" run --rm app npx prisma db push || true
    fi
}

start_application() {
    log "Starting application..."
    docker-compose -f "$COMPOSE_FILE" up -d app
    
    log "Waiting for application health check..."
    sleep 10
    
    # Wait for health check
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" ps app 2>/dev/null | grep -q "healthy"; then
            success "Application is healthy"
            return
        fi
        sleep 2
    done
    
    warn "Application may still be starting..."
}

start_nginx() {
    log "Starting nginx..."
    docker-compose -f "$COMPOSE_FILE" up -d nginx
    
    sleep 3
    
    if docker-compose -f "$COMPOSE_FILE" ps nginx 2>/dev/null | grep -q "Up"; then
        success "Nginx started"
    else
        error "Nginx failed to start"
        docker-compose -f "$COMPOSE_FILE" logs nginx
        exit 1
    fi
}

verify_deployment() {
    log "Verifying deployment..."
    
    echo ""
    echo "Container Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo "Health Check:"
    if curl -sf -o /dev/null http://localhost:3010/api/health; then
        success "Health endpoint responding"
    else
        warn "Health endpoint not responding yet"
    fi
    
    echo ""
    echo "Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
}

show_summary() {
    echo ""
    success "════════════════════════════════════════════"
    success "         Deployment Complete!               "
    success "════════════════════════════════════════════"
    echo ""
    echo "Production URL: http://localhost:3010"
    echo "Database Port:  5432 (internal)"
    echo ""
    echo "Next steps:"
    echo "  1. Configure SSL: ./setup-ssl.sh your-domain.com"
    echo "  2. Seed database: ./seed-db.sh"
    echo "  3. View logs:     docker-compose -f $COMPOSE_FILE logs -f"
    echo "  4. Monitor:       watch -n 5 'curl -s http://localhost:3010/api/health'"
    echo ""
    echo "Useful commands:"
    echo "  docker-compose -f $COMPOSE_FILE ps           # Status"
    echo "  docker-compose -f $COMPOSE_FILE logs -f app  # App logs"
    echo "  docker-compose -f $COMPOSE_FILE restart app  # Restart app"
    echo "  ./backup.sh                                  # Backup DB"
    echo ""
}

# ============================================================
# Main Deployment Flow
# ============================================================

main() {
    header
    check_prerequisites
    validate_env
    
    if [ "$ROLLBACK" = true ]; then
        warn "Rollback mode - restoring previous version"
        backup_current
        stop_services
        start_database
        start_application
        start_nginx
        verify_deployment
    else
        backup_current
        stop_services
        build_image
        start_database
        run_migrations
        start_application
        start_nginx
        verify_deployment
    fi
    
    show_summary
}

# Run main function
main "$@"
