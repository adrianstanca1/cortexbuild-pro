#!/bin/bash
# Auto-generated sync script — run from inside cortexbuild_pro folder
# Usage: bash push-sync.sh
# Or with a token: GH_TOKEN=ghp_xxx bash push-sync.sh

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

# Optionally inject token
if [ -n "$GH_TOKEN" ]; then
  git remote set-url origin "https://$GH_TOKEN@github.com/adrianstanca1/cortexbuild-pro.git"
fi

echo "=== Pushing all synced branches to GitHub ==="
echo ""
echo "Pushing Cortexbuildpro (main dev branch)..."
git push origin Cortexbuildpro

echo "Pushing main..."
git push origin main --force-with-lease

echo "Pushing dashboard-enhancements-fix..."
git push origin dashboard-enhancements-fix --force-with-lease

echo "Pushing sync-work..."
git push origin sync-work --force-with-lease

echo ""
echo "=== All branches pushed! ==="
echo "Merge commit: 82e4cb98"
echo "Branches now all at: merge: sync Cortexbuildpro with origin/cortexbuildpro"
