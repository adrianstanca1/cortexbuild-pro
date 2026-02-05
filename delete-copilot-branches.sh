#!/bin/bash
#
# Delete Copilot Remote Branches Script
# 
# This script deletes outdated copilot branches from the GitHub repository.
# These branches have been analyzed and confirmed to contain no unique features
# that are not already present in the main branch (cortexbuildpro).
#
# Usage: ./delete-copilot-branches.sh [--dry-run]
#

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Dry run flag
DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}DRY RUN MODE - No branches will be deleted${NC}"
    echo ""
fi

echo -e "${CYAN}=========================================="
echo "Delete Copilot Remote Branches"
echo "Repository: adrianstanca1/cortexbuild-pro"
echo "==========================================${NC}"
echo ""

# List of copilot branches to delete (excluding current PR branch)
COPILOT_BRANCHES=(
    "copilot/commit-all-changes"
    "copilot/continue-existing-feature"
    "copilot/continue-task-implementation"
    "copilot/fix-all-errors-and-conflicts"
    "copilot/fix-app-branches-errors"
    "copilot/merge-and-integrate-changes"
    "copilot/merge-branches-and-cleanup"
)

# Check current branch to avoid deleting it
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${GREEN}Current branch:${NC} ${CURRENT_BRANCH}"
echo ""

# Fetch latest branch info
echo "Fetching latest branch information..."
git fetch --prune origin
echo ""

# List branches that will be deleted
echo -e "${YELLOW}Branches to be deleted:${NC}"
BRANCHES_TO_DELETE=()
for branch in "${COPILOT_BRANCHES[@]}"; do
    # Skip if this is the current branch
    if [[ "$branch" == "$CURRENT_BRANCH" ]] || [[ "origin/$branch" == "origin/$CURRENT_BRANCH" ]]; then
        echo -e "  ${YELLOW}⊘${NC} ${branch} (skipped - current branch)"
        continue
    fi
    
    # Check if branch exists on remote
    if git ls-remote --heads origin "$branch" | grep -q "$branch"; then
        echo -e "  ${RED}✗${NC} ${branch}"
        BRANCHES_TO_DELETE+=("$branch")
    else
        echo -e "  ${GREEN}✓${NC} ${branch} (already deleted)"
    fi
done
echo ""

# Check if there are branches to delete
if [ ${#BRANCHES_TO_DELETE[@]} -eq 0 ]; then
    echo -e "${GREEN}No copilot branches need to be deleted!${NC}"
    exit 0
fi

# Confirm deletion
if [ "$DRY_RUN" == false ]; then
    echo -e "${YELLOW}WARNING: This will permanently delete ${#BRANCHES_TO_DELETE[@]} remote branches!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi
fi

# Delete branches
echo "Deleting branches..."
DELETED_COUNT=0
FAILED_COUNT=0

for branch in "${BRANCHES_TO_DELETE[@]}"; do
    if [ "$DRY_RUN" == true ]; then
        echo -e "${GREEN}[DRY RUN]${NC} Would delete: ${branch}"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    else
        if git push origin --delete "$branch" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Deleted: ${branch}"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        else
            echo -e "${RED}✗${NC} Failed to delete: ${branch}"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    fi
done

echo ""
echo -e "${CYAN}=========================================="
echo "Summary"
echo "==========================================${NC}"
if [ "$DRY_RUN" == true ]; then
    echo "Branches that would be deleted: ${DELETED_COUNT}"
else
    echo "Branches deleted: ${DELETED_COUNT}"
    echo "Branches failed: ${FAILED_COUNT}"
fi
echo ""

# Clean up local tracking branches
if [ "$DRY_RUN" == false ] && [ $DELETED_COUNT -gt 0 ]; then
    echo "Cleaning up local tracking branches..."
    git fetch --prune
    echo -e "${GREEN}✓${NC} Local tracking branches updated"
fi

echo ""
if [ "$DRY_RUN" == true ]; then
    echo -e "${YELLOW}This was a dry run. No changes were made.${NC}"
    echo "Run without --dry-run flag to actually delete branches."
else
    echo -e "${GREEN}Copilot branch cleanup completed!${NC}"
fi
