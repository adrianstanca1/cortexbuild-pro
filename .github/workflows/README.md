# GitHub Actions Setup for VPS Deployment

This directory contains GitHub Actions workflows for automated deployment.

## 🔄 Available Workflows

### 1. Docker Image Build & Publish (`docker-publish.yml`)

**Triggers:**
- Push to `main` or `cortexbuildpro` branches
- Version tags (`v*.*.*`)
- Daily scheduled builds
- Pull requests

**Actions:**
- Runs tests and security audits
- Builds Docker image
- Publishes to GitHub Container Registry
- Signs image with Cosign

**Image Location:** `ghcr.io/adrianstanca1/cortexbuild-pro`

---

### 2. VPS Deployment (`deploy-vps.yml`)

**Triggers:**
- Push to `main` or `cortexbuildpro` branches
- Manual workflow dispatch (with options)

**Actions:**
- Runs tests (optional)
- Builds and publishes Docker image
- Deploys to configured VPS
- Runs database migrations
- Performs health checks
- Sends deployment notifications

---

## 🔧 Setup Instructions

### Step 1: Configure Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **Secrets**

Add these repository secrets:

```
VPS_SSH_KEY       = Private SSH key for VPS access
VPS_HOST          = VPS IP address or hostname
VPS_USER          = SSH username (e.g., root, ubuntu)
VPS_PORT          = SSH port (default: 22, optional)
```

### Step 2: Configure Variables

Go to **Settings** → **Secrets and variables** → **Actions** → **Variables**

Add these repository variables:

```
DEPLOYMENT_PATH   = /var/www/cortexbuild-pro
DEPLOYMENT_URL    = https://www.cortexbuildpro.com
```

### Step 3: Generate SSH Key

```bash
# Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ./github-actions-key

# Copy private key content (add to VPS_SSH_KEY secret)
cat github-actions-key

# Copy public key to VPS
ssh-copy-id -i github-actions-key.pub user@vps-ip

# Or manually add to VPS
cat github-actions-key.pub
# SSH to VPS and add to ~/.ssh/authorized_keys
```

### Step 4: Test Deployment

1. Go to **Actions** tab
2. Select **"Deploy to VPS"** workflow
3. Click **"Run workflow"**
4. Select options and run
5. Monitor the deployment progress

---

## 🚀 Usage

### Automatic Deployment

Simply push to the main branch:

```bash
git add .
git commit -m "Deploy changes"
git push origin main
```

The workflow will automatically:
1. Run tests
2. Build Docker image
3. Deploy to VPS
4. Verify deployment

### Manual Deployment

1. Navigate to **Actions** tab
2. Select **"Deploy to VPS"**
3. Click **"Run workflow"**
4. Choose:
   - Environment (production/staging)
   - Skip tests (yes/no)
5. Click **"Run workflow"**

---

## 📊 Monitoring

### View Deployment Status

- Go to **Actions** tab
- Click on the latest workflow run
- View detailed logs for each step

### Check Deployment Logs

```bash
# SSH into VPS
ssh user@vps-ip

# View logs
cd /var/www/cortexbuild-pro/deployment
docker compose logs -f
```

---

## 🔐 Security

### Best Practices

1. **Never commit secrets** to the repository
2. **Rotate SSH keys** regularly
3. **Use environment-specific secrets** for staging/production
4. **Enable branch protection** on main branch
5. **Require approvals** for production deployments

### Environment Protection

1. Go to **Settings** → **Environments**
2. Add `production` environment
3. Configure:
   - Required reviewers
   - Wait timer
   - Deployment branches (only main)

---

## 🐛 Troubleshooting

### Workflow Fails to Start

**Check:**
- Workflow file syntax is valid
- Secrets are configured correctly
- Branch name matches trigger conditions

### SSH Connection Fails

**Check:**
- VPS_SSH_KEY contains the complete private key
- VPS_HOST is correct and accessible
- VPS_USER has SSH access
- Public key is in VPS `~/.ssh/authorized_keys`
- VPS firewall allows SSH (port 22)

### Deployment Fails

**Check:**
- VPS has enough disk space: `df -h`
- VPS has enough memory: `free -h`
- Docker is running: `docker ps`
- Application logs: `docker compose logs app`
- Database logs: `docker compose logs postgres`

### Health Check Fails

**Check:**
- Application is running: `docker compose ps`
- Application logs for errors
- Database connection is working
- Environment variables are set correctly

---

## 📋 Workflow Customization

### Add Slack Notifications

Edit `.github/workflows/deploy-vps.yml` and add:

```yaml
- name: Slack notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Add Staging Environment

1. Create separate secrets for staging:
   - `STAGING_VPS_HOST`
   - `STAGING_VPS_USER`
   - `STAGING_VPS_SSH_KEY`

2. Update workflow to use environment-specific secrets

3. Add staging environment in Settings → Environments

### Deploy Specific Branch

Modify trigger in workflow:

```yaml
on:
  push:
    branches:
      - main
      - develop  # Add your branch
      - staging  # Add your branch
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Production Deployment Guide](../deployment/PRODUCTION-DEPLOY-GUIDE.md)
- [Deployment Quick Start](../deployment/QUICKSTART.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING.md)

---

## 🆘 Support

For issues or questions:

1. Check workflow logs in Actions tab
2. Review VPS logs: `docker compose logs`
3. Run diagnostics: `./verify-deployment.sh`
4. Open an issue on GitHub

---

**Last Updated:** January 28, 2026
