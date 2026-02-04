# Deployment Instructions for cortexbuild-pro

## Quick Reference

This document provides step-by-step instructions for completing the repository cleanup and deploying to production.

---

## 1. Close PR #133

### Option A: Merge via GitHub UI (Recommended)
1. Navigate to: https://github.com/adrianstanca1/cortexbuild-pro/pull/133
2. Click **"Merge pull request"** button
3. Confirm the merge
4. The branch will be automatically deleted if that option is enabled

### Option B: Close via GitHub CLI
```bash
gh pr close 133 --comment "Changes already integrated in cortexbuildpro branch"
```

---

## 2. Delete Obsolete Branches

### All 11 Branches to Delete:
```
copilot/commit-all-changes
copilot/continue-build-and-debug-session
copilot/continue-existing-feature
copilot/continue-task-implementation
copilot/fix-all-errors-and-conflicts
copilot/fix-api-connections-and-dependencies
copilot/fix-conflicts-and-commit-changes
copilot/merge-and-integrate-changes
copilot/merge-branches-and-cleanup
copilot/merge-changes-into-main
dependabot/npm_and_yarn/nextjs_space/npm_and_yarn-89e2f534c7
```

### Method 1: Delete via GitHub CLI (Fastest)
```bash
# Copy and paste this entire block:
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/commit-all-changes -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/continue-build-and-debug-session -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/continue-existing-feature -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/continue-task-implementation -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/fix-all-errors-and-conflicts -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/fix-api-connections-and-dependencies -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/fix-conflicts-and-commit-changes -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/merge-and-integrate-changes -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/merge-branches-and-cleanup -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/copilot/merge-changes-into-main -X DELETE
gh api repos/adrianstanca1/cortexbuild-pro/git/refs/heads/dependabot/npm_and_yarn/nextjs_space/npm_and_yarn-89e2f534c7 -X DELETE
```

### Method 2: Delete via GitHub Web UI
1. Go to: https://github.com/adrianstanca1/cortexbuild-pro/branches
2. Search for each branch name
3. Click the trash/delete icon next to each branch
4. Confirm deletion

---

## 3. Deploy to Production

### Pre-Deployment Verification
✅ All security updates integrated:
- Next.js 15.5.11 (DoS vulnerability fixed)
- next-auth 4.24.13 (email misdelivery fixed)
- lodash 4.17.23 (prototype pollution fixed)
- ESLint 9.39.2 (ReDoS fixed)
- postcss 8.5.6

✅ Configuration:
- Node.js engine: >=18.18.0
- Package manager: npm with package-lock.json
- Vulnerability reduction: 98.2% (57 → 1)

### Deployment Steps

#### Step 1: Backup Current Production
```bash
# SSH to your server
ssh your-production-server

# Navigate to app directory
cd /path/to/cortexbuild-pro

# Create timestamped backup
sudo cp -r . ../cortexbuild-pro-backup-$(date +%Y%m%d-%H%M%S)
```

#### Step 2: Pull Latest Code
```bash
# Fetch latest changes
git fetch origin

# Switch to cortexbuildpro branch
git checkout cortexbuildpro

# Pull latest changes
git pull origin cortexbuildpro

# Verify you're on the right commit
git log --oneline -5
```

#### Step 3: Install Dependencies
```bash
# Navigate to Next.js app directory
cd nextjs_space

# IMPORTANT: Use npm ci for reproducible builds (not npm install)
npm ci

# If you get peer dependency warnings, that's normal
```

#### Step 4: Run Database Migrations (if applicable)
```bash
# If you have Prisma migrations
npm run prisma:migrate:deploy

# Or if you have a different migration system
npm run migrate
```

#### Step 5: Build the Application
```bash
# Build the Next.js application
npm run build

# This should complete without errors
# Expected output: "Compiled successfully"
```

#### Step 6: Restart the Application

**For PM2:**
```bash
pm2 restart cortexbuild-pro
# Or: pm2 restart ecosystem.config.js
```

**For systemd:**
```bash
sudo systemctl restart cortexbuild-pro
```

**For Docker:**
```bash
docker-compose down
docker-compose up -d --build
```

**For CloudPanel:**
```bash
# Use the provided deployment script
cd /path/to/cortexbuild-pro/deployment
bash cloudpanel-deploy.sh

# Or restart via CloudPanel UI:
# CloudPanel Dashboard → Sites → Your Site → Restart
```

#### Step 7: Verify Deployment
```bash
# Check application status
curl http://localhost:3000/api/health  # Or your health endpoint

# Check logs for errors
# PM2: pm2 logs cortexbuild-pro
# systemd: journalctl -u cortexbuild-pro -f
# Docker: docker-compose logs -f
```

#### Step 8: Test in Browser
1. Open your application URL
2. Test login functionality
3. Test key features
4. Check browser console for errors

---

## Troubleshooting

### If Build Fails
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### If Application Won't Start
```bash
# Check Node.js version
node --version
# Should be >= 18.18.0

# Check for port conflicts
lsof -i :3000  # Or your app port

# Check environment variables
cat .env.local  # Verify all required vars are set
```

### If Database Connection Fails
```bash
# Test database connection
npm run prisma:studio

# Or check connection string
echo $DATABASE_URL
```

---

## Post-Deployment Checklist

- [ ] PR #133 closed/merged
- [ ] All 11 obsolete branches deleted
- [ ] Production backup created
- [ ] cortexbuildpro branch deployed
- [ ] Dependencies installed with `npm ci`
- [ ] Database migrations run (if applicable)
- [ ] Application built successfully
- [ ] Application restarted
- [ ] Health check passed
- [ ] Website accessible and functional
- [ ] No errors in logs
- [ ] Key features tested

---

## Support

If you encounter issues:
1. Check the logs for specific error messages
2. Verify Node.js version: `node --version` (must be >= 18.18.0)
3. Verify npm is being used (not yarn)
4. Check that all environment variables are set
5. Review SECURITY_NOTES.md for additional context

---

## Rollback (if needed)

If deployment fails:
```bash
# Stop the application
pm2 stop cortexbuild-pro  # Or your process manager command

# Restore from backup
cd /path/to
rm -rf cortexbuild-pro
mv cortexbuild-pro-backup-TIMESTAMP cortexbuild-pro

# Restart
cd cortexbuild-pro/nextjs_space
pm2 start ecosystem.config.js  # Or your start command
```

---

Generated: 2026-02-04
Branch: cortexbuildpro
Security Status: ✅ All patches applied (98.2% vulnerability reduction)
