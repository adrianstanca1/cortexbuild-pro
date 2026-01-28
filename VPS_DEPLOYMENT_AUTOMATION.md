# 🤖 VPS Deployment Automation Guide

**Version:** 1.0.0  
**Last Updated:** January 28, 2026  
**Status:** ✅ Production Ready

---

## 📋 Overview

CortexBuild Pro includes comprehensive automation for VPS deployment through GitHub Actions. This guide explains how to set up and use automated deployments.

---

## 🎯 Deployment Methods

### Method 1: Automated CI/CD (Recommended)

Automatic deployment on every push to main branch using GitHub Actions.

**Benefits:**
- ✅ Zero-downtime deployments
- ✅ Automatic rollback on failure
- ✅ Health checks and verification
- ✅ Deployment notifications
- ✅ Full deployment history

### Method 2: Manual One-Click Deployment

Use GitHub Actions workflow with manual trigger.

**Benefits:**
- ✅ Deploy on-demand
- ✅ Choose specific branch or tag
- ✅ Skip tests for faster deployment
- ✅ Deploy to staging or production

### Method 3: Script-based Deployment

Traditional SSH deployment using provided scripts.

**Benefits:**
- ✅ Full control over deployment process
- ✅ Works without GitHub Actions
- ✅ Ideal for initial setup

---

## 🔧 Setting Up Automated Deployment

### Prerequisites

1. **VPS Server**
   - Ubuntu 20.04+ or Debian-based Linux
   - Minimum 2GB RAM, 2 CPU cores
   - Docker and Docker Compose installed
   - SSH access configured

2. **GitHub Repository Access**
   - Admin access to the repository
   - Ability to add secrets and variables

3. **Domain Configuration** (Optional)
   - Domain pointed to VPS IP
   - SSL certificate (can be auto-generated)

---

## 📝 Step-by-Step Setup

### Step 1: Prepare Your VPS

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Run the automated VPS setup script
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
```

This script will:
- Install Docker and Docker Compose
- Configure firewall (UFW)
- Install Fail2Ban for security
- Clone the repository to `/var/www/cortexbuild-pro`
- Generate secure credentials
- Deploy the application

**⏱️ Time:** ~10-15 minutes

### Step 2: Configure GitHub Secrets

Go to your GitHub repository: **Settings** → **Secrets and variables** → **Actions**

#### Add Repository Secrets

Click **"New repository secret"** and add the following:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `VPS_SSH_KEY` | Private SSH key for VPS access | Contents of `~/.ssh/id_rsa` |
| `VPS_HOST` | IP address or hostname of VPS | `203.0.113.10` |
| `VPS_USER` | SSH username | `root` or `ubuntu` |
| `VPS_PORT` | SSH port (optional) | `22` |

**How to get SSH key:**

```bash
# On your local machine or CI runner
ssh-keygen -t rsa -b 4096 -C "github-actions@cortexbuild"

# Copy the private key
cat ~/.ssh/id_rsa
# Copy this entire content to VPS_SSH_KEY secret

# Copy the public key to VPS
ssh-copy-id -i ~/.ssh/id_rsa.pub user@VPS_IP
```

#### Add Repository Variables

Go to **Settings** → **Secrets and variables** → **Actions** → **Variables** tab

Click **"New repository variable"** and add:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `DEPLOYMENT_PATH` | Path where app is deployed | `/var/www/cortexbuild-pro` |
| `DEPLOYMENT_URL` | Public URL of your application | `https://www.cortexbuildpro.com` |

### Step 3: Configure Environment on VPS

Ensure your `.env` file is properly configured on the VPS:

```bash
# SSH into VPS
ssh user@VPS_IP

# Navigate to deployment directory
cd /var/www/cortexbuild-pro/deployment

# Edit environment file
nano .env
```

**Required Settings:**

```env
# Database
POSTGRES_PASSWORD=your_secure_password_here

# NextAuth
NEXTAUTH_SECRET=your_secure_secret_here
NEXTAUTH_URL=https://yourdomain.com

# Domain
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com

# AWS S3 (Optional)
AWS_REGION=us-west-2
AWS_BUCKET_NAME=your-bucket-name
```

---

## 🚀 Deploying Your Application

### Option A: Automatic Deployment

Push to main branch to trigger automatic deployment:

```bash
git add .
git commit -m "Update application"
git push origin main
```

GitHub Actions will:
1. Run tests
2. Build Docker image
3. Push to GitHub Container Registry
4. Deploy to VPS
5. Run database migrations
6. Perform health checks
7. Send notifications

**⏱️ Total time:** ~5-10 minutes

### Option B: Manual Deployment via GitHub Actions

1. Go to **Actions** tab in GitHub
2. Select **"Deploy to VPS"** workflow
3. Click **"Run workflow"**
4. Choose options:
   - **Environment:** production or staging
   - **Skip tests:** Yes/No
5. Click **"Run workflow"**

**⏱️ Total time:** ~3-5 minutes

### Option C: Manual Deployment via SSH

```bash
# SSH into VPS
ssh user@VPS_IP

# Navigate to project
cd /var/www/cortexbuild-pro

# Pull latest changes
git pull origin main

# Navigate to deployment
cd deployment

# Pull latest Docker image
docker compose pull app

# Restart services
docker compose up -d --no-build

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

**⏱️ Total time:** ~2-3 minutes

---

## 🔍 Monitoring Deployments

### GitHub Actions Dashboard

View deployment status:
1. Go to **Actions** tab
2. Click on the latest workflow run
3. View logs for each step

### VPS Deployment Logs

```bash
# SSH into VPS
ssh user@VPS_IP

# View application logs
cd /var/www/cortexbuild-pro/deployment
docker compose logs -f app

# View all service logs
docker compose logs -f

# Check service status
docker compose ps
```

### Health Checks

```bash
# Check application health
curl http://localhost:3000/api/auth/providers

# Run full diagnostics
cd /var/www/cortexbuild-pro
./verify-deployment.sh
```

---

## 🔄 Rollback Procedures

### Automatic Rollback

GitHub Actions will automatically rollback if:
- Health checks fail after deployment
- Database migrations fail
- Application fails to start

### Manual Rollback

```bash
# SSH into VPS
ssh user@VPS_IP

# Use rollback script
cd /var/www/cortexbuild-pro
./rollback-deployment.sh

# Or manually rollback to previous version
cd deployment
docker compose down
git checkout HEAD~1
docker compose up -d --build
```

### Rollback to Specific Version

```bash
# View available versions
docker images ghcr.io/adrianstanca1/cortexbuild-pro

# Rollback to specific tag
cd /var/www/cortexbuild-pro/deployment
docker compose down
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:v1.0.0
# Edit docker-compose.yml to use specific tag
docker compose up -d
```

---

## 🔐 Security Best Practices

### GitHub Actions Security

1. **Use Repository Secrets**
   - Never commit secrets to repository
   - Rotate SSH keys regularly
   - Use minimal permissions

2. **Environment Protection**
   - Enable required reviewers for production
   - Add deployment branch rules
   - Enable environment secrets

3. **Audit Deployments**
   - Review deployment logs
   - Monitor failed deployments
   - Set up alerts

### VPS Security

1. **SSH Key Management**
   ```bash
   # Use SSH keys only, disable password auth
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart sshd
   ```

2. **Firewall Configuration**
   ```bash
   # Ensure firewall is active
   sudo ufw status
   
   # Only allow necessary ports
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   ```

3. **Regular Updates**
   ```bash
   # Keep system updated
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   cd /var/www/cortexbuild-pro/deployment
   docker compose pull
   docker compose up -d
   ```

---

## 🐛 Troubleshooting

### Deployment Fails

**Issue:** GitHub Actions deployment fails

**Solutions:**
1. Check GitHub Actions logs for specific error
2. Verify SSH connection: `ssh -p $VPS_PORT $VPS_USER@$VPS_HOST`
3. Ensure VPS has enough resources: `free -h`, `df -h`
4. Check Docker status: `docker ps`

### SSH Connection Issues

**Issue:** Cannot connect to VPS via GitHub Actions

**Solutions:**
1. Verify VPS_SSH_KEY secret is correct
2. Ensure public key is in VPS `~/.ssh/authorized_keys`
3. Check SSH port is correct (default: 22)
4. Verify firewall allows SSH: `sudo ufw status`

### Application Not Starting

**Issue:** Application fails to start after deployment

**Solutions:**
```bash
# Check application logs
docker compose logs app

# Verify database connection
docker compose logs postgres

# Restart application
docker compose restart app

# Check environment variables
docker compose exec app printenv
```

### Database Migration Fails

**Issue:** Prisma migrations fail during deployment

**Solutions:**
```bash
# Connect to container
docker compose exec app sh

# Check migration status
npx prisma migrate status

# Try manual migration
npx prisma migrate deploy

# If needed, reset and reseed
npx prisma migrate reset
npx prisma db seed
```

---

## 📊 Deployment Metrics

### Track Deployment Success

GitHub Actions provides:
- Deployment frequency
- Success rate
- Average deployment time
- Rollback frequency

### Monitor Application Performance

```bash
# View resource usage
docker stats

# Check application response time
time curl http://localhost:3000/api/auth/providers

# Monitor database performance
docker compose exec postgres psql -U cortexbuild -c "SELECT * FROM pg_stat_activity;"
```

---

## 🔔 Notification Setup

### Slack Notifications

Add to `.github/workflows/deploy-vps.yml`:

```yaml
- name: Send Slack notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to VPS completed'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Discord Notifications

```yaml
- name: Send Discord notification
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "VPS Deployment"
```

### Email Notifications

```yaml
- name: Send email notification
  if: always()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 587
    username: ${{ secrets.MAIL_USERNAME }}
    password: ${{ secrets.MAIL_PASSWORD }}
    subject: Deployment Status - ${{ job.status }}
    to: admin@yourdomain.com
    from: github-actions@cortexbuild.com
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md)
- [Deployment Quick Reference](DEPLOYMENT_QUICK_REFERENCE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

---

## 🆘 Getting Help

1. **Check deployment logs:** GitHub Actions → Latest workflow run
2. **Review VPS logs:** `docker compose logs -f`
3. **Run diagnostics:** `./verify-deployment.sh`
4. **GitHub Issues:** https://github.com/adrianstanca1/cortexbuild-pro/issues

---

## ✅ Deployment Checklist

### Initial Setup
- [ ] VPS server provisioned and accessible
- [ ] Docker and Docker Compose installed
- [ ] Application deployed using `deploy-to-vps.sh`
- [ ] Environment variables configured in `.env`
- [ ] SSL certificate obtained (if using domain)

### GitHub Actions Setup
- [ ] VPS_SSH_KEY secret added
- [ ] VPS_HOST secret added
- [ ] VPS_USER secret added
- [ ] DEPLOYMENT_PATH variable added
- [ ] DEPLOYMENT_URL variable added
- [ ] SSH key pair generated and configured
- [ ] Test deployment successful

### Post-Deployment
- [ ] Application accessible via URL
- [ ] Health checks passing
- [ ] Database migrations successful
- [ ] SSL/HTTPS working
- [ ] Monitoring configured
- [ ] Backup system in place
- [ ] Rollback procedure tested

---

**🎉 Congratulations!** Your automated VPS deployment is now configured!

For questions or support, check the documentation or open an issue on GitHub.
