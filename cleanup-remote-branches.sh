#!/bin/bash
#
# Remote Branch Cleanup Script
# 
# This script deletes merged remote branches from the GitHub repository.
# Run this script ONLY after verifying that all changes have been merged into cortexbuildpro.
#
# Usage: ./cleanup-remote-branches.sh [--dry-run]
#

set -e

REPO_OWNER="adrianstanca1"
REPO_NAME="cortexbuild-pro"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Dry run flag
DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}DRY RUN MODE - No branches will be deleted${NC}"
fi

echo "=========================================="
echo "Remote Branch Cleanup Script"
echo "Repository: ${REPO_OWNER}/${REPO_NAME}"
echo "=========================================="
echo ""

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed or not available in PATH${NC}"
    echo "Please install Git before running this script: https://git-scm.com/downloads"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git is installed"
echo ""

# Resolve default branch and merged remote branches
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|^refs/remotes/origin/||')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-cortexbuildpro}

for candidate in "$DEFAULT_BRANCH" cortexbuildpro main master; do
    if [ -n "$candidate" ] && git show-ref --verify --quiet "refs/remotes/origin/$candidate"; then
        DEFAULT_BRANCH=$candidate
        break
    fi
done

if ! git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH"; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ -n "$CURRENT_BRANCH" ] && git show-ref --verify --quiet "refs/remotes/origin/$CURRENT_BRANCH"; then
        DEFAULT_BRANCH=$CURRENT_BRANCH
    else
        echo -e "${RED}Unable to determine a default remote branch.${NC}"
        exit 1
    fi
fi

MERGED_BRANCHES=$(git branch -r --merged "origin/$DEFAULT_BRANCH" | sed 's|^[[:space:]]*origin/||' | grep -v "^${DEFAULT_BRANCH}$" | grep -v "^HEAD$" || true)

if [ -z "$MERGED_BRANCHES" ]; then
    echo -e "${GREEN}No merged branches found to delete.${NC}"
    exit 0
fi

mapfile -t BRANCHES_TO_DELETE <<< "$MERGED_BRANCHES"

# List branches to be deleted
echo "The following ${#BRANCHES_TO_DELETE[@]} branches will be deleted:"
echo ""
for branch in "${BRANCHES_TO_DELETE[@]}"; do
    echo "  - ${branch}"
done
echo ""

# Confirm deletion
if [ "$DRY_RUN" == false ]; then
    echo -e "${YELLOW}WARNING: This will permanently delete these remote branches!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi
fi

# Delete branches
DELETED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

for branch in "${BRANCHES_TO_DELETE[@]}"; do
    # Check if branch exists
    if ! git ls-remote --heads origin "$branch" | grep -q "$branch"; then
        echo -e "${YELLOW}⊘${NC} Branch already deleted: ${branch}"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi
    
    if [ "$DRY_RUN" == true ]; then
        echo -e "${GREEN}[DRY RUN]${NC} Would delete: ${branch}"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    else
        # Delete the branch
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
echo "=========================================="
echo "Summary:"
echo "=========================================="
if [ "$DRY_RUN" == true ]; then
    echo "Branches that would be deleted: ${DELETED_COUNT}"
else
    echo "Branches deleted: ${DELETED_COUNT}"
    echo "Branches failed: ${FAILED_COUNT}"
fi
echo "Branches skipped (already deleted): ${SKIPPED_COUNT}"
echo "=========================================="

# Clean up local tracking branches
if [ "$DRY_RUN" == false ] && [ $DELETED_COUNT -gt 0 ]; then
    echo ""
    echo "Cleaning up local tracking branches..."
    git fetch --prune
    echo -e "${GREEN}✓${NC} Local tracking branches updated"
fi

echo ""
if [ "$DRY_RUN" == true ]; then
    echo -e "${YELLOW}This was a dry run. No changes were made.${NC}"
    echo "Run without --dry-run flag to actually delete branches."
else
    echo -e "${GREEN}Remote branch cleanup completed!${NC}"
fi
