# Merge and Delete Remote Branches - Usage Examples

## Quick Start Examples

### Example 1: Basic Usage (Most Common)

Merge all remote branches into cortexbuildpro and delete them:

```bash
cd /path/to/cortexbuild-pro
./merge-and-delete-branches.sh
```

**What happens:**
1. Shows list of branches to be processed
2. Asks for confirmation: `Do you want to proceed...? (yes/no):`
3. Merges each branch one by one
4. Pushes changes to remote
5. Asks for deletion confirmation
6. Deletes merged remote branches
7. Shows summary report

---

### Example 2: Test First (Recommended)

Always test with dry run before actual execution:

```bash
./merge-and-delete-branches.sh cortexbuildpro true
```

**What happens:**
1. Shows what WOULD be merged (no actual changes)
2. Lists all branches that would be processed
3. Shows "DRY RUN MODE" warnings
4. Reports what would happen without making changes
5. Safe to run multiple times

---

### Example 3: Custom Target Branch

Merge into a different branch (e.g., main):

```bash
./merge-and-delete-branches.sh main
```

**What happens:**
1. Switches to 'main' branch instead of cortexbuildpro
2. Merges all remote branches into main
3. Rest of process is the same

---

## Real-World Scenarios

### Scenario 1: Sprint Cleanup

**Situation:** You've completed a sprint with multiple feature branches that are all done and need to be consolidated.

**Steps:**
```bash
# 1. Review what branches exist
git branch -r

# 2. Test what would happen
./merge-and-delete-branches.sh cortexbuildpro true

# 3. Execute the merge and cleanup
./merge-and-delete-branches.sh cortexbuildpro

# 4. When prompted, review the list and type: yes

# 5. When asked about deletion, review and type: yes
```

**Expected Output:**
```
Found 8 remote branch(es) to process:
  - copilot/feature-a
  - copilot/feature-b
  ...

Do you want to proceed? (yes/no): yes

Processing: copilot/feature-a
✅ Successfully merged
...

📊 Summary
  ✅ Successfully merged: 8
  ✅ Deleted: 8
```

---

### Scenario 2: Handling Conflicts

**Situation:** One or more branches have merge conflicts.

**What happens:**
```bash
./merge-and-delete-branches.sh

# Script output:
Processing: copilot/problem-branch
❌ Failed to merge copilot/problem-branch
⚠️  Merge conflicts detected. Please resolve manually.
Continue with remaining branches? (yes/no):
```

**Your options:**
1. Type `yes` - Continue with other branches, handle this one manually later
2. Type `no` - Stop the script, fix conflicts first

**To fix manually after:**
```bash
git checkout cortexbuildpro
git merge origin/problem-branch
# Fix conflicts
git add .
git commit
git push origin cortexbuildpro
git push origin --delete problem-branch
```

---

### Scenario 3: Already Merged Branches

**Situation:** Some branches were merged through PRs, but still exist on remote.

**What happens:**
```bash
./merge-and-delete-branches.sh

# Script output:
Processing: copilot/already-merged
ℹ️  Branch 'copilot/already-merged' is already merged into cortexbuildpro
```

**Result:** Branch is skipped (no re-merge), but it will be offered for deletion at the end.

---

## Step-by-Step Interactive Session

Here's what a complete session looks like:

```bash
$ ./merge-and-delete-branches.sh
========================================
🔀 Merge and Delete Remote Branches
========================================

ℹ️  Current branch: main
ℹ️  Target branch for merges: cortexbuildpro

ℹ️  Fetching all remote branches...
✅ Remote branches fetched

ℹ️  Switching to target branch 'cortexbuildpro'...
✅ Switched to cortexbuildpro

ℹ️  Found 5 remote branch(es) to process:
  - copilot/feature-auth
  - copilot/feature-dashboard
  - copilot/bugfix-login
  - copilot/refactor-api
  - copilot/docs-update

Do you want to proceed with merging and deleting these branches? (yes/no): yes
[You type: yes]

========================================
Starting Merge Operations
========================================

Processing: copilot/feature-auth
----------------------------------------
ℹ️  Merging origin/copilot/feature-auth into cortexbuildpro...
✅ Successfully merged copilot/feature-auth

Processing: copilot/feature-dashboard
----------------------------------------
ℹ️  Merging origin/copilot/feature-dashboard into cortexbuildpro...
✅ Successfully merged copilot/feature-dashboard

Processing: copilot/bugfix-login
----------------------------------------
ℹ️  Branch 'copilot/bugfix-login' is already merged into cortexbuildpro

Processing: copilot/refactor-api
----------------------------------------
ℹ️  Merging origin/copilot/refactor-api into cortexbuildpro...
❌ Failed to merge copilot/refactor-api
⚠️  Merge conflicts detected. Please resolve manually.
Continue with remaining branches? (yes/no): yes
[You type: yes]

Processing: copilot/docs-update
----------------------------------------
ℹ️  Merging origin/copilot/docs-update into cortexbuildpro...
✅ Successfully merged copilot/docs-update

========================================
Pushing Merged Changes
========================================

ℹ️  Pushing merged changes to origin/cortexbuildpro...
✅ Successfully pushed merged changes

========================================
Deleting Remote Branches
========================================

ℹ️  The following branches were successfully merged and will be deleted:
  - copilot/feature-auth
  - copilot/feature-dashboard
  - copilot/docs-update

Proceed with deleting 3 remote branch(es)? (yes/no): yes
[You type: yes]

Deleting origin/copilot/feature-auth... ✅
Deleting origin/copilot/feature-dashboard... ✅
Deleting origin/copilot/docs-update... ✅

========================================
📊 Summary
========================================

Merge Results:
  ✅ Successfully merged: 3
  ℹ️  Already merged: 1
  ❌ Failed to merge: 1

Delete Results:
  ✅ Deleted: 3
  ❌ Failed to delete: 0

⚠️  Branches that failed to merge:
  - copilot/refactor-api

ℹ️  Remaining remote branches:
  - copilot/merge-and-delete-remote-branches (current)
  - copilot/refactor-api (needs manual merge)
  - cortexbuildpro

✅ Operation completed!
```

---

## Decision Tree

Use this to decide what to do:

```
Do you want to merge remote branches?
│
├─ YES, but want to test first
│  └─ Run: ./merge-and-delete-branches.sh cortexbuildpro true
│     └─ Review output, then run without "true" flag
│
├─ YES, merge into cortexbuildpro
│  └─ Run: ./merge-and-delete-branches.sh
│     ├─ Conflicts occur
│     │  ├─ Continue with others: Type "yes"
│     │  └─ Stop and fix: Type "no"
│     │
│     └─ Delete confirmation
│        ├─ Delete branches: Type "yes"
│        └─ Keep branches: Type "no"
│
├─ YES, but different target branch
│  └─ Run: ./merge-and-delete-branches.sh <branch-name>
│
└─ NO, just want to delete already-merged branches
   └─ Use: ./cleanup-branches.sh instead
```

---

## Common Questions

### Q: Can I undo a merge?
**A:** Yes, but carefully. Find the commit before merge: `git log --oneline`, then `git reset --soft <commit>`. Note: Force push is not available in some environments.

### Q: What if I accidentally delete a branch?
**A:** You can restore it if you have the commit SHA:
```bash
git push origin <commit-sha>:refs/heads/<branch-name>
```

### Q: Can I exclude certain branches from processing?
**A:** Currently, you need to modify the script to add filters. Or manually delete specific branches before running the script.

### Q: What's the difference from cleanup-branches.sh?
**A:** 
- `merge-and-delete-branches.sh`: Merges THEN deletes (complete workflow)
- `cleanup-branches.sh`: Only deletes (assumes already merged)

### Q: Is it safe to run multiple times?
**A:** Yes! The script:
- Skips already-merged branches automatically
- Won't re-merge the same content
- Won't fail if trying to delete non-existent branches

### Q: Can I use it in CI/CD?
**A:** With caution. You can auto-accept prompts: `yes | ./merge-and-delete-branches.sh`
But this is dangerous - use only in controlled environments.

---

## Tips & Tricks

### Tip 1: Review Before Deleting
- Always type "yes" for merge
- Review the summary
- Then decide on deletion

### Tip 2: Backup Important Branches
```bash
# Before running script, backup locally
git checkout -b backup/my-branch origin/my-branch
```

### Tip 3: Test Changes After Merge
```bash
./merge-and-delete-branches.sh
cd nextjs_space
npm install
npm run build
npm run dev
```

### Tip 4: Use with Git Aliases
```bash
# Add to .gitconfig
[alias]
  merge-all = !bash ./merge-and-delete-branches.sh
  merge-all-dry = !bash ./merge-and-delete-branches.sh cortexbuildpro true
```

### Tip 5: View Merge History
```bash
# After running script
git log --graph --oneline --all -20
```

---

## Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Permission denied | Check: `git remote -v` and GitHub permissions |
| Conflicts on every branch | May need manual review, check: `git log --graph` |
| Script stops immediately | Check current directory: `pwd` (must be in repo) |
| "Branch doesn't exist" | Run: `git fetch --all` first |
| Can't delete branch | Check GitHub branch protection rules |
| Lost changes | Check: `git reflog` for recent commits |

---

## Next Steps After Running

1. **Verify Merged Changes**
   ```bash
   git log --oneline -10
   ```

2. **Test the Application**
   ```bash
   npm run build
   npm run dev
   ```

3. **Update Documentation**
   - Document what was merged
   - Update CHANGELOG if you have one
   - Close related issues/PRs

4. **Clean Up Local Workspace**
   ```bash
   git fetch --prune origin
   git branch -d <local-branches-to-delete>
   ```

---

**For more details, see:** [MERGE_AND_DELETE_BRANCHES_GUIDE.md](MERGE_AND_DELETE_BRANCHES_GUIDE.md)
