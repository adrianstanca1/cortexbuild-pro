# 🚀 CortexBuild Pro - CloudPanel Deployment Guide

**Last Updated:** January 29, 2026  
**Target:** CloudPanel-managed VPS (Ubuntu 22.04/24.04)  
**CloudPanel Version:** 2.x or later

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [CloudPanel Installation](#cloudpanel-installation)
4. [Database Setup](#database-setup)
5. [Production Site Setup](#production-site-setup)
6. [Staging Site Setup](#staging-site-setup)
7. [Node.js Application Configuration](#nodejs-application-configuration)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Environment Variables](#environment-variables)
10. [Deployment Process](#deployment-process)
11. [Backup & Restore](#backup--restore)
12. [Monitoring & Maintenance](#monitoring--maintenance)
13. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying CortexBuild Pro on a VPS managed by CloudPanel. CloudPanel provides a modern control panel for managing Node.js, PHP, and database applications with an intuitive web interface.

### Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           CloudPanel VPS (Ubuntu)           │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │  CloudPanel (Port 8443)            │   │
│  │  - Web UI Management               │   │
│  │  - SSL/Certificate Management      │   │
│  │  - Firewall Configuration          │   │
│  └────────────────────────────────────┘   │
│                                             │
│  ┌────────────────────────────────────┐   │
│  │  Nginx Reverse Proxy               │   │
│  │  - Port 80/443 (HTTP/HTTPS)       │   │
│  │  - SSL Termination                 │   │
│  └────────────────────────────────────┘   │
│                    │                        │
│  ┌─────────────────┴──────────────────┐   │
│  │                                     │   │
│  ▼                                     ▼   │
│  Production Site                  Staging  │
│  www.domain.com                   staging  │
│  (Node.js App)                    .domain  │
│  Port: 3000                       Port: 3001│
│  DB: cortexbuild_prod             DB: stage │
│  User: prod_user                  User: stg │
└─────────────────────────────────────────────┘
```

### Key Features
- ✅ **Isolated Environments:** Separate prod/staging with different ports, DBs, users
- ✅ **SSL Management:** Automatic Let's Encrypt certificate renewal
- ✅ **Process Management:** PM2 for Node.js application lifecycle
- ✅ **Database Management:** PostgreSQL with web-based management
- ✅ **Backups:** Automated database and file backups
- ✅ **Security:** Firewall, fail2ban, and secure defaults

---

## Prerequisites

### VPS Requirements
- **Operating System:** Ubuntu 22.04 LTS or 24.04 LTS
- **RAM:** Minimum 4GB (8GB recommended for prod + staging)
- **CPU:** Minimum 2 cores (4 cores recommended)
- **Storage:** Minimum 40GB SSD (100GB+ recommended)
- **Network:** Public IP address with SSH access

### Domain Requirements
- Domain name registered (e.g., `cortexbuildpro.com`)
- Access to DNS management
- Email address for SSL certificates

### Access Requirements
- Root or sudo access to VPS
- SSH client installed locally
- Basic Linux command line knowledge

### Service Accounts
- AWS account for S3 storage (or alternative)
- AbacusAI API key for AI features
- SendGrid account for emails (optional)

---

## CloudPanel Installation

### Step 1: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Install CloudPanel

CloudPanel provides an automated installer:

```bash
# Update system
apt update && apt upgrade -y

# Install CloudPanel (Ubuntu 22.04/24.04)
curl -fsSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash

# Installation takes 5-10 minutes
```

**What gets installed:**
- Nginx web server
- PHP 8.1, 8.2, 8.3
- Node.js (latest LTS)
- MariaDB/MySQL
- PostgreSQL 14+
- Let's Encrypt integration
- Firewall (UFW)
- fail2ban

### Step 3: Access CloudPanel

1. Open browser: `https://YOUR_VPS_IP:8443`
2. Accept self-signed certificate warning (temporary)
3. Create admin account:
   - **Username:** admin (or your choice)
   - **Password:** Strong password (24+ characters)
   - **Email:** Your admin email

### Step 4: Initial Configuration

**Security Settings:**
1. Navigate to **Settings** → **Security**
2. Enable **Two-Factor Authentication** (recommended)
3. Configure **IP Whitelist** for CloudPanel access (optional but recommended)

**System Updates:**
1. Navigate to **System** → **Updates**
2. Apply any pending security updates
3. Enable automatic security updates

---

## Database Setup

### Production Database

1. Navigate to **Databases** → **Add Database**
2. Configure production database:
   ```
   Database Name: cortexbuild_prod
   Database User: cortexbuild_prod_user
   Password: [Generate strong 32-char password]
   ```
3. Click **Save** - Record credentials securely
4. Grant privileges:
   ```sql
   GRANT ALL PRIVILEGES ON cortexbuild_prod.* TO 'cortexbuild_prod_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Staging Database

1. Navigate to **Databases** → **Add Database**
2. Configure staging database:
   ```
   Database Name: cortexbuild_staging
   Database User: cortexbuild_stg_user
   Password: [Generate strong 32-char password - different from prod]
   ```
3. Click **Save** - Record credentials securely

### Database Configuration Notes

**Security Best Practices:**
- Use different passwords for prod and staging
- Use strong passwords (minimum 32 characters)
- Restrict database users to localhost
- Document credentials in password manager

**Connection Strings:**
```bash
# Production
DATABASE_URL="postgresql://cortexbuild_prod_user:PASSWORD@localhost:5432/cortexbuild_prod?schema=public"

# Staging
DATABASE_URL="postgresql://cortexbuild_stg_user:PASSWORD@localhost:5432/cortexbuild_staging?schema=public"
```

---

## Production Site Setup

### Step 1: Create Site

1. Navigate to **Sites** → **Add Site**
2. Configure site:
   ```
   Site Name: CortexBuild Pro
   Domain: www.cortexbuildpro.com
   Document Root: /home/cortexbuild-prod/htdocs/cortexbuild-pro
   Site User: cortexbuild-prod
   Site User Password: [Auto-generated]
   Application: Node.js
   Node.js Version: 20 LTS
   ```
3. Click **Create**

### Step 2: Configure Domain

1. Add primary domain: `www.cortexbuildpro.com`
2. Add alias: `cortexbuildpro.com`
3. Enable **Force HTTPS**
4. Enable **WWW Redirect** (www.domain.com preferred)

### Step 3: Clone Repository

SSH into the VPS as the site user:

```bash
# Switch to site user
su - cortexbuild-prod

# Navigate to document root
cd /home/cortexbuild-prod/htdocs

# Remove default files
rm -rf cortexbuild-pro

# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/nextjs_space
```

### Step 4: Install Dependencies

```bash
# Use Node 20 LTS
nvm use 20

# Install dependencies (use legacy-peer-deps for compatibility)
npm install --legacy-peer-deps --production

# Generate Prisma client
npx prisma generate
```

### Step 5: Build Application

```bash
# Build Next.js application
NODE_ENV=production npm run build

# Verify build succeeded
ls -la .next/
```

---

## Staging Site Setup

Follow the same process as production with these differences:

### Staging Configuration
```
Site Name: CortexBuild Pro - Staging
Domain: staging.cortexbuildpro.com
Document Root: /home/cortexbuild-staging/htdocs/cortexbuild-pro
Site User: cortexbuild-staging
Application: Node.js
Node.js Version: 20 LTS
```

**Staging-Specific Notes:**
- Use subdomain: `staging.cortexbuildpro.com`
- Different database and credentials
- Can use same repository, different env file
- Lower resource allocation acceptable

---

## Node.js Application Configuration

### Step 1: Configure Application in CloudPanel

1. Navigate to **Sites** → Select your site → **Node.js**
2. Configure application:
   ```
   Application Directory: /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space
   Application Start Command: npm start
   Application Port: 3000
   Environment: production
   ```

### Step 2: Configure PM2 (Process Manager)

CloudPanel uses PM2 to manage Node.js applications. Create PM2 ecosystem file:

```bash
# Create PM2 config
cat > /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cortexbuild-prod',
    script: 'npm',
    args: 'start',
    cwd: '/home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
```

### Step 3: Configure Nginx Reverse Proxy

CloudPanel auto-generates Nginx config, but you may need to customize:

```bash
# Edit site Nginx config (via CloudPanel or directly)
# File location: /etc/nginx/sites-enabled/cortexbuildpro.com.conf
```

Add proxy configuration:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name www.cortexbuildpro.com cortexbuildpro.com;

    # SSL Configuration (managed by CloudPanel)
    ssl_certificate /etc/letsencrypt/live/www.cortexbuildpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.cortexbuildpro.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (if served separately)
    location /_next/static {
        alias /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space/.next/static;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
```

Test and reload Nginx:

```bash
nginx -t
systemctl reload nginx
```

---

## SSL/TLS Configuration

### Step 1: Configure DNS

Before requesting SSL certificates, configure DNS:

```
Type    Name    Value               TTL
A       @       YOUR_VPS_IP         3600
A       www     YOUR_VPS_IP         3600
A       staging YOUR_VPS_IP         3600
```

Wait for DNS propagation (5-30 minutes):

```bash
dig www.cortexbuildpro.com +short
dig staging.cortexbuildpro.com +short
```

### Step 2: Request SSL Certificates

In CloudPanel:

1. Navigate to **Sites** → Select site → **SSL/TLS**
2. Choose **Let's Encrypt**
3. Enter email: `admin@cortexbuildpro.com`
4. Select domains:
   - ✅ cortexbuildpro.com
   - ✅ www.cortexbuildpro.com
5. Click **Issue Certificate**
6. Enable **Force HTTPS**

Repeat for staging site with `staging.cortexbuildpro.com`

### Step 3: Verify SSL

```bash
# Check certificate
curl -I https://www.cortexbuildpro.com

# Verify SSL grade
# https://www.ssllabs.com/ssltest/analyze.html?d=www.cortexbuildpro.com
```

### Step 4: Configure Auto-Renewal

CloudPanel automatically renews certificates. Verify cron job:

```bash
crontab -l | grep certbot
# Should show: 0 0,12 * * * certbot renew --quiet
```

---

## Environment Variables

### Method 1: CloudPanel Environment Variables (Recommended)

1. Navigate to **Sites** → Select site → **Node.js** → **Environment Variables**
2. Add each variable:

**Required Variables:**

```bash
# Database
DATABASE_URL=postgresql://cortexbuild_prod_user:PASSWORD@localhost:5432/cortexbuild_prod?schema=public

# NextAuth
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]
NEXTAUTH_URL=https://www.cortexbuildpro.com

# AWS S3
AWS_REGION=us-west-2
AWS_BUCKET_NAME=your-bucket-name
AWS_FOLDER_PREFIX=production/
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# AbacusAI
ABACUSAI_API_KEY=your-api-key

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=https://www.cortexbuildpro.com
WEBSOCKET_PORT=3000

# Node Environment
NODE_ENV=production
PORT=3000
```

**Optional Variables:**

```bash
# SendGrid Email
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com
SENDGRID_FROM_NAME=CortexBuild Pro

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Domain
DOMAIN=cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com
```

3. Click **Save** after adding all variables
4. Restart application: **Actions** → **Restart**

### Method 2: .env File (Alternative)

Create `.env` file in application directory:

```bash
# As site user
cd /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space

# Copy template
cp .env.example .env

# Edit with nano or vim
nano .env

# Secure permissions
chmod 600 .env
chown cortexbuild-prod:cortexbuild-prod .env
```

**Note:** Method 1 (CloudPanel UI) is recommended for easier management and updates.

---

## Deployment Process

### Initial Deployment

1. **Database Migration:**
```bash
# As site user
cd /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

2. **Seed Database (Optional for demo data):**
```bash
# Run seed script
npm run prisma:seed

# Or manually:
npx tsx scripts/seed.ts
```

3. **Start Application:**
```bash
# Via PM2
pm2 start ecosystem.config.js
pm2 save

# Or via CloudPanel UI:
# Sites → Your Site → Node.js → Start Application
```

4. **Verify Application:**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs cortexbuild-prod --lines 50

# Test API
curl http://localhost:3000/api/auth/providers

# Test HTTPS
curl -I https://www.cortexbuildpro.com
```

### Application Updates

**Zero-Downtime Deployment Process:**

```bash
#!/bin/bash
# Save as: /home/cortexbuild-prod/deploy.sh

set -e

echo "🚀 Starting deployment..."

# Navigate to app directory
cd /home/cortexbuild-prod/htdocs/cortexbuild-pro

# Pull latest code
echo "📥 Pulling latest changes..."
git pull origin main

cd nextjs_space

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --production

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma generate
npx prisma migrate deploy

# Build application
echo "🔨 Building application..."
NODE_ENV=production npm run build

# Reload PM2
echo "🔄 Reloading application..."
pm2 reload cortexbuild-prod

# Health check
sleep 5
if curl -f http://localhost:3000/api/auth/providers > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed! Rolling back..."
    pm2 reload cortexbuild-prod
    exit 1
fi

echo "✨ Deployment complete!"
```

Make it executable:

```bash
chmod +x /home/cortexbuild-prod/deploy.sh
```

Run deployment:

```bash
./deploy.sh
```

### Rollback Procedure

```bash
#!/bin/bash
# Save as: /home/cortexbuild-prod/rollback.sh

set -e

cd /home/cortexbuild-prod/htdocs/cortexbuild-pro

# Get current commit
CURRENT=$(git rev-parse HEAD)
echo "Current commit: $CURRENT"

# Show recent commits
git log --oneline -n 10

# Prompt for commit to rollback to
read -p "Enter commit hash to rollback to: " COMMIT

# Checkout specific commit
git checkout $COMMIT

cd nextjs_space

# Rebuild
npm install --legacy-peer-deps --production
NODE_ENV=production npm run build

# Reload PM2
pm2 reload cortexbuild-prod

echo "✅ Rolled back to commit: $COMMIT"
```

---

## Backup & Restore

### Automated Daily Backups

**Database Backup Script:**

```bash
#!/bin/bash
# Save as: /home/cortexbuild-prod/backup-db.sh

BACKUP_DIR="/home/cortexbuild-prod/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cortexbuild_prod_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U cortexbuild_prod_user -d cortexbuild_prod \
    --clean --if-exists > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

echo "Backup created: $BACKUP_DIR/${BACKUP_FILE}.gz"

# Retention: Keep last 7 daily, 4 weekly, 6 monthly
# Daily backups
find $BACKUP_DIR -name "cortexbuild_prod_*.sql.gz" -type f -mtime +7 -delete

# Copy to weekly directory (first backup of week)
if [ $(date +%u) -eq 1 ]; then
    WEEKLY_DIR="$BACKUP_DIR/weekly"
    mkdir -p $WEEKLY_DIR
    cp $BACKUP_DIR/${BACKUP_FILE}.gz $WEEKLY_DIR/
    # Keep 4 weeks
    find $WEEKLY_DIR -name "*.sql.gz" -type f -mtime +28 -delete
fi

# Copy to monthly directory (first backup of month)
if [ $(date +%d) -eq 01 ]; then
    MONTHLY_DIR="$BACKUP_DIR/monthly"
    mkdir -p $MONTHLY_DIR
    cp $BACKUP_DIR/${BACKUP_FILE}.gz $MONTHLY_DIR/
    # Keep 6 months
    find $MONTHLY_DIR -name "*.sql.gz" -type f -mtime +180 -delete
fi

# Upload to S3 (optional - offsite backup)
if command -v aws &> /dev/null; then
    aws s3 cp $BACKUP_DIR/${BACKUP_FILE}.gz \
        s3://your-backup-bucket/cortexbuild-pro/database/ \
        --storage-class STANDARD_IA
    echo "Uploaded to S3"
fi

echo "Backup retention policy applied"
```

Make executable:

```bash
chmod +x /home/cortexbuild-prod/backup-db.sh
```

**Hourly Production Backups (Optional):**

```bash
#!/bin/bash
# Save as: /home/cortexbuild-prod/backup-db-hourly.sh

BACKUP_DIR="/home/cortexbuild-prod/backups/hourly"
HOUR=$(date +%H)
BACKUP_FILE="cortexbuild_prod_hour_${HOUR}.sql"

mkdir -p $BACKUP_DIR

# Overwrite hourly backup (24 hour rotation)
pg_dump -h localhost -U cortexbuild_prod_user -d cortexbuild_prod \
    --clean --if-exists | gzip > $BACKUP_DIR/${BACKUP_FILE}.gz

echo "Hourly backup created: $BACKUP_DIR/${BACKUP_FILE}.gz"
```

**Schedule Backups with Cron:**

```bash
# Edit crontab as site user
crontab -e

# Add backup schedules:

# Daily backup at 2 AM
0 2 * * * /home/cortexbuild-prod/backup-db.sh >> /home/cortexbuild-prod/logs/backup.log 2>&1

# Hourly backup (optional for production)
0 * * * * /home/cortexbuild-prod/backup-db-hourly.sh >> /home/cortexbuild-prod/logs/backup-hourly.log 2>&1
```

### Restore Procedure

**Test restore on staging FIRST before production!**

```bash
#!/bin/bash
# Save as: /home/cortexbuild-prod/restore-db.sh

if [ -z "$1" ]; then
    echo "Usage: ./restore-db.sh <backup-file.sql.gz>"
    echo "Available backups:"
    ls -lh /home/cortexbuild-prod/backups/*.sql.gz
    exit 1
fi

BACKUP_FILE=$1

# Verify backup exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will REPLACE the current database!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (type 'yes' to continue): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Stop application
pm2 stop cortexbuild-prod

# Create pre-restore backup
echo "Creating safety backup..."
SAFETY_BACKUP="/home/cortexbuild-prod/backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump -h localhost -U cortexbuild_prod_user -d cortexbuild_prod \
    --clean --if-exists | gzip > $SAFETY_BACKUP
echo "Safety backup created: $SAFETY_BACKUP"

# Restore database
echo "Restoring database..."
gunzip < $BACKUP_FILE | psql -h localhost -U cortexbuild_prod_user -d cortexbuild_prod

# Verify restore
if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
    
    # Start application
    pm2 start cortexbuild-prod
    
    # Verify application
    sleep 5
    if curl -f http://localhost:3000/api/auth/providers > /dev/null 2>&1; then
        echo "✅ Application started successfully"
    else
        echo "❌ Application health check failed!"
        echo "Check logs: pm2 logs cortexbuild-prod"
    fi
else
    echo "❌ Restore failed!"
    echo "Attempting to restore safety backup..."
    gunzip < $SAFETY_BACKUP | psql -h localhost -U cortexbuild_prod_user -d cortexbuild_prod
    pm2 start cortexbuild-prod
    exit 1
fi
```

Make executable:

```bash
chmod +x /home/cortexbuild-prod/restore-db.sh
```

**Test Restore (Staging):**

```bash
# Test on staging database first
./restore-db.sh /home/cortexbuild-prod/backups/cortexbuild_prod_20260129_020000.sql.gz
```

---

## Monitoring & Maintenance

### Application Monitoring

**PM2 Monitoring:**

```bash
# View real-time logs
pm2 logs cortexbuild-prod

# View metrics
pm2 monit

# View detailed info
pm2 info cortexbuild-prod

# List all processes
pm2 list
```

**Resource Monitoring:**

```bash
# CPU and memory usage
htop

# Disk usage
df -h
du -sh /home/cortexbuild-prod/*

# Database size
psql -U cortexbuild_prod_user -d cortexbuild_prod -c \
    "SELECT pg_size_pretty(pg_database_size('cortexbuild_prod'));"

# Active connections
psql -U cortexbuild_prod_user -d cortexbuild_prod -c \
    "SELECT count(*) FROM pg_stat_activity;"
```

### Log Management

**Application Logs:**

```bash
# PM2 logs
tail -f /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space/logs/out.log
tail -f /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space/logs/err.log

# Nginx access logs
tail -f /var/log/nginx/cortexbuildpro.com.access.log

# Nginx error logs
tail -f /var/log/nginx/cortexbuildpro.com.error.log
```

**Log Rotation:**

Create logrotate configuration:

```bash
sudo nano /etc/logrotate.d/cortexbuild
```

Add:

```
/home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0644 cortexbuild-prod cortexbuild-prod
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Health Checks

**Manual Health Check:**

```bash
#!/bin/bash
# Save as: /home/cortexbuild-prod/health-check.sh

echo "🏥 CortexBuild Pro Health Check"
echo "================================"

# Check application
echo -n "Application: "
if curl -f http://localhost:3000/api/auth/providers > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

# Check database
echo -n "Database: "
if pg_isready -h localhost -U cortexbuild_prod_user > /dev/null 2>&1; then
    echo "✅ Connected"
else
    echo "❌ Disconnected"
fi

# Check SSL certificate
echo -n "SSL Certificate: "
DAYS_LEFT=$(echo | openssl s_client -servername www.cortexbuildpro.com \
    -connect www.cortexbuildpro.com:443 2>/dev/null | openssl x509 -noout -dates | \
    grep notAfter | cut -d= -f2 | xargs -I{} date -d {} +%s)
NOW=$(date +%s)
DAYS=$((($DAYS_LEFT - $NOW) / 86400))

if [ $DAYS -gt 30 ]; then
    echo "✅ Valid ($DAYS days remaining)"
elif [ $DAYS -gt 0 ]; then
    echo "⚠️  Expiring soon ($DAYS days remaining)"
else
    echo "❌ Expired"
fi

# Check disk space
echo -n "Disk Space: "
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo "✅ $DISK_USAGE% used"
elif [ $DISK_USAGE -lt 90 ]; then
    echo "⚠️  $DISK_USAGE% used"
else
    echo "❌ $DISK_USAGE% used (critical)"
fi

# Check PM2 processes
echo -n "PM2 Process: "
if pm2 list | grep -q "cortexbuild-prod.*online"; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

echo "================================"
```

Make executable and schedule:

```bash
chmod +x /home/cortexbuild-prod/health-check.sh

# Add to crontab (every 5 minutes)
crontab -e
# Add: */5 * * * * /home/cortexbuild-prod/health-check.sh >> /home/cortexbuild-prod/logs/health.log 2>&1
```

### Automated Monitoring (Optional)

**External Monitoring Services:**
- **UptimeRobot** - Free tier monitors every 5 minutes
- **Pingdom** - Comprehensive monitoring with alerts
- **CloudPanel Monitoring** - Built-in basic monitoring

**Setup Example (UptimeRobot):**
1. Sign up at https://uptimerobot.com
2. Add monitors:
   - **HTTPS:** https://www.cortexbuildpro.com
   - **Port:** www.cortexbuildpro.com:443
   - **Keyword:** Check for specific keyword in response
3. Configure alerts (email, SMS, Slack)

---

## Troubleshooting

### Application Won't Start

**Check PM2 status:**
```bash
pm2 status
pm2 logs cortexbuild-prod --lines 100
```

**Common Issues:**

1. **Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Restart application
pm2 restart cortexbuild-prod
```

2. **Database connection failed:**
```bash
# Test database connection
psql -h localhost -U cortexbuild_prod_user -d cortexbuild_prod

# Check DATABASE_URL in environment
pm2 env cortexbuild-prod | grep DATABASE_URL

# Verify database is running
sudo systemctl status postgresql
```

3. **Build failures:**
```bash
# Clear build cache
rm -rf .next
rm -rf node_modules

# Reinstall and rebuild
npm install --legacy-peer-deps --production
npm run build
```

### SSL Certificate Issues

**Certificate not renewing:**
```bash
# Test renewal manually
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Check renewal logs
sudo cat /var/log/letsencrypt/letsencrypt.log
```

**Certificate not found:**
```bash
# List certificates
sudo certbot certificates

# Re-issue via CloudPanel UI
# Sites → Your Site → SSL/TLS → Issue Certificate
```

### Database Issues

**Connection pool exhausted:**
```bash
# Check active connections
psql -U cortexbuild_prod_user -d cortexbuild_prod -c \
    "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Kill idle connections
psql -U cortexbuild_prod_user -d cortexbuild_prod -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
     WHERE state = 'idle' AND state_change < now() - interval '5 minutes';"
```

**Database performance slow:**
```bash
# Check slow queries
psql -U cortexbuild_prod_user -d cortexbuild_prod -c \
    "SELECT pid, now() - query_start as duration, query 
     FROM pg_stat_activity WHERE state = 'active' 
     ORDER BY duration DESC LIMIT 10;"

# Analyze tables
psql -U cortexbuild_prod_user -d cortexbuild_prod -c "ANALYZE;"
```

### High Memory Usage

**Identify memory hog:**
```bash
# Check memory usage
free -h

# Top memory processes
ps aux --sort=-%mem | head -10

# Restart application to free memory
pm2 restart cortexbuild-prod
```

**Configure PM2 memory limits:**
```javascript
// In ecosystem.config.js
max_memory_restart: '1G' // Restart if memory exceeds 1GB
```

### Nginx Issues

**Test configuration:**
```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View Nginx error log
tail -f /var/log/nginx/error.log
```

**502 Bad Gateway:**
- Application not running: `pm2 list`
- Wrong port in Nginx config
- Firewall blocking connection

---

## Security Hardening

### Firewall Configuration

```bash
# Check UFW status
sudo ufw status verbose

# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8443/tcp # CloudPanel

# Enable firewall
sudo ufw enable
```

### SSH Security

```bash
# Disable password authentication (use SSH keys only)
sudo nano /etc/ssh/sshd_config

# Set:
PasswordAuthentication no
PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### fail2ban Configuration

```bash
# Check fail2ban status
sudo systemctl status fail2ban

# View bans
sudo fail2ban-client status sshd

# Unban IP (if needed)
sudo fail2ban-client set sshd unbanip <IP>
```

### Database Security

```bash
# Ensure database only listens on localhost
sudo nano /etc/postgresql/*/main/postgresql.conf

# Set:
listen_addresses = 'localhost'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Regular Security Updates

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Update Node.js packages
cd /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space
npm audit
npm audit fix

# Update Prisma
npm install @prisma/client@latest prisma@latest
```

---

## Maintenance Procedures

### Weekly Maintenance

```bash
#!/bin/bash
# Save as: /root/weekly-maintenance.sh

echo "🔧 Weekly Maintenance - $(date)"

# Update system packages
apt update && apt upgrade -y

# Clean old logs
find /var/log -type f -name "*.log" -mtime +30 -delete

# Clean old backups (handled by backup script)
echo "Backup retention managed by backup scripts"

# Restart services for good measure
systemctl restart nginx
pm2 restart all

# Run health check
su - cortexbuild-prod -c "/home/cortexbuild-prod/health-check.sh"

echo "✅ Weekly maintenance complete"
```

Schedule:

```bash
# Add to root crontab
sudo crontab -e

# Sunday at 3 AM
0 3 * * 0 /root/weekly-maintenance.sh >> /var/log/weekly-maintenance.log 2>&1
```

### Monthly Maintenance

- Review access logs for anomalies
- Check SSL certificate expiry
- Review and rotate API keys
- Update documentation
- Test disaster recovery procedures

---

## Appendix

### Useful Commands Reference

```bash
# CloudPanel
sudo clpctl system:status             # System status
sudo clpctl system:update             # Update CloudPanel

# PM2
pm2 list                              # List processes
pm2 restart cortexbuild-prod          # Restart app
pm2 logs cortexbuild-prod             # View logs
pm2 monit                             # Monitor resources

# Database
psql -U user -d database              # Connect to DB
pg_dump -U user -d database > backup.sql  # Backup
psql -U user -d database < backup.sql     # Restore

# Nginx
sudo nginx -t                         # Test config
sudo systemctl reload nginx           # Reload
tail -f /var/log/nginx/error.log      # Error log

# System
htop                                  # Resource monitor
df -h                                 # Disk usage
free -h                               # Memory usage
netstat -tulpn                        # Open ports
```

### File Locations

```
Application: /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space
Nginx Config: /etc/nginx/sites-enabled/cortexbuildpro.com.conf
SSL Certs: /etc/letsencrypt/live/www.cortexbuildpro.com/
Database: /var/lib/postgresql/*/main/
Backups: /home/cortexbuild-prod/backups/
Logs: /home/cortexbuild-prod/logs/
PM2 Config: /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space/ecosystem.config.js
```

### Support Resources

- **CloudPanel Docs:** https://www.cloudpanel.io/docs/
- **CortexBuild Docs:** https://github.com/adrianstanca1/cortexbuild-pro
- **CloudPanel Community:** https://community.cloudpanel.io/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**Last Updated:** January 29, 2026  
**Document Version:** 1.0.0  
**Maintainer:** DevOps Team
