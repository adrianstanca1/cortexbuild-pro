# CortexBuild Pro - Production Deployment Guide

Complete guide for deploying CortexBuild Pro to production and maintaining the VPS environment.

## 📋 Overview

This guide covers the complete production deployment workflow:
1. Committing all changes
2. Rebuilding in production mode
3. Deploying to VPS
4. Cleaning repositories and artifacts

## 🚀 Quick Start

### One-Command Production Deployment

The simplest way to deploy to production:

```bash
cd /root/cortexbuild-pro/deployment
./production-deploy.sh
```

This single command handles everything:
- ✅ Commits all pending changes
- ✅ Rebuilds application with fresh production build (no cache)
- ✅ Deploys to VPS with database migrations
- ✅ Cleans up Docker and Git repositories
- ✅ Verifies deployment health

## 📖 Detailed Workflow

### Step 1: Commit All Changes

The script automatically commits any pending changes:

```bash
# Manual alternative:
git add .
git commit -m "Production deployment: $(date +'%Y-%m-%d %H:%M:%S')"
```

**What happens:**
- Checks for uncommitted changes
- Stages all modified files
- Commits with timestamp
- Logs the action

### Step 2: Rebuild for Production

Fresh production build with no cache:

```bash
# Manual alternative:
cd deployment
docker compose down
docker compose build --no-cache app
```

**What happens:**
- Stops existing containers
- Cleans .next and node_modules cache
- Builds fresh Docker images without cache
- Ensures latest code and dependencies

**Build process:**
1. Base image: Node 20 Alpine
2. Install dependencies (frozen lockfile)
3. Generate Prisma Client
4. Build Next.js application
5. Create production image with standalone output

### Step 3: Deploy to VPS

Starts containers and runs migrations:

```bash
# Manual alternative:
docker compose up -d
sleep 15
docker compose exec -T app npx prisma migrate deploy
```

**What happens:**
- Starts all services in production mode
- Waits for database to be ready
- Runs Prisma migrations
- Verifies container status

**Services started:**
- PostgreSQL database (port 5433)
- Next.js application (port 3000)

### Step 4: Clean Repositories

Comprehensive cleanup of artifacts:

```bash
# Manual alternative:
./cleanup-repos.sh
```

**What gets cleaned:**
- Docker stopped containers
- Docker dangling images
- Docker build cache
- Git repository optimization
- Next.js build cache
- node_modules cache
- Old logs (7+ days)
- Temporary files

### Step 5: Health Check

Automatic verification:

```bash
# Manual alternative:
curl -f http://localhost:3000/
docker compose exec -T app npx prisma db pull --print
```

**Verifies:**
- Application responding on port 3000
- Database connection working
- Services healthy

## 🔧 Advanced Usage

### Repository Cleanup Only

Clean up without full deployment:

```bash
cd deployment
./cleanup-repos.sh
```

**Standard cleanup:**
```bash
./cleanup-repos.sh
```
- Safe for production
- Removes only unused artifacts
- Keeps all data and active images

**Aggressive cleanup:**
```bash
./cleanup-repos.sh --aggressive
```
- ⚠️ Use with caution
- Removes all unused images
- Removes unused volumes
- Maximum disk space recovery

### Manual Production Build

Build without full deployment:

```bash
cd deployment
docker compose build --no-cache app
```

### Verify Deployment

Check deployment status:

```bash
# Container status
docker compose ps

# Application logs
docker compose logs -f app

# Database logs
docker compose logs -f db

# Health check
./health-check.sh
```

## 📊 Monitoring Production

### Real-time Logs

```bash
# All services
docker compose logs -f

# Application only
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app
```

### Container Status

```bash
# Quick status
docker compose ps

# Detailed info
docker ps -a

# Resource usage
docker stats
```

### Database Operations

```bash
# Connect to database
docker compose exec db psql -U cortexbuild -d cortexbuild

# Run migrations
docker compose exec app npx prisma migrate deploy

# Open Prisma Studio
docker compose exec app npx prisma studio
```

### Disk Space Monitoring

```bash
# Docker disk usage
docker system df

# System disk usage
df -h

# Application directory size
du -sh /root/cortexbuild-pro
```

## 🔄 Deployment Scenarios

### Scenario 1: Regular Update

Deploy latest code changes:

```bash
cd /root/cortexbuild-pro
git pull origin main
cd deployment
./production-deploy.sh
```

### Scenario 2: Hot Fix

Quick fix without full cleanup:

```bash
cd /root/cortexbuild-pro
# Make your fixes
git add .
git commit -m "Hot fix: description"
cd deployment
docker compose build --no-cache app
docker compose up -d app
```

### Scenario 3: Major Version Upgrade

Full cleanup and fresh start:

```bash
cd /root/cortexbuild-pro
git pull origin main
cd deployment
./production-deploy.sh
./cleanup-repos.sh --aggressive
```

### Scenario 4: Emergency Rollback

Rollback to previous version:

```bash
cd deployment
./rollback.sh
```

## 🛡️ Best Practices

### Before Deployment

1. **Backup Database**
   ```bash
   cd deployment
   ./backup.sh
   ```

2. **Review Changes**
   ```bash
   git log --oneline -10
   git diff origin/main
   ```

3. **Check Disk Space**
   ```bash
   df -h
   docker system df
   ```

### During Deployment

1. **Monitor Logs**
   - Keep logs open in separate terminal
   - Watch for errors or warnings
   - Verify services start correctly

2. **Verify Health**
   - Wait for containers to be healthy
   - Check application responds
   - Test critical functionality

### After Deployment

1. **Verify Application**
   ```bash
   curl http://localhost:3000/
   curl http://localhost:3000/api/health
   ```

2. **Check Logs**
   ```bash
   docker compose logs --tail=50
   ```

3. **Run Health Check**
   ```bash
   ./health-check.sh
   ```

4. **Clean Up** (if not done automatically)
   ```bash
   ./cleanup-repos.sh
   ```

## 📝 Deployment Checklist

Before deploying to production:

- [ ] Latest code pulled from repository
- [ ] Database backup created
- [ ] Environment variables verified
- [ ] Disk space sufficient (20GB+ free)
- [ ] All tests passing
- [ ] Documentation updated

During deployment:

- [ ] Deployment script completed successfully
- [ ] No errors in logs
- [ ] All containers healthy
- [ ] Application responding
- [ ] Database accessible

After deployment:

- [ ] Health check passed
- [ ] Critical features tested
- [ ] Logs reviewed
- [ ] Backup verified
- [ ] Cleanup completed

## 🔐 Security Considerations

1. **Environment Variables**
   - Use strong passwords
   - Rotate secrets regularly
   - Never commit .env files

2. **Database Security**
   - Regular backups
   - Secure passwords
   - Limited access

3. **Docker Security**
   - Keep images updated
   - Remove unused containers
   - Monitor resource usage

4. **System Security**
   - Enable firewall (UFW)
   - Regular system updates
   - SSL/HTTPS enabled

## 🚨 Troubleshooting

### Deployment Fails

**Check logs:**
```bash
tail -f deployment/production-deploy.log
```

**Common issues:**
- Out of disk space → Run cleanup script
- Port already in use → Stop conflicting service
- Build fails → Check Docker/Node versions

### Application Won't Start

**Check container status:**
```bash
docker compose ps
docker compose logs app
```

**Common fixes:**
```bash
# Restart container
docker compose restart app

# Full restart
docker compose down
docker compose up -d

# Check environment
docker compose exec app env | grep DATABASE
```

### Database Connection Issues

**Verify database:**
```bash
docker compose logs db
docker compose exec db psql -U cortexbuild -d cortexbuild
```

**Common fixes:**
```bash
# Wait for database to be ready
sleep 30

# Restart database
docker compose restart db

# Check connection string
docker compose exec app env | grep DATABASE_URL
```

### Out of Disk Space

**Clean up aggressively:**
```bash
./cleanup-repos.sh --aggressive
docker system prune -af --volumes
```

**Check space:**
```bash
df -h
docker system df
du -sh /root/cortexbuild-pro
```

## 📞 Support

For deployment issues:

1. Check logs: `docker compose logs -f`
2. Run health check: `./health-check.sh`
3. Review deployment log: `cat deployment/production-deploy.log`
4. Try rollback: `./rollback.sh`

## 📚 Related Documentation

- [README.md](README.md) - Complete deployment guide
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [CLOUDPANEL-GUIDE.md](CLOUDPANEL-GUIDE.md) - CloudPanel deployment

## 🎯 Summary

The production deployment workflow provides:

✅ **Automated** - One command deploys everything
✅ **Safe** - Automatic backups and rollback support
✅ **Clean** - Removes old artifacts and optimizes space
✅ **Verified** - Health checks ensure deployment success
✅ **Logged** - Comprehensive logging for troubleshooting

Use `./production-deploy.sh` for complete confidence in your production deployments.
