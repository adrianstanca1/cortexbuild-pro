#!/bin/bash

# Branch Cleanup Script
# Deletes synchronized branches after successful merge to cortexbuildpro

set -e

echo "🗑️  Branch Cleanup Script"
echo "=========================="
echo ""

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
        echo "❌ Unable to determine a safe default remote branch."
        exit 1
      fi
    else
      echo "⚠️  Using current branch '${CURRENT_BRANCH}' as default."
    fi
    DEFAULT_BRANCH=$CURRENT_BRANCH
  else
    echo "❌ Unable to determine a default remote branch."
    exit 1
  fi
fi

echo "Using default branch: $DEFAULT_BRANCH"

MERGED_BRANCHES=$(git branch -r --merged "origin/$DEFAULT_BRANCH" | sed 's|^[[:space:]]*origin/||' | grep -v "^${DEFAULT_BRANCH}$" | grep -v "^HEAD$" || true)

if [ -z "$MERGED_BRANCHES" ]; then
  echo "✅ No merged branches found to delete."
  exit 0
fi

mapfile -t BRANCHES < <(printf '%s\n' "$MERGED_BRANCHES" | sed '/^[[:space:]]*$/d')
if [ ${#BRANCHES[@]} -eq 0 ]; then
  echo "✅ No merged branches found to delete."
  exit 0
fi

echo "📋 Branches marked for deletion (${#BRANCHES[@]} total):"
echo ""
for branch in "${BRANCHES[@]}"; do
  echo "  - $branch"
done
echo ""

echo "ℹ️  These branches have been synchronized into ${DEFAULT_BRANCH}."
echo "   Their changes are preserved in the git history."
echo ""

read -r -p "Continue with deletion? (yes/no): " confirm

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
