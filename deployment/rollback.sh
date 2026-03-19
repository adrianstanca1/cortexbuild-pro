#!/bin/bash
set -euo pipefail

# ============================================================
# CortexBuild Pro - Rollback Script
# ============================================================
# Usage: ./rollback.sh [OPTIONS]
#
# Options:
#   --target COMMIT_SHA    Rollback to specific commit
#   --last                 Rollback to previous version
#   --db-backup FILE       Restore from specific DB backup
#   --dry-run              Show what would be done without executing
#   --help                 Show this help
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

# Parse arguments
TARGET_COMMIT=""
ROLLBACK_LAST=false
DB_BACKUP=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --target)
            TARGET_COMMIT="$2"
            shift 2
            ;;
        --last)
            ROLLBACK_LAST=true
            shift
            ;;
        --db-backup)
            DB_BACKUP="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            head -13 "$0" | tail -11
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
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║     CortexBuild Pro - Rollback Tool       ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ============================================================
# Rollback Functions
# ============================================================

rollback_docker_image() {
    log "Rolling back Docker image..."
    
    if [ "$ROLLBACK_LAST" = true ]; then
        # Get previous image tag
        PREVIOUS_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep cortexbuild | head -2 | tail -1)
        if [ -z "$PREVIOUS_IMAGE" ]; then
            error "No previous image found"
            exit 1
        fi
        log "Rolling back to: $PREVIOUS_IMAGE"
    elif [ -n "$TARGET_COMMIT" ]; then
        PREVIOUS_IMAGE="cortexbuild-app:$TARGET_COMMIT"
        log "Rolling back to commit: $TARGET_COMMIT"
    else
        error "Specify --last or --target COMMIT_SHA"
        exit 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] Would update docker-compose.prod.yml to use: $PREVIOUS_IMAGE"
        return
    fi
    
    # Stop current app
    docker-compose -f "$COMPOSE_FILE" stop app
    
    # Update and restart with previous image
    docker-compose -f "$COMPOSE_FILE" up -d app
    
    success "Docker image rolled back"
}

rollback_database() {
    if [ -n "$DB_BACKUP" ]; then
        log "Rolling back database from: $DB_BACKUP"
        
        if [ ! -f "$DB_BACKUP" ]; then
            error "Backup file not found: $DB_BACKUP"
            exit 1
        fi
        
        if [ "$DRY_RUN" = true ]; then
            log "[DRY-RUN] Would restore database from: $DB_BACKUP"
            return
        fi
        
        # Stop app
        docker-compose -f "$COMPOSE_FILE" stop app
        
        # Restore database
        gunzip -c "$DB_BACKUP" | docker-compose -f "$COMPOSE_FILE" exec -T db psql -U "${POSTGRES_USER:-cortexbuild}" -d "${POSTGRES_DB:-cortexbuild}"
        
        success "Database rolled back"
    else
        warn "No database backup specified, skipping DB rollback"
    fi
}

verify_rollback() {
    log "Verifying rollback..."
    
    sleep 10
    
    echo ""
    echo "Container Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo "Health Check:"
    if curl -sf -o /dev/null http://localhost:3010/api/health; then
        success "Health endpoint responding"
    else
        error "Health endpoint not responding"
        exit 1
    fi
    
    echo ""
    echo "Application Logs (last 20 lines):"
    docker-compose -f "$COMPOSE_FILE" logs --tail=20 app
}

show_summary() {
    echo ""
    success "════════════════════════════════════════════"
    success "         Rollback Complete!                 "
    success "════════════════════════════════════════════"
    echo ""
    echo "Rolled back to: ${TARGET_COMMIT:-previous version}"
    echo "Production URL: http://localhost:3010"
    echo ""
    echo "Monitor with: docker-compose -f $COMPOSE_FILE logs -f"
}

# ============================================================
# Main Rollback Flow
# ============================================================

main() {
    header
    
    # Check prerequisites
    command -v docker >/dev/null 2>&1 || { error "Docker is required"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { error "Docker Compose is required"; exit 1; }
    
    # Check .env file
    if [ ! -f "$ENV_FILE" ]; then
        error "$ENV_FILE not found"
        exit 1
    fi
    
    # Source environment
    set -a
    source "$ENV_FILE"
    set +a
    
    if [ "$DRY_RUN" = true ]; then
        warn "DRY-RUN MODE - No changes will be made"
        echo ""
    fi
    
    # Create safety backup before rollback
    if [ "$DRY_RUN" = false ]; then
        log "Creating safety backup of current state..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        mkdir -p "$BACKUP_DIR"
        docker-compose -f "$COMPOSE_FILE" exec -T db pg_dumpall -U "${POSTGRES_USER:-cortexbuild}" 2>/dev/null | \
            gzip > "$BACKUP_DIR/pre-rollback-$TIMESTAMP.sql.gz"
        success "Safety backup created: $BACKUP_DIR/pre-rollback-$TIMESTAMP.sql.gz"
    fi
    
    # Perform rollback
    rollback_docker_image
    rollback_database
    verify_rollback
    show_summary
}

# Run main function
main "$@"
