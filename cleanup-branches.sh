#!/bin/bash

# Branch Cleanup Script
# Deletes synchronized branches after successful merge to cortexbuildpro

set -e

echo "🗑️  Branch Cleanup Script"
echo "=========================="
echo ""

# List of branches to delete
BRANCHES=(
  "copilot/merge-and-clean-cortexbuild"
  "copilot/fix-api-connections-and-dependencies"
  "copilot/merge-and-integrate-changes"
  "copilot/merge-changes-into-main"
  "copilot/continue-task-implementation"
  "copilot/continue-existing-feature"
  "copilot/fix-all-errors-and-conflicts"
  "copilot/fix-conflicts-and-commit-changes"
  "copilot/continue-build-and-debug-session"
  "copilot/commit-all-changes"
  "copilot/merge-branches-and-cleanup"
)

echo "📋 Branches marked for deletion (11 total):"
echo ""
for branch in "${BRANCHES[@]}"; do
  echo "  - $branch"
done
echo ""

echo "ℹ️  These branches have been synchronized into cortexbuildpro."
echo "   Their changes are preserved in the git history."
echo ""

read -p "Continue with deletion? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cleanup cancelled."
  exit 0
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
