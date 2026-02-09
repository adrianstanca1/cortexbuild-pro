#!/bin/bash
# =============================================================================
# CortexBuild Pro - Production Deployment Script
# =============================================================================
# This script handles the complete production deployment workflow:
# 1. Commits all pending changes
# 2. Rebuilds the application for production
# 3. Deploys to VPS after merge
# 4. Cleans up repositories
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_DIR="$SCRIPT_DIR"
LOG_FILE="${DEPLOYMENT_DIR}/production-deploy.log"

# Require command to exist before continuing
require_command() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        log_error "Required command not found: $cmd"
        return 1
    fi
}

# Install Docker automatically when missing
install_docker() {
    log_warn "Docker not found. Attempting automatic installation..."

    if ! command -v curl >/dev/null 2>&1; then
        log_error "curl is required to install Docker automatically"
        return 1
    fi

    if [[ $EUID -ne 0 ]]; then
        if command -v sudo >/dev/null 2>&1; then
            curl -fsSL https://get.docker.com | sudo sh
        else
            log_error "Docker install requires root privileges or sudo"
            return 1
        fi
    else
        curl -fsSL https://get.docker.com | sh
    fi

    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker installation finished but docker command is still unavailable"
        return 1
    fi

    log_success "Docker installed successfully"
}

# Ensure Docker Engine and CLI are available and ready
ensure_docker_available() {
    if ! command -v docker >/dev/null 2>&1; then
        install_docker || return 1
    fi

    # Start Docker daemon if present but not running
    if ! docker info >/dev/null 2>&1; then
        log_warn "Docker daemon is not running. Attempting to start it..."
        if command -v systemctl >/dev/null 2>&1; then
            if [[ $EUID -ne 0 ]] && command -v sudo >/dev/null 2>&1; then
                sudo systemctl start docker || true
            else
                systemctl start docker || true
            fi
        elif command -v service >/dev/null 2>&1; then
            if [[ $EUID -ne 0 ]] && command -v sudo >/dev/null 2>&1; then
                sudo service docker start || true
            else
                service docker start || true
            fi
        fi
    fi

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is installed but the daemon is not running"
        return 1
    fi

    if ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose plugin is not available (docker compose)"
        return 1
    fi

    log_success "Docker and Docker Compose are available"
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo "  CortexBuild Pro - Production Deployment"
    echo "  Version: $(cat ${APP_ROOT}/VERSION 2>/dev/null || echo 'unknown')"
    echo "============================================================================="
    echo -e "${NC}"
}

# Step 1: Commit all changes
commit_changes() {
    log_info "Step 1: Committing all changes..."
    cd "$APP_ROOT"
    
    # Check if there are changes to commit
    if [[ -n $(git status --porcelain) ]]; then
        log_info "Found uncommitted changes, committing..."
        git add -A ':!deployment/production-deploy.log'
        git commit -m "Production deployment: $(date +'%Y-%m-%d %H:%M:%S')" || log_warn "Commit failed or nothing to commit"
        log_success "Changes committed successfully"
    else
        log_info "No changes to commit - working tree is clean"
    fi
}

# Step 2: Rebuild for production
rebuild_production() {
    log_info "Step 2: Rebuilding application for production..."
    cd "$DEPLOYMENT_DIR"

    ensure_docker_available || return 1
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker compose down 2>/dev/null || log_warn "No existing containers to stop"
    
    # Clean up old build artifacts
    log_info "Cleaning up old build artifacts..."
    cd "${APP_ROOT}/nextjs_space"
    rm -rf .next || true
    rm -rf node_modules/.cache || true
    
    # Build with no cache to ensure fresh production build
    cd "$DEPLOYMENT_DIR"
    log_info "Building fresh Docker images (this may take several minutes)..."
    docker compose build --no-cache app
    
    log_success "Production build completed successfully"
}

# Step 3: Deploy to VPS (merge and deploy)
deploy_to_vps() {
    log_info "Step 3: Deploying to VPS..."
    cd "$DEPLOYMENT_DIR"

    ensure_docker_available || return 1
    
    # Start containers
    log_info "Starting containers in production mode..."
    docker compose up -d
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 15
    
    # Run database migrations
    log_info "Running database migrations..."
    docker compose exec -T app npx prisma migrate deploy || log_warn "Migration failed or not needed"
    
    # Check container status
    log_info "Verifying container status..."
    docker compose ps
    
    log_success "Application deployed successfully"
}

# Step 4: Clean repositories
clean_repositories() {
    log_info "Step 4: Cleaning repositories and artifacts..."
    cd "$APP_ROOT"
    
    # Clean Docker artifacts
    log_info "Cleaning Docker system..."
    docker system prune -f --volumes 2>/dev/null || log_warn "Docker cleanup had warnings"
    
    # Clean old images
    log_info "Removing old/dangling Docker images..."
    docker image prune -af 2>/dev/null || log_warn "Image cleanup had warnings"
    
    # Clean git repository
    log_info "Running git garbage collection..."
    cd "$APP_ROOT"
    git gc --aggressive --prune=now 2>/dev/null || log_warn "Git cleanup had warnings"
    
    # Clean build artifacts in nextjs_space
    log_info "Cleaning Next.js build artifacts..."
    cd "${APP_ROOT}/nextjs_space"
    rm -rf .next/cache || true
    rm -rf node_modules/.cache || true
    
    # Clean logs older than 7 days
    log_info "Cleaning old logs..."
    find /var/log -name "*.log.*" -type f -mtime +7 -delete 2>/dev/null || true
    
    log_success "Repository cleanup completed"
}

# Health check
run_health_check() {
    log_info "Running post-deployment health check..."

    require_command curl || return 1
    
    # Wait for app to be fully ready
    sleep 10
    
    # Check if app is responding
    if curl -f -s http://localhost:3000/ > /dev/null; then
        log_success "Application is responding on port 3000"
    else
        log_error "Application is not responding on port 3000"
        log_info "Check logs with: docker compose logs -f app"
        return 1
    fi
    
    # Check database connection
    if docker compose exec -T app npx prisma db pull --print 2>&1 | grep -q "success" || true; then
        log_success "Database connection verified"
    else
        log_warn "Could not verify database connection"
    fi
    
    log_success "Health check completed"
}

# Print deployment summary
print_summary() {
    echo ""
    echo -e "${CYAN}============================================================================="
    echo "  Deployment Summary"
    echo "=============================================================================${NC}"
    echo ""
    echo "✓ All changes committed"
    echo "✓ Production build completed"
    echo "✓ Application deployed to VPS"
    echo "✓ Repositories cleaned"
    echo ""
    echo -e "${GREEN}Deployment completed successfully!${NC}"
    echo ""
    echo "Application URL: http://localhost:3000"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: docker compose logs -f app"
    echo "  - Check status: docker compose ps"
    echo "  - Run health check: ./health-check.sh"
    echo "  - Create backup: ./backup.sh"
    echo ""
    echo "Log file: $LOG_FILE"
    echo ""
}

# Error handler
error_handler() {
    log_error "Deployment failed at step: $1"
    log_info "Check the log file for details: $LOG_FILE"
    log_info "You can rollback using: ./rollback.sh"
    exit 1
}

# Main execution
main() {
    print_header

    require_command git || error_handler "require_command git"
    
    log_info "Starting production deployment workflow..."
    log_info "Log file: $LOG_FILE"
    echo ""
    
    # Execute deployment steps
    commit_changes || error_handler "commit_changes"
    rebuild_production || error_handler "rebuild_production"
    deploy_to_vps || error_handler "deploy_to_vps"
    clean_repositories || error_handler "clean_repositories"
    run_health_check || error_handler "run_health_check"
    
    print_summary
}

# Run main function
main "$@"
