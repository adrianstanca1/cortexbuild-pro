# Automated VPS Deployment with GitHub Actions

This guide explains how to set up and use automated VPS deployment via GitHub Actions for CortexBuild Pro.

## 🚀 Overview

The automated deployment workflow allows you to deploy CortexBuild Pro to your VPS directly from GitHub with a single click. This eliminates manual SSH access and ensures consistent deployments.

**Features:**
- ✅ One-click deployment from GitHub Actions
- ✅ Pre-deployment validation (tests, linting, build checks)
- ✅ Automatic health checks after deployment
- ✅ Support for multiple environments (production, staging)
- ✅ Secure SSH-based deployment
- ✅ Rollback capability in case of failures

---

## 📋 Prerequisites

Before setting up automated deployment, ensure you have:

1. **VPS Server** with:
   - Ubuntu 20.04+ or similar Linux distribution
   - Docker and Docker Compose installed
   - CortexBuild Pro repository cloned to `/root/cortexbuild-pro`
   - SSH access enabled

2. **GitHub Repository** with:
   - Admin access to configure secrets
   - Actions enabled (enabled by default)

3. **Initial Manual Deployment** completed:
   ```bash
   # On your VPS, run initial setup
   cd /root/cortexbuild-pro/deployment
   sudo bash one-click-deploy.sh
   ```

---

## 🔑 Step 1: Generate SSH Key for GitHub Actions

On your local machine or VPS, generate a dedicated SSH key for GitHub Actions:

```bash
# Generate SSH key (no passphrase for automation)
ssh-keygen -t ed25519 -C "github-actions@cortexbuild" -f ~/.ssh/cortexbuild_deploy_key -N ""

# This creates two files:
# - cortexbuild_deploy_key (private key - for GitHub)
# - cortexbuild_deploy_key.pub (public key - for VPS)
```

---

## 🔐 Step 2: Configure VPS SSH Access

Add the public key to your VPS authorized keys:

```bash
# Copy the public key
cat ~/.ssh/cortexbuild_deploy_key.pub

# On your VPS, add it to authorized_keys
ssh root@YOUR_VPS_IP
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key on a new line
# Save and exit (Ctrl+X, Y, Enter)

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
```

**Test the connection:**
```bash
# From your local machine
ssh -i ~/.ssh/cortexbuild_deploy_key root@YOUR_VPS_IP "echo 'Connection successful!'"
```

---

## 🔒 Step 3: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

### Navigate to Repository Settings:
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret below

### Required Secrets:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `VPS_SSH_KEY` | Private SSH key content | Contents of `cortexbuild_deploy_key` file |
| `VPS_HOST` | VPS IP address or domain | `72.62.132.43` or `cortexbuild.com` |
| `VPS_USER` | SSH user (usually root) | `root` |
| `VPS_PORT` | SSH port (optional, defaults to 22) | `22` |

### How to Add VPS_SSH_KEY:

```bash
# Display the private key
cat ~/.ssh/cortexbuild_deploy_key

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (key content) ...
# -----END OPENSSH PRIVATE KEY-----

# Paste it into GitHub as VPS_SSH_KEY secret
```

**Security Note:** Never commit the private key to your repository!

---

## 🎯 Step 4: Run Automated Deployment

### Via GitHub Actions UI:

1. Navigate to your repository on GitHub
2. Click **Actions** tab
3. Select **Deploy to VPS** workflow from the left sidebar
4. Click **Run workflow** button (top right)
5. Configure options:
   - **Environment**: Select `production` or `staging`
   - **Skip tests**: Check only if you want to skip pre-deployment validation
6. Click **Run workflow** green button
7. Watch the deployment progress in real-time

### Via GitHub CLI:

```bash
# Install GitHub CLI if needed
brew install gh  # macOS
# or
sudo apt install gh  # Ubuntu/Debian

# Login to GitHub
gh auth login

# Trigger deployment to production
gh workflow run "Deploy to VPS" --ref main

# Trigger deployment to staging with tests skipped
gh workflow run "Deploy to VPS" --ref main \
  -f environment=staging \
  -f skip_tests=true

# View workflow status
gh run list --workflow="Deploy to VPS"

# View logs of the latest run
gh run view --log
```

---

## 📊 Deployment Workflow Stages

### Stage 1: Pre-deployment Checks (Optional)
- ✅ Code linting with ESLint
- ✅ TypeScript type checking
- ✅ Prisma schema validation
- ✅ Next.js production build test

**Note:** Can be skipped using `skip_tests` option for urgent hotfixes

### Stage 2: Deploy to VPS
- ✅ Establishes secure SSH connection
- ✅ Pulls latest code from GitHub
- ✅ Runs production deployment script
- ✅ Rebuilds Docker containers
- ✅ Runs database migrations
- ✅ Restarts services

### Stage 3: Health Check
- ✅ Waits for services to start (30 seconds)
- ✅ Verifies container status
- ✅ Checks database connectivity
- ✅ Tests application endpoints

### Stage 4: Notification
- ✅ Reports deployment success/failure
- ✅ Provides application URL
- ✅ Displays troubleshooting steps if failed

---

## 🔄 Deployment Process Flow

```
┌─────────────────────┐
│ Trigger Deployment  │
│ (GitHub Actions)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Pre-deployment      │
│ Validation          │
│ (Optional)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ SSH to VPS          │
│ (Secure Connection) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Pull Latest Code    │
│ from GitHub         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Run Production      │
│ Deploy Script       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Rebuild & Restart   │
│ Services            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Run Migrations      │
│ & Health Checks     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Deployment Complete │
│ Notify Status       │
└─────────────────────┘
```

---

## 🛡️ Security Best Practices

### SSH Key Management
- ✅ Use dedicated SSH key only for GitHub Actions
- ✅ Never reuse personal SSH keys for automation
- ✅ Rotate SSH keys every 90 days
- ✅ Disable key immediately if compromised

### GitHub Secrets
- ✅ Use environment-specific secrets (production, staging)
- ✅ Limit secret access to specific workflows
- ✅ Never log secret values in workflow outputs
- ✅ Review secret access logs regularly

### VPS Security
- ✅ Use firewall rules (UFW) to limit SSH access
- ✅ Enable SSH key-only authentication (disable password auth)
- ✅ Use non-standard SSH port if needed
- ✅ Monitor deployment logs for suspicious activity

### Additional Security
```bash
# On VPS: Restrict SSH to key authentication only
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PubkeyAuthentication yes
sudo systemctl restart sshd

# Configure firewall
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
```

---

## 🔧 Troubleshooting

### Deployment Failed: SSH Connection Error

**Symptoms:**
```
Permission denied (publickey)
```

**Solutions:**
1. Verify `VPS_SSH_KEY` secret contains the correct private key
2. Ensure public key is in VPS `~/.ssh/authorized_keys`
3. Check VPS SSH service is running: `sudo systemctl status sshd`
4. Verify VPS firewall allows SSH: `sudo ufw status`

```bash
# Test SSH connection manually
ssh -i ~/.ssh/cortexbuild_deploy_key root@YOUR_VPS_IP
```

---

### Deployment Failed: Docker Build Error

**Symptoms:**
```
docker compose build failed
```

**Solutions:**
1. Check VPS disk space: `df -h`
2. Clean Docker artifacts: `cd /root/cortexbuild-pro/deployment && ./cleanup-repos.sh --aggressive`
3. Check Docker service: `sudo systemctl status docker`
4. Review build logs: `docker compose logs app`

---

### Deployment Failed: Database Migration Error

**Symptoms:**
```
prisma migrate deploy failed
```

**Solutions:**
1. Check database connectivity:
   ```bash
   docker compose exec db pg_isready -U cortexbuild
   ```
2. Check database logs:
   ```bash
   docker compose logs db
   ```
3. Manually run migrations:
   ```bash
   cd /root/cortexbuild-pro/deployment
   docker compose exec app npx prisma migrate deploy
   ```

---

### Health Check Failed

**Symptoms:**
```
Application health check timeout
```

**Solutions:**
1. Application may need more time to start (normal for first deployment)
2. Check application logs:
   ```bash
   cd /root/cortexbuild-pro/deployment
   docker compose logs -f app
   ```
3. Verify services are running:
   ```bash
   docker compose ps
   ```
4. Manually run health check:
   ```bash
   ./health-check.sh
   ```

---

### Workflow Won't Trigger

**Solutions:**
1. Verify workflow file is in `.github/workflows/deploy-to-vps.yml`
2. Check workflow syntax: GitHub Actions → Workflow file → View
3. Ensure you have repository admin access
4. Check if Actions are enabled: Settings → Actions → General

---

## 🔄 Rollback Process

If deployment fails or introduces issues:

### Automatic Rollback (Not Yet Implemented)
The workflow currently doesn't include automatic rollback, but you can implement it by adding a rollback step.

### Manual Rollback via SSH

```bash
# SSH to VPS
ssh -i ~/.ssh/cortexbuild_deploy_key root@YOUR_VPS_IP

# Navigate to deployment directory
cd /root/cortexbuild-pro/deployment

# Run rollback script
./rollback.sh

# Or restore from backup
./restore.sh backups/cortexbuild_backup_YYYYMMDD.sql.gz
```

### Manual Rollback via GitHub Actions

Create a separate rollback workflow or add rollback capability to existing workflow.

---

## 📈 Advanced Configuration

### Multiple Environments

Set up staging and production environments:

1. **Create environment-specific secrets** in GitHub:
   - Settings → Environments → New environment
   - Create `production` and `staging` environments
   - Add environment-specific secrets to each

2. **Configure multiple VPS servers:**
   - Production: `VPS_HOST_PROD`, `VPS_SSH_KEY_PROD`
   - Staging: `VPS_HOST_STAGING`, `VPS_SSH_KEY_STAGING`

3. **Use in workflow:**
   ```yaml
   environment: ${{ inputs.environment }}
   env:
     VPS_HOST: ${{ secrets.VPS_HOST }}
   ```

---

### Deploy on Push (Continuous Deployment)

**⚠️ Warning:** Only enable for staging environments, not production!

Modify `.github/workflows/deploy-to-vps.yml`:

```yaml
on:
  workflow_dispatch:
    # ... existing config ...
  
  # Add automatic trigger for staging
  push:
    branches:
      - staging
```

---

### Slack Notifications

Add Slack notifications to the workflow:

1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Add `SLACK_WEBHOOK_URL` to GitHub secrets
3. Add notification step:

```yaml
- name: Slack Notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
    text: 'Deployment to ${{ inputs.environment }}: ${{ job.status }}'
```

---

### Email Notifications

GitHub Actions sends email notifications by default to:
- Workflow trigger user
- Repository watchers (if configured)

Configure in: Settings → Notifications → Actions

---

## 📚 Additional Resources

### Related Documentation
- [VPS Deployment Quick Start](QUICKSTART.md)
- [Production Deployment Guide](PRODUCTION-DEPLOY-GUIDE.md)
- [Manual Deployment Scripts](README.md)
- [Health Check Guide](health-check.sh)
- [Backup & Restore](backup.sh)

### Useful Commands

```bash
# View deployment logs on VPS
ssh root@YOUR_VPS_IP "cd /root/cortexbuild-pro/deployment && docker compose logs -f app"

# Check service status on VPS
ssh root@YOUR_VPS_IP "cd /root/cortexbuild-pro/deployment && docker compose ps"

# Run health check on VPS
ssh root@YOUR_VPS_IP "cd /root/cortexbuild-pro/deployment && ./health-check.sh"

# Create backup on VPS
ssh root@YOUR_VPS_IP "cd /root/cortexbuild-pro/deployment && ./backup.sh"

# Clean up VPS resources
ssh root@YOUR_VPS_IP "cd /root/cortexbuild-pro/deployment && ./cleanup-repos.sh"
```

---

## 🎯 Quick Reference

### Initial Setup Checklist
- [ ] VPS server configured and accessible via SSH
- [ ] Initial manual deployment completed successfully
- [ ] SSH key pair generated for GitHub Actions
- [ ] Public key added to VPS `authorized_keys`
- [ ] GitHub secrets configured (`VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`)
- [ ] Test SSH connection from GitHub Actions
- [ ] First automated deployment successful

### Pre-deployment Checklist
- [ ] Code changes committed and pushed to GitHub
- [ ] Tests passing locally
- [ ] Database migrations tested
- [ ] Environment variables updated (if needed)
- [ ] Backup created on VPS (recommended)
- [ ] Maintenance window scheduled (if needed)

### Post-deployment Checklist
- [ ] Health check passed
- [ ] Application accessible at URL
- [ ] Database migrations applied
- [ ] No errors in application logs
- [ ] Services running correctly
- [ ] Performance is acceptable

---

## 🤝 Support

If you encounter issues with automated deployment:

1. **Check GitHub Actions logs**: Actions tab → Latest workflow run
2. **Check VPS logs**: `docker compose logs -f app`
3. **Run health check**: `./health-check.sh`
4. **Review this guide**: Troubleshooting section
5. **Create GitHub issue**: Include workflow logs and error messages

---

## 📄 License

Part of CortexBuild Pro - All rights reserved

---

**Happy Deploying! 🚀**

For manual deployment options, see [QUICKSTART.md](QUICKSTART.md)
