#!/bin/bash

# Script to delete remote branches that have been merged into cortexbuildpro
# All branches listed below have been successfully merged and can be safely deleted

set -e

echo "This script will delete the following remote branches:"
echo "======================================================"
echo ""

branches=(
  "copilot/activate-agents-deploy"
  "copilot/build-and-debug-cortex-version"
  "copilot/clean-files-for-production"
  "copilot/clean-up-reduntant-files"
  "copilot/complete-build-features-deployment"
  "copilot/comprehensive-check-and-fix"
  "copilot/debug-and-deploy"
  "copilot/debug-api-and-backend"
  "copilot/debug-errors-and-clean-code"
  "copilot/fix-502-error-and-conflicts"
  "copilot/fix-code-conflicts-errors"
  "copilot/fix-errors-and-refactor-code"
  "copilot/implement-closed-session-changes"
  "copilot/implement-complete-platform-features"
  "copilot/merge-branches-and-cleanup"
  "copilot/rebuild-and-deploy-public-use"
  "copilot/refactor-duplicated-code"
  "copilot/refactor-duplicated-code-again"
  "copilot/review-and-merge-branches"
  "copilot/setup-api-keys-and-servers"
  "copilot/verify-commitments-errors"
  "revert-64-copilot/rebuild-and-deploy-public-use"
)

# Print all branches
for branch in "${branches[@]}"; do
  echo "  - $branch"
done

echo ""
echo "======================================================"
echo ""
read -p "Are you sure you want to delete these remote branches? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Deleting remote branches..."
echo ""

deleted=0
failed=0

for branch in "${branches[@]}"; do
  echo -n "Deleting $branch... "
  if git push origin --delete "$branch" 2>/dev/null; then
    echo "✓"
    ((deleted++))
  else
    echo "✗ (may already be deleted)"
    ((failed++))
  fi
done

echo ""
echo "======================================================"
echo "Summary:"
echo "  Successfully deleted: $deleted"
echo "  Failed/Already deleted: $failed"
echo "======================================================"
