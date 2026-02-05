#!/bin/bash

# Merge and Delete Remote Branches Script
# Merges all remote branches into the target branch and deletes them after sync

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_BRANCH="${1:-cortexbuildpro}"
DRY_RUN="${2:-false}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔀 Merge and Delete Remote Branches${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Get the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Current branch: $CURRENT_BRANCH"
print_info "Target branch for merges: $TARGET_BRANCH"
echo ""

# Fetch all remote branches
print_info "Fetching all remote branches..."
git fetch --all --prune
print_success "Remote branches fetched"
echo ""

# Check if target branch exists
if ! git show-ref --verify --quiet refs/heads/$TARGET_BRANCH; then
    print_info "Target branch '$TARGET_BRANCH' doesn't exist locally. Fetching from remote..."
    if git show-ref --verify --quiet refs/remotes/origin/$TARGET_BRANCH; then
        git checkout -b $TARGET_BRANCH origin/$TARGET_BRANCH
        print_success "Target branch '$TARGET_BRANCH' created and checked out"
    else
        print_error "Target branch '$TARGET_BRANCH' doesn't exist on remote either"
        exit 1
    fi
else
    # Switch to target branch
    if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
        print_info "Switching to target branch '$TARGET_BRANCH'..."
        git checkout $TARGET_BRANCH
        print_success "Switched to $TARGET_BRANCH"
    fi
fi

# Pull latest changes from target branch
print_info "Updating target branch with latest changes..."
git pull origin $TARGET_BRANCH || print_warning "Could not pull from origin/$TARGET_BRANCH (might not exist on remote yet)"
echo ""

# Get list of remote branches (excluding HEAD and target branch)
print_info "Analyzing remote branches..."
REMOTE_BRANCHES=$(git branch -r | grep -v "HEAD" | grep -v "$TARGET_BRANCH" | sed 's/origin\///' | sed 's/^[[:space:]]*//')

if [ -z "$REMOTE_BRANCHES" ]; then
    print_info "No remote branches to merge"
    exit 0
fi

# Count branches
BRANCH_COUNT=$(echo "$REMOTE_BRANCHES" | wc -l)
echo ""
print_info "Found $BRANCH_COUNT remote branch(es) to process:"
echo "$REMOTE_BRANCHES" | while read branch; do
    echo "  - $branch"
done
echo ""

# Ask for confirmation
if [ "$DRY_RUN" = "true" ]; then
    print_warning "DRY RUN MODE - No changes will be made"
    echo ""
else
    read -p "Do you want to proceed with merging and deleting these branches? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        print_warning "Operation cancelled by user"
        exit 0
    fi
    echo ""
fi

# Statistics
MERGED_COUNT=0
ALREADY_MERGED_COUNT=0
FAILED_MERGE_COUNT=0
DELETED_COUNT=0
FAILED_DELETE_COUNT=0

# Array to store branches that were successfully merged
SUCCESSFULLY_MERGED=()
FAILED_TO_MERGE=()

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Merge Operations${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Process each branch
echo "$REMOTE_BRANCHES" | while read branch; do
    if [ -z "$branch" ]; then
        continue
    fi
    
    echo -e "${YELLOW}Processing: $branch${NC}"
    echo "----------------------------------------"
    
    # Check if branch exists on remote
    if ! git show-ref --verify --quiet refs/remotes/origin/$branch; then
        print_warning "Branch origin/$branch doesn't exist, skipping"
        echo ""
        continue
    fi
    
    # Check if already merged
    MERGE_BASE=$(git merge-base $TARGET_BRANCH origin/$branch 2>/dev/null || echo "")
    BRANCH_HEAD=$(git rev-parse origin/$branch 2>/dev/null || echo "")
    
    if [ -n "$MERGE_BASE" ] && [ -n "$BRANCH_HEAD" ] && [ "$MERGE_BASE" = "$BRANCH_HEAD" ]; then
        print_info "Branch '$branch' is already merged into $TARGET_BRANCH"
        echo "$branch" >> /tmp/already_merged.txt
        echo ""
        continue
    fi
    
    # Attempt merge
    if [ "$DRY_RUN" = "true" ]; then
        print_info "Would merge origin/$branch into $TARGET_BRANCH"
        echo "$branch" >> /tmp/dry_run_merge.txt
    else
        print_info "Merging origin/$branch into $TARGET_BRANCH..."
        
        if git merge origin/$branch --no-edit -m "Merge branch '$branch' into $TARGET_BRANCH"; then
            print_success "Successfully merged $branch"
            echo "$branch" >> /tmp/successfully_merged.txt
            
            # Commit the merge
            if ! git diff-index --quiet HEAD; then
                print_info "Committing merge..."
                git commit -m "Merge branch '$branch' into $TARGET_BRANCH" --allow-empty
                print_success "Merge committed"
            fi
        else
            print_error "Failed to merge $branch"
            print_warning "Merge conflicts detected. Please resolve manually."
            echo "$branch" >> /tmp/failed_merge.txt
            
            # Abort the merge
            git merge --abort 2>/dev/null || true
            
            # Ask user if they want to continue with other branches
            read -p "Continue with remaining branches? (yes/no): " CONTINUE
            if [ "$CONTINUE" != "yes" ]; then
                print_warning "Operation stopped by user"
                exit 1
            fi
        fi
    fi
    
    echo ""
done

# Read results from temporary files
MERGED_COUNT=0
ALREADY_MERGED_COUNT=0
FAILED_MERGE_COUNT=0

if [ -f /tmp/successfully_merged.txt ]; then
    MERGED_COUNT=$(wc -l < /tmp/successfully_merged.txt)
    mapfile -t SUCCESSFULLY_MERGED < /tmp/successfully_merged.txt
fi

if [ -f /tmp/already_merged.txt ]; then
    ALREADY_MERGED_COUNT=$(wc -l < /tmp/already_merged.txt)
fi

if [ -f /tmp/failed_merge.txt ]; then
    FAILED_MERGE_COUNT=$(wc -l < /tmp/failed_merge.txt)
    mapfile -t FAILED_TO_MERGE < /tmp/failed_merge.txt
fi

# Push merged changes to remote
if [ "$DRY_RUN" != "true" ] && [ $MERGED_COUNT -gt 0 ]; then
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Pushing Merged Changes${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    print_info "Pushing merged changes to origin/$TARGET_BRANCH..."
    if git push origin $TARGET_BRANCH; then
        print_success "Successfully pushed merged changes"
    else
        print_error "Failed to push changes to remote"
        print_warning "You may need to push manually: git push origin $TARGET_BRANCH"
    fi
    echo ""
fi

# Delete successfully merged remote branches
if [ ${#SUCCESSFULLY_MERGED[@]} -gt 0 ]; then
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Deleting Remote Branches${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    print_info "The following branches were successfully merged and will be deleted:"
    for branch in "${SUCCESSFULLY_MERGED[@]}"; do
        echo "  - $branch"
    done
    echo ""
    
    if [ "$DRY_RUN" = "true" ]; then
        print_warning "DRY RUN MODE - Would delete ${#SUCCESSFULLY_MERGED[@]} remote branch(es)"
    else
        read -p "Proceed with deleting ${#SUCCESSFULLY_MERGED[@]} remote branch(es)? (yes/no): " DELETE_CONFIRM
        
        if [ "$DELETE_CONFIRM" = "yes" ]; then
            for branch in "${SUCCESSFULLY_MERGED[@]}"; do
                echo -n "Deleting origin/$branch... "
                
                if git push origin --delete "$branch" 2>/dev/null; then
                    echo -e "${GREEN}✅${NC}"
                    ((DELETED_COUNT++))
                else
                    echo -e "${RED}❌${NC}"
                    ((FAILED_DELETE_COUNT++))
                fi
            done
            
            # Prune local references
            if [ $DELETED_COUNT -gt 0 ]; then
                print_info "Cleaning up local references..."
                git fetch --prune origin
                print_success "Local references cleaned up"
            fi
        else
            print_warning "Branch deletion cancelled by user"
        fi
    fi
    echo ""
fi

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Merge Results:"
echo "  ✅ Successfully merged: $MERGED_COUNT"
echo "  ℹ️  Already merged: $ALREADY_MERGED_COUNT"
echo "  ❌ Failed to merge: $FAILED_MERGE_COUNT"
echo ""
echo "Delete Results:"
echo "  ✅ Deleted: $DELETED_COUNT"
echo "  ❌ Failed to delete: $FAILED_DELETE_COUNT"
echo ""

# List failed merges
if [ ${#FAILED_TO_MERGE[@]} -gt 0 ]; then
    print_warning "Branches that failed to merge:"
    for branch in "${FAILED_TO_MERGE[@]}"; do
        echo "  - $branch"
    done
    echo ""
fi

# Show remaining remote branches
print_info "Remaining remote branches:"
git ls-remote --heads origin | awk '{print "  - " $2}' | sed 's|refs/heads/||'
echo ""

# Cleanup temporary files
rm -f /tmp/successfully_merged.txt /tmp/already_merged.txt /tmp/failed_merge.txt /tmp/dry_run_merge.txt

if [ "$DRY_RUN" = "true" ]; then
    print_success "Dry run completed!"
else
    print_success "Operation completed!"
fi

echo ""
print_info "Current branch: $(git rev-parse --abbrev-ref HEAD)"
print_info "Latest commit: $(git log -1 --oneline)"
