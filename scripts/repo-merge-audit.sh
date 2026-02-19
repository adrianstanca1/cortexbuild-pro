#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

echo "=== Repo Merge Audit ==="
echo "Date: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo "Repo: $ROOT_DIR"
echo

echo "--- Branches / remotes ---"
remotes=$(git remote -v)
if [ -n "$remotes" ]; then
  echo "$remotes"
else
  echo "No remotes configured"
fi
git branch -a -vv

echo

echo "--- Working tree / stashes ---"
git status --short --branch
stashes=$(git stash list)
if [ -n "$stashes" ]; then
  echo "$stashes"
else
  echo "No stashes"
fi

echo

echo "--- Merged / unmerged branches (against HEAD) ---"
echo "Merged:"
git branch --merged --format='* %(refname:short)'
echo "Unmerged:"
git branch --no-merged --format='* %(refname:short)'

echo

echo "--- Duplicate tracked files (exact content hash) ---"
python - <<'PY'
import hashlib
import subprocess
from collections import defaultdict

files = subprocess.check_output(['git', 'ls-files'], text=True).splitlines()
ignore_prefixes = ('node_modules/', 'server/node_modules/', 'nextjs_space/node_modules/')
groups = defaultdict(list)

for path in files:
    if path.startswith(ignore_prefixes):
        continue
    with open(path, 'rb') as f:
        data = f.read()
    digest = hashlib.sha256(data).hexdigest()
    groups[(len(data), digest)].append(path)

duplicates = [paths for paths in groups.values() if len(paths) > 1]
if not duplicates:
    print('No duplicate tracked files found.')
else:
    for paths in sorted(duplicates, key=lambda p: (-len(p), p[0])):
        print(f'[{len(paths)} files]')
        for p in paths:
            print(' -', p)
PY
