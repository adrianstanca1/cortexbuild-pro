#!/bin/bash

# ============================================
# CortexBuild Pro - Enterprise Restore Script
# ============================================
# Safe database restore with pre-restore backup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="${BACKUP_DIR:-$HOME/backups}"

# Load environment variables
load_env() {
    if [ -f "$SCRIPT_DIR/.env" ]; then
        source "$SCRIPT_DIR/.env"
    elif [ -f "$SCRIPT_DIR/../nextjs_space/.env" ]; then
        source "$SCRIPT_DIR/../nextjs_space/.env"
    elif [ -f "$HOME/.env" ]; then
        source "$HOME/.env"
    fi
}

# Parse DATABASE_URL
parse_database_url() {
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        exit 1
    fi
    
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    
    print_info "Database: $DB_NAME on $DB_HOST:$DB_PORT"
}

# List available backups
list_backups() {
    echo ""
    print_info "Available backups:"
    echo ""
    
    local found_backups=0
    
    for dir in daily weekly monthly hourly; do
        local backup_dir="$BACKUP_BASE_DIR/$dir"
        if [ -d "$backup_dir" ]; then
            local backups=$(find "$backup_dir" -name "*.sql.gz" -type f 2>/dev/null | sort -r)
            if [ -n "$backups" ]; then
                echo "  ${BLUE}$dir backups:${NC}"
                while IFS= read -r backup; do
                    local size=$(du -h "$backup" | cut -f1)
                    local date=$(basename "$backup" | grep -o '[0-9]\{8\}_[0-9]\{6\}' || echo "unknown")
                    echo "    $(basename $backup) (${size}) - $date"
                    ((found_backups++))
                done <<< "$backups"
                echo ""
            fi
        fi
    done
    
    if [ $found_backups -eq 0 ]; then
        print_error "No backups found in $BACKUP_BASE_DIR"
        exit 1
    fi
}

# Validate backup file
validate_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Check if file is compressed
    if [[ "$backup_file" != *.gz ]]; then
        print_error "Backup file must be gzip compressed (.gz)"
        exit 1
    fi
    
    # Test if file is valid gzip
    if ! gzip -t "$backup_file" 2>/dev/null; then
        print_error "Backup file is corrupted or not a valid gzip file"
        exit 1
    fi
    
    print_success "Backup file validated"
}

# Create pre-restore safety backup
create_safety_backup() {
    print_info "Creating pre-restore safety backup..."
    
    local safety_dir="$BACKUP_BASE_DIR/pre-restore"
    mkdir -p "$safety_dir"
    
    local safety_file="${safety_dir}/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
    
    export PGPASSWORD="$DB_PASS"
    
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --clean --if-exists --no-owner --no-acl \
        > "$safety_file" 2>/dev/null || {
        print_warning "Could not create safety backup (database may be empty)"
        unset PGPASSWORD
        return 0
    }
    
    gzip -f "$safety_file"
    unset PGPASSWORD
    
    SAFETY_BACKUP="${safety_file}.gz"
    print_success "Safety backup created: $SAFETY_BACKUP"
}

# Stop application (if PM2 is used)
stop_application() {
    if command -v pm2 &> /dev/null; then
        print_info "Stopping application..."
        
        # Find running CortexBuild app
        local app_name=$(pm2 list | grep -o 'cortexbuild-[^ ]*' | head -1)
        
        if [ -n "$app_name" ]; then
            pm2 stop "$app_name" 2>/dev/null || true
            print_success "Application stopped: $app_name"
            APP_STOPPED="$app_name"
        else
            print_info "No PM2 application found running"
        fi
    fi
}

# Start application
start_application() {
    if [ -n "$APP_STOPPED" ] && command -v pm2 &> /dev/null; then
        print_info "Starting application: $APP_STOPPED..."
        pm2 start "$APP_STOPPED"
        sleep 3
        
        # Verify application started
        if pm2 list | grep -q "$APP_STOPPED.*online"; then
            print_success "Application started successfully"
        else
            print_warning "Application may not have started correctly"
            print_info "Check with: pm2 logs $APP_STOPPED"
        fi
    fi
}

# Restore database
restore_database() {
    local backup_file=$1
    
    print_info "Restoring database from: $(basename $backup_file)"
    print_warning "This will REPLACE all data in database: $DB_NAME"
    
    export PGPASSWORD="$DB_PASS"
    
    # Restore
    if gunzip < "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" 2>&1 | grep -v "^$"; then
        unset PGPASSWORD
        print_success "Database restored successfully"
        return 0
    else
        unset PGPASSWORD
        print_error "Database restore failed!"
        return 1
    fi
}

# Verify restore
verify_restore() {
    print_info "Verifying database restore..."
    
    export PGPASSWORD="$DB_PASS"
    
    # Check if we can connect
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        unset PGPASSWORD
        print_error "Cannot connect to database after restore"
        return 1
    fi
    
    # Check if tables exist
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    
    unset PGPASSWORD
    
    if [ "$table_count" -gt 0 ]; then
        print_success "Database verified: $table_count tables found"
        return 0
    else
        print_error "Database appears empty after restore"
        return 1
    fi
}

# Rollback to safety backup
rollback_to_safety() {
    if [ -f "$SAFETY_BACKUP" ]; then
        print_warning "Attempting to restore from safety backup..."
        
        if restore_database "$SAFETY_BACKUP"; then
            print_success "Rolled back to pre-restore state"
        else
            print_error "Rollback failed! Manual intervention required"
        fi
    else
        print_error "No safety backup available for rollback"
    fi
}

# Main restore process
main() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║  CortexBuild Pro - Database Restore    ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    
    # Load configuration
    load_env
    parse_database_url
    
    # Check if backup file provided
    if [ -z "$1" ]; then
        list_backups
        echo ""
        print_info "Usage: $0 <backup-file.sql.gz>"
        print_info "Example: $0 $BACKUP_BASE_DIR/daily/production_cortexbuild_20260129_020000.sql.gz"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    # Validate backup
    validate_backup "$BACKUP_FILE"
    
    # Confirm restore
    echo ""
    print_warning "⚠️  WARNING: Database Restore Operation"
    echo ""
    echo "This will:"
    echo "  1. Create a safety backup of current database"
    echo "  2. Stop the application (if running)"
    echo "  3. REPLACE all data in database: $DB_NAME"
    echo "  4. Restore from: $(basename $BACKUP_FILE)"
    echo "  5. Restart the application"
    echo ""
    
    # Require explicit confirmation
    read -p "Type 'RESTORE' to confirm: " CONFIRM
    
    if [ "$CONFIRM" != "RESTORE" ]; then
        print_info "Restore cancelled"
        exit 0
    fi
    
    # Execute restore
    create_safety_backup
    stop_application
    
    if restore_database "$BACKUP_FILE"; then
        if verify_restore; then
            start_application
            
            echo ""
            print_success "✨ Database restored successfully!"
            echo ""
            echo "Next steps:"
            echo "  1. Verify application is working"
            echo "  2. Check data integrity"
            echo "  3. Test critical functionality"
            echo ""
            
            if [ -f "$SAFETY_BACKUP" ]; then
                echo "Safety backup available at:"
                echo "  $SAFETY_BACKUP"
                echo ""
            fi
        else
            print_error "Restore verification failed!"
            rollback_to_safety
            start_application
            exit 1
        fi
    else
        print_error "Restore failed!"
        rollback_to_safety
        start_application
        exit 1
    fi
}

# Handle errors
trap 'print_error "Restore process interrupted!"; rollback_to_safety 2>/dev/null || true; start_application 2>/dev/null || true; exit 1' ERR INT TERM

# Run main function
main "$@"
