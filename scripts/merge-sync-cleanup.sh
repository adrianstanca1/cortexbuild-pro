#!/usr/bin/env bash
set -euo pipefail

# Merge/sync/cleanup helper.
# - Commits uncommitted changes (optional message via COMMIT_MESSAGE)
# - Merges all local branches into the current branch
# - Deletes merged local branches
# - Syncs to origin (if configured) and deletes merged remote branches

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Not inside a git repository"
  exit 1
fi

TARGET_BRANCH="${TARGET_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-chore: save pending changes before merge/sync/cleanup}"
DO_PUSH="${DO_PUSH:-1}"

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" != "$TARGET_BRANCH" ]]; then
  git checkout "$TARGET_BRANCH"
fi

echo "==> Target branch: $TARGET_BRANCH"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "==> Found uncommitted changes; creating a checkpoint commit"
  git add -A
  git commit -m "$COMMIT_MESSAGE"
else
  echo "==> No uncommitted changes"
fi

mapfile -t local_branches < <(git for-each-ref --format='%(refname:short)' refs/heads | grep -v "^${TARGET_BRANCH}$" || true)

if [[ ${#local_branches[@]} -eq 0 ]]; then
  echo "==> No additional local branches to merge"
else
  for b in "${local_branches[@]}"; do
    echo "==> Merging branch: $b"
    git merge --no-ff "$b" -m "Merge branch '$b' into $TARGET_BRANCH"
  done

  echo "==> Deleting merged local branches"
  for b in "${local_branches[@]}"; do
    git branch -d "$b" || true
  done
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "==> origin detected"
  if [[ "$DO_PUSH" == "1" ]]; then
    echo "==> Pushing $TARGET_BRANCH to origin"
    git push origin "$TARGET_BRANCH"
  fi

  mapfile -t merged_remote < <(git branch -r --merged "$TARGET_BRANCH" | sed 's/^ *//' | grep '^origin/' | grep -v "origin/${TARGET_BRANCH}$" | grep -v 'origin/HEAD' || true)
  if [[ ${#merged_remote[@]} -gt 0 && "$DO_PUSH" == "1" ]]; then
    echo "==> Deleting merged remote branches"
    for rb in "${merged_remote[@]}"; do
      short="${rb#origin/}"
      git push origin --delete "$short" || true
    done
  else
    echo "==> No merged remote branches to delete (or push disabled)"
  fi
else
  echo "⚠️ No origin remote configured; skipped remote sync/deletion"
fi

echo "✅ Merge/sync/cleanup complete"
