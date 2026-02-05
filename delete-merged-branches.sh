#!/bin/bash

# Script to delete all merged branches after merge completion
# This script should be run by a user with push access to the repository

set -e

echo "=============================================="
echo "Branch Deletion Script"
echo "=============================================="
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
        if [ "$CURRENT_BRANCH" != "cortexbuildpro" ] && [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
            echo "⚠️  Warning: '${CURRENT_BRANCH}' is not a standard default branch."
            read -r -p "Use '${CURRENT_BRANCH}' as the default branch? (yes/no): " USE_CURRENT
            if [ "$USE_CURRENT" != "yes" ]; then
                echo "Unable to determine a safe default remote branch."
                exit 1
            fi
        else
            echo "⚠️  Using current branch '${CURRENT_BRANCH}' as default."
        fi
        DEFAULT_BRANCH=$CURRENT_BRANCH
    else
        echo "Unable to determine a default remote branch."
        exit 1
    fi
fi

echo "Using default branch: $DEFAULT_BRANCH"

MERGED_BRANCHES=$(git branch -r --merged "origin/$DEFAULT_BRANCH" | sed 's|^[[:space:]]*origin/||' | grep -v "^${DEFAULT_BRANCH}$" | grep -v "^HEAD$" || true)

if [ -z "$MERGED_BRANCHES" ]; then
    echo "No merged remote branches found to delete."
    exit 0
fi

mapfile -t BRANCHES < <(printf '%s\n' "$MERGED_BRANCHES" | sed '/^[[:space:]]*$/d')
if [ ${#BRANCHES[@]} -eq 0 ]; then
    echo "No valid merged remote branches found to delete."
    exit 0
fi

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
