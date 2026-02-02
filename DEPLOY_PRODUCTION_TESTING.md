# 🚀 Deploy to Production for Testing

**Status:** Ready for Production Deployment  
**Date:** February 2, 2026  
**Purpose:** Testing deployment in production environment

---

## Overview

This guide provides step-by-step instructions to deploy CortexBuild Pro to production for testing purposes. The deployment uses automated GitHub Actions workflows and Docker containers.

---

## Prerequisites

### Required GitHub Secrets

Before deploying, ensure the following secrets are configured in your GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret
```

**Required Secrets:**
- `VPS_HOST` - Your VPS server IP address or hostname
- `VPS_USER` - SSH username (e.g., root, ubuntu)
- `VPS_SSH_KEY` - Private SSH key for server access

**Optional Secrets (recommended for full functionality):**
- `VPS_PORT` - SSH port (optional, defaults to 22 if not set)
- `AWS_ACCESS_KEY_ID` - AWS S3 for file storage
- `AWS_SECRET_ACCESS_KEY` - AWS S3 secret key
- `SENDGRID_API_KEY` - Email notifications
- `GOOGLE_CLIENT_ID` - Google OAuth login
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

For detailed instructions on setting up secrets, see: [GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)

### VPS Server Requirements

- **OS:** Ubuntu 20.04+ or compatible Linux
- **RAM:** Minimum 2GB (4GB recommended)
- **CPU:** 2+ cores
- **Disk:** 20GB+ available
- **Docker:** Version 20.10+
- **Docker Compose:** V2.0+
- **Ports:** 80, 443, 22 accessible

---

## Deployment Methods

### Method 1: Automated GitHub Actions Deployment (Recommended)

This method uses GitHub Actions to automatically build and deploy to your VPS.

#### Step 1: Trigger Deployment via GitHub UI

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Deploy to VPS** workflow
4. Click **Run workflow** button
5. Select options:
   - **Environment:** production
   - **Skip tests:** false (recommended to run tests)
6. Click **Run workflow**

#### Step 2: Monitor Deployment

Watch the workflow progress in the Actions tab. The deployment includes:
- ✅ Running tests
- ✅ Building Docker image
- ✅ Pushing to GitHub Container Registry
- ✅ Deploying to VPS
- ✅ Running database migrations
- ✅ Health checks

#### Step 3: Verify Deployment

After the workflow completes successfully:

```bash
# Check application health
curl https://your-domain.com/api/health

# Or with IP
curl http://YOUR_VPS_IP:3000/api/health
```

Expected response:
```json
{"status": "ok", "timestamp": "2026-02-02T..."}
```

---

### Method 2: Trigger via GitHub CLI

If you have the GitHub CLI installed locally:

```bash
# Trigger deployment workflow
gh workflow run deploy-vps.yml \
  --field environment=production \
  --field skip_tests=false

# Monitor workflow
gh run watch

# View latest run logs
gh run view --log
```

---

### Method 3: Trigger via API

Using curl to trigger the deployment:

```bash
# Get your GitHub personal access token from:
# Settings → Developer settings → Personal access tokens

curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/adrianstanca1/cortexbuild-pro/actions/workflows/deploy-vps.yml/dispatches \
  -d '{"ref":"main","inputs":{"environment":"production","skip_tests":"false"}}'
```

---

### Method 4: Manual Docker Deployment (Advanced)

For direct deployment on your VPS without GitHub Actions:

```bash
# SSH into your VPS
ssh user@your-vps-host

# Clone or update repository
cd /var/www
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
# Or update existing: git pull origin main

# Navigate to deployment directory
cd cortexbuild-pro/deployment

# Copy and configure environment variables
cp .env.example .env
nano .env  # Edit with your configuration

# Build and start services
docker compose build --no-cache
docker compose up -d

# Run database migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Verify deployment
docker compose ps
curl http://localhost:3000/api/health
```

---

## Post-Deployment Verification

### 1. Check Services Status

```bash
# SSH into VPS
ssh user@your-vps-host

# Check Docker containers
cd /var/www/cortexbuild-pro/deployment
docker compose ps

# Expected output: All services "Up" and "healthy"
```

### 2. Verify Application Access

```bash
# Test API endpoint
curl http://localhost:3000/api/health

# Test authentication providers
curl http://localhost:3000/api/auth/providers
```

### 3. Check Logs

```bash
# View application logs
docker compose logs -f app

# View database logs
docker compose logs postgres

# View Nginx logs
docker compose logs nginx
```

### 4. Test Web Interface

1. Open browser to: `https://your-domain.com` or `http://YOUR_VPS_IP:3000`
2. Navigate to login page
3. Try creating an account (first user becomes admin)
4. Verify dashboard loads correctly

---

## Monitoring and Management

### View Real-time Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx
```

### Restart Services

```bash
# Restart application only
docker compose restart app

# Restart all services
docker compose restart

# Stop all services
docker compose down

# Start all services
docker compose up -d
```

### Database Operations

```bash
# Backup database
docker compose exec postgres pg_dump -U cortexbuild cortexbuild > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U cortexbuild cortexbuild

# Access database shell
docker compose exec postgres psql -U cortexbuild -d cortexbuild
```

---

## Rollback Procedure

If deployment fails or issues are discovered:

```bash
# SSH into VPS
ssh user@your-vps-host
cd /var/www/cortexbuild-pro

# Stop services
cd deployment
docker compose down

# Revert to previous version
git log --oneline -5  # Find previous stable commit
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose build
docker compose up -d

# Restore database if needed
./restore.sh backups/backup-YYYYMMDD-HHMMSS.sql
```

---

## Troubleshooting

### Issue: Deployment Workflow Fails

**Solution:**
1. Check GitHub Actions logs for specific error
2. Verify all required secrets are set
3. Ensure VPS is accessible via SSH
4. Check VPS has enough disk space and resources

### Issue: Container Won't Start

**Solution:**
```bash
# Check container logs
docker compose logs app

# Common fixes:
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Issue: Database Connection Errors

**Solution:**
```bash
# Verify database is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Test connection
docker compose exec postgres pg_isready -U cortexbuild
```

### Issue: 502 Bad Gateway

**Solution:**
```bash
# Wait for application to fully start (can take 90 seconds)
sleep 90

# Check app health
docker compose logs app --tail=50

# Verify app is responding
curl http://localhost:3000/api/auth/providers
```

---

## Security Checklist

Before deploying to production:

- [ ] All secrets are configured in GitHub
- [ ] NEXTAUTH_SECRET is a strong random string (32+ characters)
- [ ] Database password is secure and unique
- [ ] SSL/HTTPS is enabled (if using domain)
- [ ] Firewall is configured (only ports 80, 443, 22 open)
- [ ] SSH key authentication is used (no password authentication)
- [ ] Regular backups are scheduled
- [ ] Environment variables are not committed to git

---

## Performance Optimization

After deployment:

1. **Enable CDN** (optional) - CloudFlare or similar
2. **Configure Caching** - Already enabled in Nginx
3. **Database Tuning** - Connection pooling configured
4. **Monitor Resources** - Use `docker stats` to monitor usage
5. **Setup Monitoring** - UptimeRobot, Pingdom, or similar

---

## Support and Documentation

- **Main Documentation:** [README.md](README.md)
- **Production Deployment Guide:** [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **GitHub Secrets Setup:** [GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Security Guide:** [SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)

---

## Quick Commands Reference

```bash
# Trigger deployment from CLI
gh workflow run deploy-vps.yml --field environment=production

# Monitor deployment
gh run watch

# Check service status
docker compose ps

# View logs
docker compose logs -f

# Restart application
docker compose restart app

# Backup database
docker compose exec postgres pg_dump -U cortexbuild cortexbuild > backup.sql

# Access application
curl https://your-domain.com/api/health
```

---

## Next Steps After Successful Deployment

1. ✅ Verify all services are running
2. ✅ Create admin account (first user)
3. ✅ Configure platform settings
4. ✅ Test all major features
5. ✅ Setup monitoring and alerts
6. ✅ Configure automated backups
7. ✅ Review security settings
8. ✅ Document any custom configurations

---

**Deployment Complete!** 🎉

Your CortexBuild Pro application is now deployed and ready for testing in production.

For issues or questions, please check:
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/adrianstanca1/cortexbuild-pro/issues)
- [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
