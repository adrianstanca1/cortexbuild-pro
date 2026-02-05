# 🚀 CortexBuild Pro - Production Deployment Guide

**Last Updated:** January 25, 2026  
**Status:** ✅ **PRODUCTION READY**

## Table of Contents
1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Deployment Methods](#deployment-methods)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Docker Deployment](#docker-deployment)
7. [VPS Deployment](#vps-deployment)
8. [Post-Deployment](#post-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

For rapid deployment to a VPS with Docker:

```bash
# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro

# Configure environment
cd deployment
cp .env.example .env
nano .env  # Edit with your configuration

# Deploy
docker-compose up -d

# Run migrations
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Seed database (optional)
docker-compose exec app sh -c "cd /app && npx prisma db seed"
```

---

## Prerequisites

### System Requirements
- **OS:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM:** Minimum 2GB, Recommended 4GB+
- **CPU:** Minimum 2 cores, Recommended 4 cores+
- **Disk:** Minimum 20GB available
- **Docker:** Version 20.10+
- **Docker Compose:** Version 2.0+

### Required Services
- PostgreSQL 14+ (or Docker container)
- Node.js 20 LTS (if not using Docker)
- Nginx (for reverse proxy)
- SSL Certificate (Let's Encrypt recommended)

### Optional Services
- AWS S3 (for file storage)
- Email Service (for notifications)
- Monitoring tools (Prometheus, Grafana)

---

## Deployment Methods

### Method 1: Docker Deployment (Recommended)

**Advantages:**
- Isolated environment
- Easy rollback
- Consistent across environments
- Simplified dependency management

**Steps:** See [Docker Deployment](#docker-deployment) section

### Method 2: Direct VPS Deployment

**Advantages:**
- Full control over environment
- Better performance (no container overhead)
- Easier debugging

**Steps:** See [VPS Deployment](#vps-deployment) section

### Method 3: Control Panel Deployment (CloudPanel/Hestia)

**Advantages:**
- GUI management
- Built-in SSL management
- Easier for non-technical users

**Steps:** See separate control panel guides

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the deployment directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/cortexbuild?schema=public"

# NextAuth Configuration (REQUIRED)
NEXTAUTH_SECRET="your-strong-random-secret-key-minimum-32-characters"
NEXTAUTH_URL="https://yourdomain.com"

# Node Environment
NODE_ENV="production"
```

### Optional Environment Variables

```bash
# Google OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AWS S3 (for file uploads)
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="cortexbuild/"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# Email Service
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
SMTP_FROM="noreply@yourdomain.com"

# AI Features (Optional)
ABACUSAI_API_KEY="your-abacus-api-key"
```

### Generating Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

### PostgreSQL Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE cortexbuild;
CREATE USER cortexbuild_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cortexbuild TO cortexbuild_user;
\q
```

**⚠️ SECURITY WARNING:** Replace `'your_secure_password'` with a strong, unique password. Never use example passwords in production!

Generate a secure password:
```bash
openssl rand -base64 32
# Or use a password manager to generate a 32+ character password
```

### Connection String Format

```
postgresql://username:password@host:port/database?schema=public
```

Example:
```
postgresql://cortexbuild_user:your_password@localhost:5432/cortexbuild?schema=public
```

---

## Docker Deployment

### 1. Prepare Configuration

```bash
cd deployment
cp .env.example .env
nano .env  # Configure your environment variables
```

### 2. Review Docker Compose

The `docker-compose.yml` includes:
- **app**: Next.js application (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **nginx**: Reverse proxy with SSL (ports 80, 443)

### 3. Build and Start Services

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Run Database Migrations

```bash
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### 5. Seed Initial Data (Optional)

```bash
docker-compose exec app sh -c "cd /app && npx prisma db seed"
```

### 6. Verify Deployment

```bash
# Verify deployment
docker compose ps        # Docker Compose V2 (current)
# OR
docker-compose ps        # Docker Compose V1 (legacy)

# Test application
curl http://localhost:3000/api/health
```

---

## VPS Deployment

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### 2. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/nextjs_space

# Install dependencies
npm install --legacy-peer-deps

# Copy and configure environment
cp .env.example .env
nano .env  # Configure your settings

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build
```

### 3. Start with PM2

```bash
# Start application
pm2 start npm --name "cortexbuild-pro" -- start

# Setup auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs cortexbuild-pro
```

### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/cortexbuild-pro
```

Add configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/cortexbuild-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
```

---

## Post-Deployment

### 1. Create Admin User

Access your application and sign up with the first user, which will become the platform admin.

### 2. Configure Platform Settings

1. Login as admin
2. Navigate to `/admin/platform-settings`
3. Configure:
   - Organization settings
   - Email templates
   - Feature flags
   - API settings

### 3. Setup Monitoring

```bash
# Monitor with PM2 (if using direct deployment)
pm2 monit

# Monitor Docker containers
docker-compose logs -f app

# Check system resources
htop
```

### 4. Configure Backups

Create backup script:

```bash
#!/bin/bash
# /root/backup-cortexbuild.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup database
docker-compose exec -T postgres pg_dump -U cortexbuild_user cortexbuild > $BACKUP_DIR/db_$DATE.sql

# Backup uploads (if using local storage)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /path/to/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Setup cron:

```bash
crontab -e
# Add: 0 2 * * * /root/backup-cortexbuild.sh
```

---

## Monitoring & Maintenance

### Health Checks

The application exposes health check endpoints:

- `/api/health` - Basic health check
- `/api/admin/system-health` - Detailed system health (admin only)

### Log Management

```bash
# Docker logs
docker-compose logs -f app
docker-compose logs --tail=100 app

# PM2 logs
pm2 logs cortexbuild-pro
pm2 logs --lines 100

# System logs
journalctl -u nginx -f
```

### Database Maintenance

```bash
# Backup database
docker-compose exec postgres pg_dump -U cortexbuild_user cortexbuild > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U cortexbuild_user cortexbuild

# Vacuum database (performance)
docker-compose exec postgres psql -U cortexbuild_user -d cortexbuild -c "VACUUM ANALYZE;"
```

### Updates and Upgrades

```bash
# Pull latest changes
git pull origin main

# Rebuild (Docker)
docker-compose down
docker-compose build
docker-compose up -d

# Or rebuild (Direct deployment)
npm install --legacy-peer-deps
npx prisma migrate deploy
npm run build
pm2 restart cortexbuild-pro
```

---

## Troubleshooting

### Application Won't Start

1. **Check environment variables:**
   ```bash
   docker-compose exec app printenv | grep -E 'DATABASE_URL|NEXTAUTH'
   ```

2. **Check database connection:**
   ```bash
   docker-compose exec postgres pg_isready
   ```

3. **Check logs:**
   ```bash
   docker-compose logs app
   ```

### Database Connection Errors

1. **Verify DATABASE_URL format**
2. **Check PostgreSQL is running:**
   ```bash
   docker-compose ps postgres
   ```
3. **Test connection:**
   ```bash
   docker-compose exec postgres psql -U cortexbuild_user cortexbuild
   ```

### Build Failures

1. **Clear cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

### Performance Issues

1. **Check resource usage:**
   ```bash
   docker stats
   # or
   htop
   ```

2. **Optimize database:**
   ```bash
   docker-compose exec postgres psql -U cortexbuild_user -d cortexbuild -c "VACUUM ANALYZE;"
   ```

3. **Restart services:**
   ```bash
   docker-compose restart
   ```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

---

## Security Checklist

- [ ] Strong, unique NEXTAUTH_SECRET (32+ characters)
- [ ] Secure database password
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] Regular backups scheduled
- [ ] Environment variables secured (not in git)
- [ ] Database not exposed to internet
- [ ] Regular security updates applied
- [ ] Monitor logs for suspicious activity

---

## Support and Documentation

- **Main README:** `/README.md`
- **API Documentation:** `/API_SETUP_GUIDE.md`
- **Code Structure:** `/CODE_STRUCTURE.md`
- **Security Guide:** `/SECURITY_COMPLIANCE.md`
- **Performance Guide:** `/PERFORMANCE_OPTIMIZATIONS.md`

---

## Rollback Procedure

If deployment fails:

```bash
# Docker deployment
docker-compose down
git checkout <previous-stable-commit>
docker-compose up -d

# Direct deployment
pm2 stop cortexbuild-pro
git checkout <previous-stable-commit>
npm install --legacy-peer-deps
npm run build
pm2 restart cortexbuild-pro
```

---

## Next Steps

1. ✅ Review this deployment guide
2. ✅ Configure environment variables
3. ✅ Setup database
4. ✅ Deploy application
5. ✅ Run migrations
6. ✅ Create admin user
7. ✅ Configure platform settings
8. ✅ Setup monitoring
9. ✅ Configure backups
10. ✅ Test thoroughly

---

**Deployment Complete!** 🎉

Your CortexBuild Pro application is now running in production.

For support, visit: https://github.com/adrianstanca1/cortexbuild-pro/issues
