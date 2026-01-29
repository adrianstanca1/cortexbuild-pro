#!/bin/bash

# ============================================
# CortexBuild Pro - Enterprise Backup Script
# ============================================
# Automated backup with retention policy:
#   - 7 daily backups
#   - 4 weekly backups (Sundays)
#   - 6 monthly backups (1st of month)
# Optional: Upload to S3 for offsite storage

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="${BACKUP_DIR:-$HOME/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)

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

# Load environment variables
load_env() {
    # Try multiple locations for .env file
    if [ -f "$SCRIPT_DIR/.env" ]; then
        source "$SCRIPT_DIR/.env"
    elif [ -f "$SCRIPT_DIR/../nextjs_space/.env" ]; then
        source "$SCRIPT_DIR/../nextjs_space/.env"
    elif [ -f "$HOME/.env" ]; then
        source "$HOME/.env"
    fi
}

# Parse DATABASE_URL to extract connection details
parse_database_url() {
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        exit 1
    fi
    
    # Extract components from postgresql://user:pass@host:port/dbname
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    # Defaults
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    
    print_info "Database: $DB_NAME on $DB_HOST:$DB_PORT"
}

# Determine environment
determine_environment() {
    if [[ "$PWD" == *"staging"* ]] || [[ "$DB_NAME" == *"staging"* ]]; then
        ENVIRONMENT="staging"
    else
        ENVIRONMENT="production"
    fi
    print_info "Environment: $ENVIRONMENT"
}

# Create backup directories
create_backup_dirs() {
    mkdir -p "$BACKUP_BASE_DIR/daily"
    mkdir -p "$BACKUP_BASE_DIR/weekly"
    mkdir -p "$BACKUP_BASE_DIR/monthly"
    mkdir -p "$BACKUP_BASE_DIR/hourly"
}

# Backup database
backup_database() {
    local backup_type=$1
    local backup_dir="$BACKUP_BASE_DIR/$backup_type"
    local backup_file="${backup_dir}/${ENVIRONMENT}_${DB_NAME}_${DATE}.sql"
    
    print_info "Creating $backup_type backup: $backup_file"
    
    # Set password for pg_dump
    export PGPASSWORD="$DB_PASS"
    
    # Create backup with clean and if-exists flags for safe restore
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        > "$backup_file"
    
    # Unset password
    unset PGPASSWORD
    
    # Compress backup
    gzip -f "$backup_file"
    
    local compressed_file="${backup_file}.gz"
    local file_size=$(du -h "$compressed_file" | cut -f1)
    
    print_success "Backup created: ${compressed_file} (${file_size})"
    
    # Return compressed filename for S3 upload
    echo "$compressed_file"
}

# Apply retention policy
apply_retention() {
    local backup_dir=$1
    local keep_count=$2
    
    print_info "Applying retention policy to $backup_dir (keep last $keep_count)"
    
    # Find and delete old backups
    local deleted_count=0
    while IFS= read -r file; do
        rm -f "$file"
        ((deleted_count++))
    done < <(find "$backup_dir" -name "*.sql.gz" -type f | sort -r | tail -n +$((keep_count + 1)))
    
    if [ $deleted_count -gt 0 ]; then
        print_info "Deleted $deleted_count old backup(s)"
    fi
}

# Upload to S3 (optional)
upload_to_s3() {
    local backup_file=$1
    
    if [ -z "$BACKUP_BUCKET_NAME" ]; then
        print_info "S3 backup bucket not configured, skipping offsite backup"
        return 0
    fi
    
    if ! command -v aws &> /dev/null; then
        print_warning "AWS CLI not installed, skipping S3 upload"
        return 0
    fi
    
    print_info "Uploading to S3: s3://$BACKUP_BUCKET_NAME/cortexbuild/$ENVIRONMENT/database/"
    
    local s3_path="s3://$BACKUP_BUCKET_NAME/cortexbuild/$ENVIRONMENT/database/$(basename $backup_file)"
    
    aws s3 cp "$backup_file" "$s3_path" \
        --storage-class STANDARD_IA \
        --only-show-errors
    
    if [ $? -eq 0 ]; then
        print_success "Uploaded to S3: $s3_path"
    else
        print_warning "S3 upload failed (continuing anyway)"
    fi
}

# Send notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    # Slack webhook notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local emoji="✅"
        local color="good"
        
        if [ "$status" != "success" ]; then
            emoji="❌"
            color="danger"
        fi
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"$emoji Backup [$ENVIRONMENT]: $message\"}" \
            --silent --output /dev/null
    fi
}

# Main backup process
main() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║   CortexBuild Pro - Database Backup    ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    
    local start_time=$(date +%s)
    
    # Load configuration
    load_env
    parse_database_url
    determine_environment
    create_backup_dirs
    
    # Create daily backup
    backup_file=$(backup_database "daily")
    
    # Apply daily retention (keep 7)
    apply_retention "$BACKUP_BASE_DIR/daily" 7
    
    # Weekly backup (Sunday)
    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        print_info "Creating weekly backup (Sunday)..."
        cp "$backup_file" "$BACKUP_BASE_DIR/weekly/"
        apply_retention "$BACKUP_BASE_DIR/weekly" 4
    fi
    
    # Monthly backup (1st of month)
    if [ "$DAY_OF_MONTH" -eq "01" ]; then
        print_info "Creating monthly backup (1st of month)..."
        cp "$backup_file" "$BACKUP_BASE_DIR/monthly/"
        apply_retention "$BACKUP_BASE_DIR/monthly" 6
    fi
    
    # Upload to S3 (offsite backup)
    upload_to_s3 "$backup_file"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_success "Backup completed in ${duration}s"
    
    # Send notification
    send_notification "success" "Database backup completed (${duration}s)"
    
    echo ""
    echo "Backup Summary:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Database: $DB_NAME"
    echo "  Backup Location: $BACKUP_BASE_DIR"
    echo "  Duration: ${duration}s"
    echo ""
    
    # Show backup sizes
    echo "Storage Usage:"
    du -sh "$BACKUP_BASE_DIR"/* 2>/dev/null || true
    echo ""
}

# Handle errors
trap 'print_error "Backup failed!"; send_notification "error" "Database backup failed"; exit 1' ERR

# Run main function
main "$@"
