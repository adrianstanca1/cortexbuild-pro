#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SKIP_BUILD=false
STRICT=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=true; shift ;;
    --strict) STRICT=true; shift ;;
    --help|-h)
      cat <<USAGE
Usage: $(basename "$0") [--skip-build] [--strict]

Options:
  --skip-build   Skip optional frontend build check
  --strict       Treat warnings as failures (exit non-zero)
USAGE
      exit 0
      ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

warn_count=0
fail_count=0

warn() {
  echo "WARN: $*"
  warn_count=$((warn_count + 1))
}

fail() {
  echo "FAIL: $*"
  fail_count=$((fail_count + 1))
}

echo "# CortexBuild Pro Repository Audit"
echo "Generated: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo

echo "## Git summary"
echo "- Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "- HEAD: $(git rev-parse HEAD)"
if upstream_ref=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null); then
  ahead_behind=$(git rev-list --left-right --count "${upstream_ref}...HEAD")
  behind_count=$(awk '{print $1}' <<<"$ahead_behind")
  ahead_count=$(awk '{print $2}' <<<"$ahead_behind")
  echo "- Upstream: ${upstream_ref} (ahead ${ahead_count}, behind ${behind_count})"
else
  warn "No upstream tracking branch configured for current branch"
fi
echo

if [[ -z "$(git status --porcelain)" ]]; then
  echo "- Working tree: clean"
else
  warn "Working tree has uncommitted changes"
  git status --short
fi

echo
echo "## Recent changes (last 10 commits)"
git log --name-status --pretty=format:'commit %h %s (%cr)' -n 10

echo
echo "## Branch merge readiness"
while IFS= read -r branch; do
  [[ -z "$branch" ]] && continue
  if [[ "$branch" == "$(git rev-parse --abbrev-ref HEAD)" ]]; then
    continue
  fi
  if ! git merge-base --is-ancestor "$branch" HEAD; then
    warn "Branch '$branch' has commits not merged into current branch"
  fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads)

echo
echo "## Deployment files"
for f in \
  deployment/docker-compose.yml \
  deployment/docker-compose.prod.yml \
  deployment/docker-stack.yml \
  deployment/Dockerfile \
  deployment/deploy-to-vps.sh \
  deployment/deploy-from-github.sh; do
  [[ -f "$f" ]] && echo "- OK: $f" || fail "Missing file: $f"
done

echo
echo "## Tooling availability"
command -v node >/dev/null 2>&1 && echo "- node: $(node -v)" || fail "node not available"
command -v npm >/dev/null 2>&1 && echo "- npm: $(npm -v)" || fail "npm not available"
command -v docker >/dev/null 2>&1 && echo "- docker: $(docker --version | head -1)" || warn "docker not available in this environment"
command -v ssh >/dev/null 2>&1 && echo "- ssh: available" || warn "ssh client not available"

echo
echo "## Domain references"
rg -n "cortexbuildpro.com|www.cortexbuildpro.com" deployment docs README.md CNAME || true

echo
echo "## Optional validations"
if [[ "$SKIP_BUILD" == true ]]; then
  echo "- build:frontend: SKIPPED (--skip-build)"
elif command -v npm >/dev/null 2>&1; then
  if [[ ! -x node_modules/.bin/vite ]]; then
    warn "vite binary missing. Run 'npm install' before build validation."
  fi
  if npm run -s build:frontend >/tmp/cortexbuild-frontend-build.log 2>&1; then
    echo "- build:frontend: PASS"
  else
    fail "build:frontend: failed (see /tmp/cortexbuild-frontend-build.log)"
  fi
fi

if command -v docker >/dev/null 2>&1; then
  if POSTGRES_PASSWORD=test NEXTAUTH_SECRET=test ENCRYPTION_KEY=0123456789abcdef0123456789abcdef \
    docker compose -f deployment/docker-compose.yml config >/tmp/cortexbuild-docker-config.log 2>&1; then
    echo "- docker compose config: PASS"
  else
    fail "docker compose config: failed (see /tmp/cortexbuild-docker-config.log)"
  fi
else
  warn "docker compose config skipped (docker unavailable)"
fi

echo
echo "## Audit result"
echo "- warnings: $warn_count"
echo "- failures: $fail_count"

if [[ "$STRICT" == true && $warn_count -gt 0 ]]; then
  echo "Strict mode enabled: warnings are treated as failures"
  exit 1
fi

if [[ $fail_count -gt 0 ]]; then
  exit 1
fi
