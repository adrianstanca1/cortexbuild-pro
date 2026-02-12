#!/bin/bash
# Database Restore Script for CortexBuild Pro
# Restores the SQLite database from a backup file

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  CortexBuild Pro - Database Restore${NC}"
echo "========================================"

# Configuration
BACKUP_DIR="backups/database"
DB_PATH="buildpro_db.sqlite"

# Function to list available backups
list_backups() {
    echo "📋 Available backups:"
    echo ""
    ls -lht "${BACKUP_DIR}"/*.gz 2>/dev/null | nl -w2 -s'. ' || {
        echo -e "${RED}❌ No backups found in ${BACKUP_DIR}${NC}"
        exit 1
    }
}

# Check if backup directory exists
if [ ! -d "${BACKUP_DIR}" ]; then
    echo -e "${RED}❌ Error: Backup directory not found at ${BACKUP_DIR}${NC}"
    exit 1
fi

# List available backups
list_backups

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"

# If backup file is provided as argument
if [ -n "$1" ]; then
    BACKUP_FILE="$1"
else
    # Interactive selection
    echo ""
    read -p "Enter backup number to restore (or 'q' to quit): " SELECTION
    
    if [ "$SELECTION" = "q" ]; then
        echo "Restore cancelled."
        exit 0
    fi
    
    # Get the selected backup file
    BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/*.gz 2>/dev/null | sed -n "${SELECTION}p")
fi

# Validate backup file
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo ""
echo "📍 Selected backup: ${BACKUP_FILE}"

# Final confirmation
echo ""
read -p "Are you sure you want to restore this backup? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create a safety backup of current database
if [ -f "${DB_PATH}" ]; then
    SAFETY_BACKUP="${BACKUP_DIR}/safety_backup_$(date +%Y%m%d_%H%M%S).sqlite"
    echo ""
    echo "🔒 Creating safety backup of current database..."
    cp "${DB_PATH}" "${SAFETY_BACKUP}"
    echo -e "${GREEN}✅ Safety backup created: ${SAFETY_BACKUP}${NC}"
fi

# Decompress and restore
echo ""
echo "📦 Decompressing backup..."
TEMP_FILE=$(mktemp)
gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup decompressed successfully!${NC}"
    
    echo ""
    echo "🔄 Restoring database..."
    cp "${TEMP_FILE}" "${DB_PATH}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database restored successfully!${NC}"
        echo ""
        echo "📍 Restored from: ${BACKUP_FILE}"
        echo "📊 Database size: $(du -h "${DB_PATH}" | cut -f1)"
        
        # Cleanup temp file
        rm "${TEMP_FILE}"
        
        echo ""
        echo -e "${GREEN}🎉 Database restore completed successfully!${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  Please restart the server for changes to take effect.${NC}"
    else
        echo -e "${RED}❌ Error: Database restore failed!${NC}"
        rm "${TEMP_FILE}"
        exit 1
    fi
else
    echo -e "${RED}❌ Error: Failed to decompress backup!${NC}"
    rm "${TEMP_FILE}"
    exit 1
fi
