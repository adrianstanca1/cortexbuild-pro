#!/bin/bash
# =============================================================================
# CortexBuild Pro - Deployment Rollback Script
# =============================================================================
# This script allows rolling back to a previous deployment state
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/root/cortexbuild_backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_header() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "  CortexBuild Pro - Deployment Rollback"
    echo "============================================================================="
    echo -e "${NC}"
}

# Get database backup files (helper function)
get_db_backups() {
    local -a backups
    while IFS= read -r -d '' file; do
        backups+=("$file")
    done < <(find "$BACKUP_DIR" \( -name "db_backup_*.sql.gz" -o -name "db_backup_*.sql" \) -print0 | sort -zr)
    
    # Return backups via stdout (one per line) - handle empty array safely
    if [[ ${#backups[@]} -gt 0 ]]; then
        printf '%s\n' "${backups[@]}"
    fi
}

# List available backups
list_backups() {
    log_info "Available backups:"
    echo ""
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    # Get database backups
    mapfile -t db_backups < <(get_db_backups)
    
    if [[ ${#db_backups[@]} -eq 0 ]]; then
        log_error "No database backups found"
        exit 1
    fi
    
    echo "Database Backups:"
    for i in "${!db_backups[@]}"; do
        local backup="${db_backups[$i]}"
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
        echo "  [$i] $(basename "$backup") - $size - $date"
    done
    echo ""
    
    # Find environment backups
    local env_backups=()
    while IFS= read -r -d '' file; do
        env_backups+=("$file")
    done < <(find "$BACKUP_DIR" -name ".env.backup.*" -print0 | sort -zr)
    
    if [[ ${#env_backups[@]} -gt 0 ]]; then
        echo "Environment Backups:"
        for i in "${!env_backups[@]}"; do
            local backup="${env_backups[$i]}"
            local date=$(stat -c %y "$backup" | cut -d' ' -f1,2 | cut -d'.' -f1)
            echo "  [$i] $(basename "$backup") - $date"
        done
        echo ""
    fi
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Restoring database from: $(basename "$backup_file")"
    
    cd "$SCRIPT_DIR"
    
    # Check if database container is running
    if ! docker compose ps db --format '{{.State}}' | grep -q "running"; then
        log_error "Database container is not running"
        log_info "Starting database container..."
        docker compose up -d db
        sleep 10
    fi
    
    # Create a backup of current state before restore
    log_info "Creating safety backup of current database..."
    local safety_backup="$BACKUP_DIR/pre_rollback_$(date +%Y%m%d_%H%M%S).sql.gz"
    docker compose exec -T db pg_dump -U cortexbuild cortexbuild | gzip > "$safety_backup" || log_warn "Safety backup failed"
    
    # Drop and recreate database
    log_warn "Dropping existing database..."
    docker compose exec -T db psql -U cortexbuild -d postgres -c "DROP DATABASE IF EXISTS cortexbuild;" 2>/dev/null || true
    docker compose exec -T db psql -U cortexbuild -d postgres -c "CREATE DATABASE cortexbuild;" 2>/dev/null || true
    
    # Restore from backup
    log_info "Restoring data..."
    if [[ "$backup_file" == *.gz ]]; then
        if gunzip -c "$backup_file" | docker compose exec -T db psql -U cortexbuild -d cortexbuild; then
            log_success "Database restored successfully"
            return 0
        else
            log_error "Database restore failed"
            log_info "Safety backup available at: $safety_backup"
            return 1
        fi
    else
        if cat "$backup_file" | docker compose exec -T db psql -U cortexbuild -d cortexbuild; then
            log_success "Database restored successfully"
            return 0
        else
            log_error "Database restore failed"
            log_info "Safety backup available at: $safety_backup"
            return 1
        fi
    fi
}

# Restore environment file
restore_environment() {
    local env_file="$1"
    
    if [[ ! -f "$env_file" ]]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi
    
    log_info "Restoring environment from: $(basename "$env_file")"
    
    # Backup current .env
    if [[ -f "$SCRIPT_DIR/.env" ]]; then
        cp "$SCRIPT_DIR/.env" "$BACKUP_DIR/.env.pre_rollback.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Restore environment
    cp "$env_file" "$SCRIPT_DIR/.env"
    
    log_success "Environment file restored"
}

# Restart application
restart_application() {
    log_info "Restarting application..."
    
    cd "$SCRIPT_DIR"
    
    docker compose restart app
    
    log_info "Waiting for application to start..."
    sleep 10
    
    # Check if app is responding
    local max_attempts=20
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf http://localhost:3000/api/auth/providers >/dev/null 2>&1; then
            log_success "Application restarted successfully"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 3
    done
    
    log_error "Application failed to start properly"
    log_info "Check logs with: docker compose logs app"
    return 1
}

# Interactive rollback
interactive_rollback() {
    print_header
    
    list_backups
    
    # Get database backups using helper function
    mapfile -t db_backups < <(get_db_backups)
    
    # Select database backup
    echo -e "${YELLOW}Select database backup to restore:${NC}"
    read -p "Enter backup number (0-$((${#db_backups[@]}-1))): " backup_num
    
    if ! [[ "$backup_num" =~ ^[0-9]+$ ]] || [[ $backup_num -ge ${#db_backups[@]} ]]; then
        log_error "Invalid backup number"
        exit 1
    fi
    
    local selected_backup="${db_backups[$backup_num]}"
    
    echo ""
    log_warn "This will:"
    echo "  1. Create a safety backup of current database"
    echo "  2. Restore database from: $(basename "$selected_backup")"
    echo "  3. Restart the application"
    echo ""
    read -p "Continue? (yes/NO): " -r
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi
    
    echo ""
    
    # Perform rollback
    if restore_database "$selected_backup"; then
        restart_application
        
        echo ""
        log_success "Rollback completed successfully!"
        echo ""
        log_info "Run health check: bash $SCRIPT_DIR/health-check.sh"
    else
        log_error "Rollback failed"
        exit 1
    fi
}

# Quick rollback (most recent)
quick_rollback() {
    print_header
    
    log_info "Quick rollback to most recent backup..."
    
    # Get database backups using helper function
    mapfile -t db_backups < <(get_db_backups)
    
    if [[ ${#db_backups[@]} -eq 0 ]]; then
        log_error "No backups found"
        exit 1
    fi
    
    local latest_backup="${db_backups[0]}"
    log_info "Using: $(basename "$latest_backup")"
    
    if restore_database "$latest_backup"; then
        restart_application
        log_success "Quick rollback completed!"
    else
        log_error "Quick rollback failed"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [--quick]"
    echo ""
    echo "Options:"
    echo "  --quick    Rollback to most recent backup without prompting"
    echo "  (none)     Interactive rollback with backup selection"
    echo ""
}

# Main
main() {
    if [[ $# -eq 0 ]]; then
        interactive_rollback
    elif [[ "$1" == "--quick" ]]; then
        quick_rollback
    elif [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
        usage
    else
        log_error "Unknown option: $1"
        usage
        exit 1
    fi
}

main "$@"
