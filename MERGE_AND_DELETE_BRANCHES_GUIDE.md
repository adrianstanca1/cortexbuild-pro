# Merge and Delete Remote Branches Guide

**Date:** February 5, 2026  
**Purpose:** Automate merging all remote branches and deleting them after successful sync  
**Status:** Ready for use

---

## Overview

The `merge-and-delete-branches.sh` script provides an automated workflow for:
1. Fetching all remote branches from origin
2. Merging each branch into a target branch (default: `cortexbuildpro`)
3. Committing the merged changes
4. Pushing changes to the remote repository
5. Deleting remote branches after successful merge and sync
6. Providing detailed logging and error handling

---

## Features

### 🔒 Safety Features
- **Confirmation prompts** before merging and deleting branches
- **Dry run mode** to preview operations without making changes
- **Automatic detection** of already-merged branches (skips redundant merges)
- **Conflict handling** with user prompts to continue or abort
- **Merge abort** on conflicts to maintain repository stability
- **Detailed logging** of all operations

### 📊 Smart Operations
- Automatically identifies all remote branches (excluding target and HEAD)
- Checks merge status before attempting merge
- Commits each successful merge
- Only deletes branches that were successfully merged
- Provides comprehensive summary statistics
- Cleans up local references after deletion

### 🎯 User Control
- Specify custom target branch
- Enable dry run mode for testing
- Interactive confirmations at critical steps
- Option to continue or stop on merge conflicts
- Separate confirmation for branch deletion

---

## Usage

### Basic Usage

Merge all remote branches into `cortexbuildpro` and delete them:

```bash
cd /path/to/cortexbuild-pro
./merge-and-delete-branches.sh
```

### Specify Target Branch

Merge into a different branch:

```bash
./merge-and-delete-branches.sh main
```

### Dry Run Mode

Preview operations without making any changes:

```bash
./merge-and-delete-branches.sh cortexbuildpro true
```

---

## Script Workflow

### Phase 1: Preparation
1. Validates git repository
2. Identifies current branch
3. Fetches all remote branches
4. Creates or checks out target branch
5. Updates target branch from remote

### Phase 2: Analysis
1. Lists all remote branches (excluding target)
2. Displays branches to be processed
3. Requests user confirmation

### Phase 3: Merge Operations
For each remote branch:
1. Checks if branch exists on remote
2. Checks if already merged (skips if yes)
3. Attempts to merge into target branch
4. Commits successful merges
5. Handles conflicts with user prompts

### Phase 4: Sync
1. Pushes all merged changes to remote
2. Verifies push success

### Phase 5: Cleanup
1. Lists successfully merged branches
2. Requests confirmation for deletion
3. Deletes remote branches
4. Prunes local references
5. Displays final summary

---

## Example Output

```
========================================
🔀 Merge and Delete Remote Branches
========================================

ℹ️  Current branch: cortexbuildpro
ℹ️  Target branch for merges: cortexbuildpro

ℹ️  Fetching all remote branches...
✅ Remote branches fetched

ℹ️  Found 9 remote branch(es) to process:
  - copilot/commit-all-changes
  - copilot/continue-existing-feature
  - copilot/continue-task-implementation
  - copilot/fix-all-errors-and-conflicts
  - copilot/merge-and-integrate-changes
  - copilot/merge-branches-and-cleanup
  - copilot/merge-changes-into-main
  - copilot/refactor-duplicated-code

Do you want to proceed with merging and deleting these branches? (yes/no): yes

========================================
Starting Merge Operations
========================================

Processing: copilot/commit-all-changes
----------------------------------------
ℹ️  Merging origin/copilot/commit-all-changes into cortexbuildpro...
✅ Successfully merged copilot/commit-all-changes
ℹ️  Committing merge...
✅ Merge committed

...

========================================
Pushing Merged Changes
========================================

ℹ️  Pushing merged changes to origin/cortexbuildpro...
✅ Successfully pushed merged changes

========================================
Deleting Remote Branches
========================================

ℹ️  The following branches were successfully merged and will be deleted:
  - copilot/commit-all-changes
  - copilot/continue-existing-feature
  ...

Proceed with deleting 8 remote branch(es)? (yes/no): yes

Deleting origin/copilot/commit-all-changes... ✅
Deleting origin/copilot/continue-existing-feature... ✅
...

========================================
📊 Summary
========================================

Merge Results:
  ✅ Successfully merged: 8
  ℹ️  Already merged: 1
  ❌ Failed to merge: 0

Delete Results:
  ✅ Deleted: 8
  ❌ Failed to delete: 0

✅ Operation completed!
```

---

## Use Cases

### 1. Regular Branch Cleanup

After completing a sprint or release, consolidate all feature branches:

```bash
./merge-and-delete-branches.sh cortexbuildpro
```

### 2. Testing Merge Strategy

Preview what would happen without making changes:

```bash
./merge-and-delete-branches.sh cortexbuildpro true
```

### 3. Merge Into Custom Branch

Merge branches into a specific integration branch:

```bash
./merge-and-delete-branches.sh integration
```

---

## Handling Merge Conflicts

When merge conflicts occur:

1. **Script detects conflict** and displays error message
2. **Merge is automatically aborted** to maintain stability
3. **User is prompted** to continue with remaining branches
4. **Conflicted branch is skipped** and recorded in summary
5. **User can resolve manually** after script completes

### Manual Conflict Resolution

If a branch fails to merge:

```bash
# Checkout target branch
git checkout cortexbuildpro

# Attempt manual merge
git merge origin/problematic-branch

# Resolve conflicts
# Edit conflicting files manually
git add .
git commit -m "Resolved conflicts from problematic-branch"

# Push changes
git push origin cortexbuildpro

# Delete remote branch manually
git push origin --delete problematic-branch
```

---

## Safety Notes

### ✅ Safe to Use When
- All branches have been reviewed and approved
- You have push permissions to the remote repository
- You want to consolidate development work
- Branches are no longer needed after merge
- You've tested in dry run mode first

### ⚠️ Important Warnings
- **Cannot be undone easily** - deleted branches must be restored from commit SHAs
- **Requires push permissions** - script will fail without proper access
- **May have conflicts** - some branches may need manual resolution
- **Affects remote** - branches are deleted from origin, not just locally
- **Creates merge commits** - history will show merge points

### 🚫 Do Not Use When
- Working on active feature branches that others are using
- Unsure about branch merge status
- Without testing in dry run mode first
- Without proper backups or understanding of git history
- In production environments without proper approval

---

## Comparison with cleanup-branches.sh

| Feature | merge-and-delete-branches.sh | cleanup-branches.sh |
|---------|------------------------------|---------------------|
| **Merges branches** | ✅ Yes, automatically | ❌ No |
| **Commits changes** | ✅ Yes, after each merge | ❌ No |
| **Pushes to remote** | ✅ Yes, after merging | ❌ No |
| **Deletes branches** | ✅ Yes, after successful merge | ✅ Yes |
| **Dry run mode** | ✅ Yes | ❌ No |
| **Conflict handling** | ✅ Yes, with prompts | N/A |
| **Already-merged detection** | ✅ Yes, skips automatically | N/A |
| **Target branch** | ✅ Configurable | N/A |
| **Use case** | Complete merge + cleanup workflow | Cleanup only (assumes already merged) |

### When to Use Each Script

**Use `merge-and-delete-branches.sh` when:**
- Branches need to be merged first
- Want automated merge + delete workflow
- Need to consolidate work from multiple branches
- Want conflict detection and handling
- Need dry run testing capability

**Use `cleanup-branches.sh` when:**
- Branches are already merged
- Only need to delete remote branches
- Have a predefined list of branches to delete
- Branches were merged through pull requests
- Want simple, straightforward deletion

---

## Recovery and Rollback

### Restore Deleted Branch

If a branch was deleted by mistake:

```bash
# Find the branch's last commit SHA
# Option 1: From GitHub web interface (branch history)
# Option 2: From local git log (if you have it)
git log --all --oneline | grep "branch-name"

# Recreate the branch on remote
git push origin <commit-sha>:refs/heads/<branch-name>
```

Example:
```bash
git push origin fc032c6:refs/heads/copilot/my-deleted-branch
```

### Undo Recent Merge

If a merge was incorrect:

```bash
# Find the commit before the merge
git log --oneline -10

# Reset to that commit (soft reset keeps changes)
git reset --soft <commit-sha>

# Or hard reset (discards changes)
git reset --hard <commit-sha>

# Force push (use with caution!)
# git push -f origin cortexbuildpro
```

**⚠️ Note:** Force push is not available in this environment. Contact repository administrator.

---

## Troubleshooting

### Issue: "Not in a git repository"
**Solution:** Run the script from within the git repository directory

### Issue: "Target branch doesn't exist"
**Solution:** 
- Verify branch name spelling
- Check that branch exists on remote: `git ls-remote --heads origin`
- Create branch if needed: `git checkout -b <branch-name>`

### Issue: "Failed to push changes"
**Solution:**
- Check network connectivity
- Verify push permissions: `git remote -v`
- Ensure target branch is not protected
- Try manual push: `git push origin <target-branch>`

### Issue: "Failed to delete branch"
**Solution:**
- Verify delete permissions
- Check if branch is protected on GitHub
- Delete manually: `git push origin --delete <branch-name>`
- Branch may already be deleted

### Issue: Merge conflicts on every branch
**Solution:**
- Branches may have unrelated history
- Consider using `--allow-unrelated-histories` flag
- Manual merge may be required for some branches
- Review branch divergence: `git log --graph --all`

---

## Best Practices

### Before Running

1. **Backup Important Branches**
   ```bash
   # Create local backup of important branches
   git checkout -b backup/my-important-branch origin/my-important-branch
   ```

2. **Test in Dry Run**
   ```bash
   ./merge-and-delete-branches.sh cortexbuildpro true
   ```

3. **Review Branch List**
   ```bash
   git branch -r
   git ls-remote --heads origin
   ```

4. **Check Branch Status**
   ```bash
   # See which branches are merged
   git branch -r --merged cortexbuildpro
   
   # See which branches are not merged
   git branch -r --no-merged cortexbuildpro
   ```

### During Execution

1. **Read all prompts carefully** before confirming
2. **Review merge conflicts** when they occur
3. **Don't force operations** if uncertain
4. **Keep terminal output** for reference

### After Running

1. **Verify Merge Success**
   ```bash
   git log --oneline -20
   git show HEAD
   ```

2. **Check Remote Branches**
   ```bash
   git ls-remote --heads origin
   ```

3. **Test Application**
   ```bash
   npm install
   npm run build
   npm run dev
   ```

4. **Clean Local References**
   ```bash
   git fetch --prune origin
   git branch -r
   ```

---

## Integration with Existing Workflow

### Recommended Workflow

1. **Review branches** to be merged
   ```bash
   git branch -r
   ```

2. **Test in dry run mode**
   ```bash
   ./merge-and-delete-branches.sh cortexbuildpro true
   ```

3. **Execute merge and delete**
   ```bash
   ./merge-and-delete-branches.sh cortexbuildpro
   ```

4. **Verify changes**
   ```bash
   git log --graph --oneline -20
   npm run build
   ```

5. **Update documentation**
   - Document merged branches
   - Update CHANGELOG
   - Close related issues

---

## Script Requirements

### Prerequisites
- Git installed and configured
- Push permissions to remote repository
- Working directory is a git repository
- Internet connectivity to remote

### Permissions Required
- Read access to remote branches
- Push access to target branch
- Delete access to remote branches

### Git Version
- Git 2.0 or higher recommended
- Tested with Git 2.34+

---

## Advanced Usage

### Custom Merge Strategy

To use a custom merge strategy, modify the script:

```bash
# Edit line with git merge command
# From:
git merge origin/$branch --no-edit -m "..."

# To:
git merge origin/$branch --strategy=recursive --strategy-option=theirs --no-edit -m "..."
```

### Exclude Specific Branches

To exclude certain branches from processing:

```bash
# After the git branch -r command, add additional grep filters:
REMOTE_BRANCHES=$(git branch -r | grep -v "HEAD" | grep -v "$TARGET_BRANCH" | grep -v "exclude-pattern" | ...)
```

### Auto-Accept All Prompts

For CI/CD automation (use with extreme caution):

```bash
# Pipe 'yes' to the script
yes | ./merge-and-delete-branches.sh cortexbuildpro
```

---

## Support and Feedback

For issues or questions about this script:
1. Check this guide for troubleshooting
2. Review git logs for merge history
3. Check GitHub repository for branch status
4. Contact repository administrator for permissions issues

---

## Version History

- **1.0.0** (February 5, 2026) - Initial release
  - Automated merge and delete workflow
  - Dry run mode
  - Conflict handling
  - Comprehensive logging
  - Interactive confirmations

---

**Prepared by:** GitHub Copilot Agent  
**Date:** February 5, 2026  
**Script:** merge-and-delete-branches.sh  
**Target Repository:** adrianstanca1/cortexbuild-pro
