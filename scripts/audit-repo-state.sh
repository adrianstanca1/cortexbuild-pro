#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "# CortexBuild Pro Repository Audit"
echo "Generated: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo

echo "## Branch & HEAD"
echo "- Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "- HEAD: $(git rev-parse HEAD)"
echo

echo "## Working tree status"
if [[ -z "$(git status --porcelain)" ]]; then
  echo "- Clean: no uncommitted changes"
else
  echo "- Uncommitted changes detected:"
  git status --short
fi
echo

echo "## Changed files in last 10 commits"
git log --name-status --pretty=format:'commit %h %s (%cr)' -n 10
echo

echo "## Diffstat (last commit)"
git diff --stat HEAD~1..HEAD || true
echo

echo "## Docker deployment manifests"
for f in deployment/docker-compose.yml deployment/docker-compose.prod.yml deployment/docker-stack.yml deployment/Dockerfile; do
  if [[ -f "$f" ]]; then
    echo "- OK: $f"
  else
    echo "- MISSING: $f"
  fi
done
echo

echo "## Domain references"
rg -n "cortexbuildpro.com|www.cortexbuildpro.com" deployment docs README.md CNAME || true
