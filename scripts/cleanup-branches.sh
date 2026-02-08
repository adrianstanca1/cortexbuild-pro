#!/bin/bash

# Branch Cleanup Script
# Deletes remote branches that are fully merged into the default branch (cortexbuildpro).
#
# Usage:
#   ./scripts/cleanup-branches.sh              # Interactive mode (prompts before deleting)
#   ./scripts/cleanup-branches.sh --yes        # Non-interactive mode (deletes without prompting)
#   ./scripts/cleanup-branches.sh --dry-run    # Show what would be deleted without deleting

set -e

AUTO_CONFIRM=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --yes|-y) AUTO_CONFIRM=true ;;
    --dry-run|-n) DRY_RUN=true ;;
    --help|-h)
      echo "Usage: $0 [--yes|-y] [--dry-run|-n]"
      echo "  --yes, -y      Skip confirmation prompt"
      echo "  --dry-run, -n  Show what would be deleted without deleting"
      exit 0
      ;;
  esac
done

echo "🗑️  Branch Cleanup Script"
echo "=========================="
echo ""

# Determine the default branch
DEFAULT_BRANCH=""
for candidate in cortexbuildpro main master; do
  if git show-ref --verify --quiet "refs/remotes/origin/$candidate"; then
    DEFAULT_BRANCH=$candidate
    break
  fi
done

if [ -z "$DEFAULT_BRANCH" ]; then
  echo "❌ Unable to determine the default remote branch."
  exit 1
fi

echo "Using default branch: $DEFAULT_BRANCH"
echo ""

# Fetch latest state from remote
echo "🔄 Fetching latest remote state..."
git fetch --prune origin
echo ""

# Find branches that are fully merged into the default branch
MERGED_BRANCHES=$(git branch -r --merged "origin/$DEFAULT_BRANCH" \
  | sed 's|^[[:space:]]*origin/||' \
  | grep -v "^${DEFAULT_BRANCH}$" \
  | grep -v "^HEAD$" \
  || true)

if [ -z "$MERGED_BRANCHES" ]; then
  echo "✅ No merged branches found to delete."
  exit 0
fi

mapfile -t BRANCHES < <(printf '%s\n' "$MERGED_BRANCHES" | sed '/^[[:space:]]*$/d')
if [ ${#BRANCHES[@]} -eq 0 ]; then
  echo "✅ No merged branches found to delete."
  exit 0
fi

echo "📋 Branches fully merged into '${DEFAULT_BRANCH}' (${#BRANCHES[@]} total):"
echo ""
for branch in "${BRANCHES[@]}"; do
  echo "  - $branch"
done
echo ""

echo "ℹ️  These branches are fully integrated into '${DEFAULT_BRANCH}'."
echo "   All their changes are preserved in the git history."
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "🔍 Dry run — no branches were deleted."
  exit 0
fi

if [ "$AUTO_CONFIRM" != true ]; then
  read -r -p "Continue with deletion? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
  fi
fi

echo ""
echo "🚀 Starting deletion process..."
echo ""

DELETED=0
FAILED=0

for branch in "${BRANCHES[@]}"; do
  echo -n "Deleting $branch... "

  if git push origin --delete "$branch" 2>/dev/null; then
    echo "✅"
    ((DELETED++))
  else
    echo "❌ (may already be deleted or no permissions)"
    ((FAILED++))
  fi
done

echo ""
echo "=========================="
echo "📊 Summary:"
echo "  ✅ Deleted: $DELETED"
echo "  ❌ Failed: $FAILED"
echo "=========================="
echo ""

if [ $DELETED -gt 0 ]; then
  echo "🧹 Cleaning up local references..."
  git fetch --prune origin
  echo ""
fi

echo "📝 Remaining remote branches:"
git ls-remote --heads origin | awk '{print "  - " $2}' | sed 's|refs/heads/||'
echo ""

echo "✅ Cleanup complete!"
