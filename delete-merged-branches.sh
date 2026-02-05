#!/bin/bash

# Script to delete all merged branches after merge completion
# This script should be run by a user with push access to the repository

set -e

echo "=============================================="
echo "Branch Deletion Script"
echo "=============================================="
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|^refs/remotes/origin/||')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-cortexbuildpro}

if ! git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH"; then
    DEFAULT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

if ! git show-ref --verify --quiet "refs/remotes/origin/$DEFAULT_BRANCH"; then
    DEFAULT_BRANCH=$(git branch -r | sed 's|^[[:space:]]*origin/||' | head -n 1)
fi

if [ -z "$DEFAULT_BRANCH" ]; then
    echo "No remote branches found to evaluate."
    exit 0
fi

MERGED_BRANCHES=$(git branch -r --merged "origin/$DEFAULT_BRANCH" | sed 's|^[[:space:]]*origin/||' | grep -v "^${DEFAULT_BRANCH}$" | grep -v "^HEAD$" || true)

if [ -z "$MERGED_BRANCHES" ]; then
    echo "No merged remote branches found to delete."
    exit 0
fi

mapfile -t BRANCHES <<< "$MERGED_BRANCHES"

echo "This script will delete the following ${#BRANCHES[@]} merged branches from origin/${DEFAULT_BRANCH}:"
for branch in "${BRANCHES[@]}"; do
    echo "  - $branch"
done
echo ""
echo "WARNING: This action cannot be undone!"
echo ""

# Ask for confirmation
read -r -p "Are you sure you want to delete these branches? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

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
