#!/bin/bash
# Database Backup Script for CortexBuild Pro
# Creates a timestamped backup of the SQLite database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  CortexBuild Pro - Database Backup${NC}"
echo "========================================"

# Configuration
BACKUP_DIR="backups/database"
DB_PATH="buildpro_db.sqlite"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sqlite"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}❌ Error: Database file not found at ${DB_PATH}${NC}"
    exit 1
fi

# Create backup
echo "📦 Creating backup..."
cp "${DB_PATH}" "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo ""
    echo "📍 Backup location: ${BACKUP_FILE}"
    
    # Get file size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "📊 Backup size: ${BACKUP_SIZE}"
    
    # Compress backup
    echo ""
    echo "🗜️  Compressing backup..."
    gzip "${BACKUP_FILE}"
    
    if [ $? -eq 0 ]; then
        COMPRESSED_FILE="${BACKUP_FILE}.gz"
        COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
        echo -e "${GREEN}✅ Backup compressed successfully!${NC}"
        echo "📍 Compressed file: ${COMPRESSED_FILE}"
        echo "📊 Compressed size: ${COMPRESSED_SIZE}"
    fi
    
    # List recent backups
    echo ""
    echo "📋 Recent backups:"
    ls -lht "${BACKUP_DIR}" | head -n 6
    
    # Cleanup old backups (keep last 10)
    echo ""
    echo "🧹 Cleaning up old backups (keeping last 10)..."
    ls -t "${BACKUP_DIR}"/*.gz 2>/dev/null | tail -n +11 | xargs -r rm
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
    
else
    echo -e "${RED}❌ Error: Backup failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database backup completed successfully!${NC}"
