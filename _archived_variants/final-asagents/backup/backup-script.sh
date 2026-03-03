#!/bin/bash

# ASAgents SQLite Backup Script

set -e

# Configuration
BACKUP_DIR="/app/backups"
DATA_DIR="/app/data"
DATABASE_FILE="database.sqlite"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="asagents_backup_${TIMESTAMP}.sqlite"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[ERROR] $1" >&2
    exit 1
}

# Check if database exists
if [ ! -f "${DATA_DIR}/${DATABASE_FILE}" ]; then
    error "Database file not found: ${DATA_DIR}/${DATABASE_FILE}"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting backup of SQLite database..."

# Create backup using SQLite backup command
sqlite3 "${DATA_DIR}/${DATABASE_FILE}" ".backup ${BACKUP_DIR}/${BACKUP_NAME}"

if [ $? -eq 0 ]; then
    log "Database backup created: ${BACKUP_NAME}"
    
    # Create a symlink to the latest backup
    ln -sf "${BACKUP_NAME}" "${BACKUP_DIR}/latest.sqlite"
    
    # Compress the backup
    gzip "${BACKUP_DIR}/${BACKUP_NAME}"
    log "Backup compressed: ${BACKUP_NAME}.gz"
    
    # Update latest symlink to compressed file
    ln -sf "${BACKUP_NAME}.gz" "${BACKUP_DIR}/latest.sqlite.gz"
    
    # Backup uploads directory if it exists
    if [ -d "/app/uploads" ]; then
        log "Backing up uploads directory..."
        tar -czf "${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz" -C /app uploads/
        ln -sf "uploads_${TIMESTAMP}.tar.gz" "${BACKUP_DIR}/latest_uploads.tar.gz"
        log "Uploads backup created: uploads_${TIMESTAMP}.tar.gz"
    fi
    
    log "Backup completed successfully"
else
    error "Database backup failed"
fi

# Cleanup old backups
log "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "asagents_backup_*.sqlite.gz" -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

log "Backup process completed"
