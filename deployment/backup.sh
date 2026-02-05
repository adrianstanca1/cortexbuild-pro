#!/bin/bash

# ============================================
# CortexBuild Pro - Database Backup Script
# ============================================

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="cortexbuild_backup_$DATE.sql"

# Load env
export $(cat .env | grep -v '^#' | xargs)

mkdir -p $BACKUP_DIR

echo "Creating backup: $FILENAME"

docker compose exec -T postgres pg_dump \
    -U ${POSTGRES_USER:-cortexbuild} \
    -d ${POSTGRES_DB:-cortexbuild} \
    --clean \
    --if-exists \
    > $BACKUP_DIR/$FILENAME

# Compress
gzip $BACKUP_DIR/$FILENAME

echo "Backup created: $BACKUP_DIR/${FILENAME}.gz"

# Keep only last 7 backups
cd $BACKUP_DIR && ls -t *.gz 2>/dev/null | tail -n +8 | xargs -r rm --

echo "Old backups cleaned. Keeping last 7."
