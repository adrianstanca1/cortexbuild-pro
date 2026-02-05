# CortexBuild Pro - VPS Deployment Package Guide

## Overview

This guide explains how to use the VPS deployment package system to deploy CortexBuild Pro to your VPS server. The deployment package system simplifies the process of transferring and deploying the application.

## Quick Start

### Method 1: One-Command Deployment (Recommended)

The easiest way to deploy to your VPS:

```bash
./one-command-deploy.sh 'YourVPSPassword'
```

This single command will:
1. Create the deployment package
2. Upload it to your VPS
3. Extract files on the VPS
4. Start the Docker build process

### Method 2: Manual Step-by-Step

If you prefer manual control or the one-command approach fails:

#### Step 1: Create Deployment Package

```bash
./create-deployment-package.sh
```

This creates `cortexbuild_vps_deploy.tar.gz` containing all necessary files.

#### Step 2: Upload to VPS

```bash
# Using scp
scp cortexbuild_vps_deploy.tar.gz root@72.62.132.43:/root/cortexbuild/

# Or using sshpass (if installed)
sshpass -p 'YourPassword' scp cortexbuild_vps_deploy.tar.gz root@72.62.132.43:/root/cortexbuild/
```

#### Step 3: Deploy on VPS

SSH into your VPS and run:

```bash
ssh root@72.62.132.43

cd /root/cortexbuild
tar -xzf cortexbuild_vps_deploy.tar.gz
cd cortexbuild/deployment

# Build Docker images (in background)
nohup docker compose build --no-cache app > /root/docker_build.log 2>&1 &

# Monitor build progress
tail -f /root/docker_build.log
```

#### Step 4: Start Services

After build completes:

```bash
# Start all services
docker compose up -d

# Run database migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Check status
docker compose ps
```

## Deployment Scripts Reference

### create-deployment-package.sh

Creates a deployment tarball containing all necessary files.

**What it includes:**
- `deployment/` - Docker and deployment configurations
- `nextjs_space/` - Next.js application source
- Configuration files (.dockerignore, .env.template)
- Documentation (README, deployment guides)
- Deployment scripts

**What it excludes:**
- `.git/` - Git repository data
- `node_modules/` - Dependencies (installed during build)
- `.next/` - Build artifacts
- `*.log` - Log files
- `.env` - Environment files (for security)

**Usage:**
```bash
./create-deployment-package.sh
```

**Output:** `cortexbuild_vps_deploy.tar.gz`

### vps-deploy.sh

Automated deployment script to run on the VPS server.

**Features:**
- Checks prerequisites (Docker, Docker Compose)
- Extracts deployment package
- Configures environment
- Stops existing services
- Builds Docker images in background
- Creates helper scripts for completion

**Usage:**
```bash
# On VPS
cd /root/cortexbuild
./vps-deploy.sh
```

### one-command-deploy.sh

Automated end-to-end deployment from local machine to VPS.

**Requirements:**
- `sshpass` (installed automatically if needed)
- VPS password
- SSH access to VPS

**Usage:**
```bash
./one-command-deploy.sh 'YourVPSPassword'
```

**What it does:**
1. Creates deployment package locally
2. Creates deployment directory on VPS
3. Uploads package via SCP
4. Extracts and starts build on VPS

## Environment Configuration

### Before First Deployment

1. **Copy environment template:**
   ```bash
   cd deployment
   cp .env.example .env
   ```

2. **Edit .env file:**
   ```bash
   nano .env
   ```

3. **Required variables:**
   ```env
   POSTGRES_PASSWORD=your_secure_password_here
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   NEXTAUTH_URL=https://your-domain.com
   ```

4. **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database password |
| `NEXTAUTH_SECRET` | Yes | NextAuth.js secret key |
| `NEXTAUTH_URL` | Yes | Application URL |
| `AWS_ACCESS_KEY_ID` | No | AWS S3 access key |
| `AWS_SECRET_ACCESS_KEY` | No | AWS S3 secret |
| `AWS_REGION` | No | AWS region |
| `AWS_S3_BUCKET` | No | S3 bucket name |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |
| `SENDGRID_API_KEY` | No | SendGrid API key |

## Monitoring and Management

### Monitor Build Progress

```bash
# On VPS
tail -f /root/docker_build.log
```

### Check Service Status

```bash
cd /root/cortexbuild/cortexbuild/deployment
docker compose ps
```

### View Application Logs

```bash
docker compose logs -f app
```

### View Database Logs

```bash
docker compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart app only
docker compose restart app
```

### Stop Services

```bash
docker compose down
```

### Update Application

```bash
# On local machine
./one-command-deploy.sh 'YourPassword'

# Or manually
./create-deployment-package.sh
scp cortexbuild_vps_deploy.tar.gz root@72.62.132.43:/root/cortexbuild/

# On VPS
cd /root/cortexbuild
tar -xzf cortexbuild_vps_deploy.tar.gz
cd cortexbuild/deployment
docker compose down
docker compose build --no-cache app
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## Troubleshooting

### Build Fails

**Check build logs:**
```bash
cat /root/docker_build.log
```

**Common issues:**
- Out of disk space: `df -h`
- Out of memory: `free -h`
- Docker not running: `systemctl status docker`

**Solutions:**
- Clean Docker: `docker system prune -a`
- Increase swap: See VPS_DEPLOYMENT_INSTRUCTIONS.md
- Check Docker logs: `journalctl -u docker`

### Services Won't Start

**Check logs:**
```bash
docker compose logs
```

**Check environment:**
```bash
cat deployment/.env
```

**Verify database:**
```bash
docker compose exec postgres pg_isready
```

### Connection Issues

**Check firewall:**
```bash
ufw status
```

**Allow ports:**
```bash
ufw allow 3000/tcp
ufw allow 80/tcp
ufw allow 443/tcp
```

**Check if app is listening:**
```bash
netstat -tulpn | grep :3000
```

### Database Migration Fails

**Check database status:**
```bash
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "\dt"
```

**Reset and retry:**
```bash
docker compose down -v  # WARNING: Deletes data!
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## Security Best Practices

1. **Use strong passwords:**
   ```bash
   openssl rand -base64 32
   ```

2. **Configure firewall:**
   ```bash
   ufw enable
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ```

3. **Set up SSH keys:**
   ```bash
   ssh-copy-id root@72.62.132.43
   ```

4. **Enable fail2ban:**
   ```bash
   apt-get install -y fail2ban
   systemctl enable fail2ban
   ```

5. **Configure SSL:**
   ```bash
   cd deployment
   ./setup-ssl.sh your-domain.com your@email.com
   ```

6. **Regular backups:**
   ```bash
   cd deployment
   ./backup.sh
   ```

7. **Keep system updated:**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

## Advanced Configuration

### Custom Build Options

Edit `deployment/docker-compose.yml`:

```yaml
app:
  build:
    context: ..
    dockerfile: deployment/Dockerfile
    args:
      - NODE_ENV=production
      - BUILD_STANDALONE=true
```

### Resource Limits

Add to `deployment/docker-compose.yml`:

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
      reservations:
        memory: 2G
```

### Health Checks

Already configured in `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/auth/providers"]
  interval: 30s
  timeout: 15s
  retries: 5
  start_period: 90s
```

## Performance Optimization

### PostgreSQL Tuning

Already configured in `docker-compose.yml` with optimized settings for typical VPS:
- `max_connections=100`
- `shared_buffers=256MB`
- `effective_cache_size=1GB`

### Node.js Optimization

Set in `.env`:
```env
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096"
```

### Nginx Caching

Edit `deployment/nginx.conf` to add static asset caching.

## Backup and Restore

### Automated Backups

```bash
# Set up cron job
crontab -e

# Add daily backup at 2 AM
0 2 * * * /root/cortexbuild/cortexbuild/deployment/backup.sh
```

### Manual Backup

```bash
cd /root/cortexbuild/cortexbuild/deployment
./backup.sh
```

### Restore from Backup

```bash
cd /root/cortexbuild/cortexbuild/deployment
./restore.sh /path/to/backup.sql
```

## Support and Resources

- **VPS Deployment Instructions:** VPS_DEPLOYMENT_INSTRUCTIONS.md
- **Production Deployment Guide:** PRODUCTION_DEPLOYMENT.md
- **Troubleshooting Guide:** TROUBLESHOOTING.md
- **API Setup Guide:** API_SETUP_GUIDE.md

## Summary

### Quick Commands Reference

```bash
# Create package
./create-deployment-package.sh

# One-command deploy
./one-command-deploy.sh 'password'

# Manual upload
scp cortexbuild_vps_deploy.tar.gz root@72.62.132.43:/root/cortexbuild/

# Deploy on VPS
ssh root@72.62.132.43
cd /root/cortexbuild
tar -xzf cortexbuild_vps_deploy.tar.gz
cd cortexbuild/deployment
docker compose build --no-cache app
docker compose up -d
docker compose exec app npx prisma migrate deploy

# Check status
docker compose ps
docker compose logs -f app

# Access application
http://72.62.132.43:3000
```

---

**Last Updated:** February 1, 2026  
**Version:** 1.0.0
