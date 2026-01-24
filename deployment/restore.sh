#!/bin/bash

# ============================================
# CortexBuild Pro - Database Restore Script
# ============================================

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -la ./backups/*.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

echo "WARNING: This will overwrite all data in the database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Restoring from: $BACKUP_FILE"

# Decompress and restore
gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql \
    -U ${POSTGRES_USER:-cortexbuild} \
    -d ${POSTGRES_DB:-cortexbuild}

echo "Database restored successfully!"
