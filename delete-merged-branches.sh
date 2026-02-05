#!/bin/bash

# Script to delete all merged branches after merge completion
# This script should be run by a user with push access to the repository

set -e

echo "=============================================="
echo "Branch Deletion Script"
echo "=============================================="
echo "This script will delete the following 11 branches:"
echo "  1. copilot/commit-all-changes"
echo "  2. copilot/continue-existing-feature"
echo "  3. copilot/continue-task-implementation"
echo "  4. copilot/deploy-to-vps"
echo "  5. copilot/fix-all-errors-and-conflicts"
echo "  6. copilot/fix-eslint-project-directory"
echo "  7. copilot/merge-and-integrate-changes"
echo "  8. copilot/merge-branches-and-cleanup"
echo "  9. copilot/merge-changes-into-main"
echo "  10. copilot/remove-unused-imports-variables"
echo "  11. copilot/sync-and-merge-branches"
echo ""
echo "WARNING: This action cannot be undone!"
echo ""

# Ask for confirmation
read -p "Are you sure you want to delete these branches? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

# Branches to delete
BRANCHES=(
    "copilot/commit-all-changes"
    "copilot/continue-existing-feature"
    "copilot/continue-task-implementation"
    "copilot/deploy-to-vps"
    "copilot/fix-all-errors-and-conflicts"
    "copilot/fix-eslint-project-directory"
    "copilot/merge-and-integrate-changes"
    "copilot/merge-branches-and-cleanup"
    "copilot/merge-changes-into-main"
    "copilot/remove-unused-imports-variables"
    "copilot/sync-and-merge-branches"
)

DELETED_COUNT=0
FAILED_COUNT=0
FAILED_BRANCHES=()

echo ""
echo "Starting branch deletion..."
echo ""

for branch in "${BRANCHES[@]}"; do
    echo "----------------------------------------"
    echo "Deleting: $branch"
    
    # Try to delete from remote
    if git push origin --delete "$branch" 2>&1; then
        echo "✓ Successfully deleted from remote"
        DELETED_COUNT=$((DELETED_COUNT + 1))
        
        # Also delete local branch if it exists
        if git show-ref --verify --quiet "refs/heads/$branch"; then
            git branch -D "$branch" 2>/dev/null && echo "  (also deleted local branch)"
        fi
    else
        echo "✗ Failed to delete"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_BRANCHES+=("$branch")
    fi
    echo ""
done

echo "=============================================="
echo "DELETION SUMMARY"
echo "=============================================="
echo "Successfully deleted: $DELETED_COUNT branches"
echo "Failed to delete: $FAILED_COUNT branches"

if [ ${#FAILED_BRANCHES[@]} -gt 0 ]; then
    echo ""
    echo "Failed branches:"
    for branch in "${FAILED_BRANCHES[@]}"; do
        echo "  - $branch"
    done
    echo ""
    echo "You can try deleting these manually via:"
    echo "  - GitHub web interface (Settings > Branches)"
    echo "  - GitHub CLI: gh api -X DELETE /repos/adrianstanca1/cortexbuild-pro/git/refs/heads/<branch>"
else
    echo ""
    echo "✅ All branches successfully deleted!"
fi

echo ""
echo "Script completed."
