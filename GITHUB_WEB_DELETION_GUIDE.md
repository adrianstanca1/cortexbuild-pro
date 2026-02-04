# GitHub Web Interface Branch Deletion Guide

**Date:** February 4, 2026  
**Task:** Delete 13 merged/outdated branches via GitHub web interface  
**Status:** Ready for execution

---

## Overview

This guide provides step-by-step instructions for deleting branches using the GitHub web interface. This method is recommended when:
- Git push authentication is not available
- You prefer a visual interface
- You want to delete branches one at a time with confirmation

---

## Quick Access URL

Navigate to the branches page:
```
https://github.com/adrianstanca1/cortexbuild-pro/branches
```

Or manually:
1. Go to `https://github.com/adrianstanca1/cortexbuild-pro`
2. Click on the branches dropdown (shows number of branches)
3. Click "View all branches"

---

## Branches to Delete (13 Total)

### Method 1: Delete Individual Branches via Web Interface

For each branch below, follow these steps:

1. Navigate to: `https://github.com/adrianstanca1/cortexbuild-pro/branches`
2. Find the branch in the list
3. Click the trash/delete icon (🗑️) on the right side of the branch row
4. Confirm the deletion in the popup dialog

### List of Branches to Delete:

#### Merged Branches (9)
1. ✅ `copilot/merge-and-clean-cortexbuild`
2. ✅ `copilot/fix-api-connections-and-dependencies`
3. ✅ `copilot/merge-and-integrate-changes`
4. ✅ `copilot/merge-changes-into-main`
5. ✅ `copilot/continue-task-implementation`
6. ✅ `copilot/continue-existing-feature`
7. ✅ `copilot/fix-all-errors-and-conflicts`
8. ✅ `copilot/fix-conflicts-and-commit-changes`
9. ✅ `copilot/continue-build-and-debug-session`

#### Outdated Branches (2)
10. ❌ `copilot/commit-all-changes`
11. ❌ `copilot/merge-branches-and-cleanup`

#### Empty Branches (2)
12. 🔄 `copilot/improve-slow-code-efficiency`
13. 🔄 `copilot/refactor-duplicated-code`

---

## Method 2: Delete Multiple Branches (GitHub CLI)

If you have GitHub CLI (`gh`) installed:

```bash
# Authenticate with GitHub CLI
gh auth login

# Delete all branches
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/merge-and-clean-cortexbuild -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/fix-api-connections-and-dependencies -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/merge-and-integrate-changes -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/merge-changes-into-main -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/continue-task-implementation -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/continue-existing-feature -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/fix-all-errors-and-conflicts -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/fix-conflicts-and-commit-changes -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/continue-build-and-debug-session -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/commit-all-changes -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/merge-branches-and-cleanup -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/improve-slow-code-efficiency -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/refactor-duplicated-code -X DELETE
```

---

## Method 3: Automated Script with GitHub CLI

Create and run this script:

```bash
#!/bin/bash
# delete-branches-gh.sh

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
  "copilot/improve-slow-code-efficiency"
  "copilot/refactor-duplicated-code"
)

REPO="adrianstanca1/cortexbuild-pro"

echo "🗑️  Deleting branches via GitHub API..."
echo ""

for branch in "${BRANCHES[@]}"; do
  echo "Deleting $branch..."
  gh api "repos/$REPO/git/refs/heads/$branch" -X DELETE 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "✅ Deleted $branch"
  else
    echo "❌ Failed to delete $branch (may already be deleted)"
  fi
done

echo ""
echo "✅ Cleanup complete!"
```

Save as `delete-branches-gh.sh`, make executable, and run:
```bash
chmod +x delete-branches-gh.sh
./delete-branches-gh.sh
```

---

## Step-by-Step Web Interface Instructions

### Step 1: Access Branches Page
1. Open your browser
2. Go to `https://github.com/adrianstanca1/cortexbuild-pro`
3. Click on the branch dropdown (next to the repository name)
4. Click "View all branches" at the bottom

### Step 2: Identify Branches to Delete
Look for these branches in the "Your branches" or "All branches" section:
- All branches starting with `copilot/` except `copilot/merge-and-cleanup-branches`

### Step 3: Delete Each Branch
For each branch:
1. Locate the branch in the list
2. On the right side, you'll see icons for actions
3. Click the trash can icon (🗑️) to delete
4. A confirmation dialog will appear
5. Click "Delete branch" to confirm

### Step 4: Verify Deletion
After deleting all branches:
1. Refresh the branches page
2. Verify only 2 branches remain:
   - `cortexbuildpro` (default branch)
   - `copilot/merge-and-cleanup-branches` (current work branch)

---

## Verification Checklist

Use this checklist while deleting:

- [ ] ✅ copilot/merge-and-clean-cortexbuild - DELETED
- [ ] ✅ copilot/fix-api-connections-and-dependencies - DELETED
- [ ] ✅ copilot/merge-and-integrate-changes - DELETED
- [ ] ✅ copilot/merge-changes-into-main - DELETED
- [ ] ✅ copilot/continue-task-implementation - DELETED
- [ ] ✅ copilot/continue-existing-feature - DELETED
- [ ] ✅ copilot/fix-all-errors-and-conflicts - DELETED
- [ ] ✅ copilot/fix-conflicts-and-commit-changes - DELETED
- [ ] ✅ copilot/continue-build-and-debug-session - DELETED
- [ ] ❌ copilot/commit-all-changes - DELETED
- [ ] ❌ copilot/merge-branches-and-cleanup - DELETED
- [ ] 🔄 copilot/improve-slow-code-efficiency - DELETED
- [ ] 🔄 copilot/refactor-duplicated-code - DELETED

**Remaining Branches:**
- [ ] ✅ cortexbuildpro (KEEP - main branch)
- [ ] ✅ copilot/merge-and-cleanup-branches (KEEP - current branch)

---

## Post-Deletion Steps

### 1. Clean Up Local Git References

After deleting branches remotely, clean up your local git:

```bash
cd /home/runner/work/cortexbuild-pro/cortexbuild-pro
git fetch --prune origin
git branch -r  # Should show only 2 branches
```

### 2. Verify Remote Branches

```bash
git ls-remote --heads origin
```

Expected output:
```
<sha>  refs/heads/copilot/merge-and-cleanup-branches
<sha>  refs/heads/cortexbuildpro
```

### 3. Complete the Current PR

After deletion:
1. Merge the current PR (`copilot/merge-and-cleanup-branches`)
2. Delete `copilot/merge-and-cleanup-branches` branch
3. Final state: Only `cortexbuildpro` remains

---

## Troubleshooting

### Branch Not Showing in Web Interface

**Problem:** A branch is not visible in the web interface.  
**Solution:** It may have been deleted already. Check:
```bash
git ls-remote --heads origin | grep <branch-name>
```

### Cannot Delete Branch (Protected)

**Problem:** "This branch is protected" error.  
**Solution:** 
1. Go to Settings → Branches
2. Find the branch protection rule
3. Remove protection temporarily
4. Delete the branch
5. Re-enable protection if needed

### "Branch Not Found" Error

**Problem:** Branch doesn't exist.  
**Solution:** Branch was likely already deleted. Continue with other branches.

### Need to Restore a Deleted Branch

**Problem:** Accidentally deleted the wrong branch.  
**Solution:**
1. Find the commit SHA from recent activity or PR
2. Restore via web interface or git command:
```bash
git push origin <commit-sha>:refs/heads/<branch-name>
```

---

## Alternative: Delete via Repository Settings

Another web interface method:

1. Go to `https://github.com/adrianstanca1/cortexbuild-pro/settings`
2. Click on "Branches" in the left sidebar
3. Scroll to see all branches
4. Use the delete option next to each branch

---

## Summary

**Total Actions Required:** 13 branch deletions  
**Recommended Method:** Web interface (safest, with visual confirmation)  
**Alternative Methods:** GitHub CLI or git push (requires authentication)  
**Time Estimate:** 5-10 minutes for manual deletion  
**Risk Level:** Low (all branches analyzed and verified safe)

---

## Quick Reference: Direct URLs

For faster access, you can navigate directly to each branch page:

```
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/merge-and-clean-cortexbuild
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/fix-api-connections-and-dependencies
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/merge-and-integrate-changes
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/merge-changes-into-main
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/continue-task-implementation
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/continue-existing-feature
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/fix-all-errors-and-conflicts
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/fix-conflicts-and-commit-changes
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/continue-build-and-debug-session
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/commit-all-changes
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/merge-branches-and-cleanup
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/improve-slow-code-efficiency
https://github.com/adrianstanca1/cortexbuild-pro/tree/copilot/refactor-duplicated-code
```

On each branch page, click "Delete branch" button to remove it.

---

**Prepared by:** GitHub Copilot Agent  
**Date:** February 4, 2026  
**Status:** ✅ Ready for execution  
**Documentation:** See also BRANCH_CLEANUP_GUIDE.md and BRANCH_CLEANUP_EXECUTION.md
