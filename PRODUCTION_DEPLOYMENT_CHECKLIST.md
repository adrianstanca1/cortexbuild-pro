# Production Deployment Checklist

**CortexBuild Pro - Comprehensive Deployment Verification**  
**Version:** 1.0.0  
**Last Updated:** January 27, 2026

---

## Purpose

This checklist ensures all critical aspects of production deployment are verified before going live. Follow this checklist for every production deployment to maintain consistency and reliability.

---

## Pre-Deployment Checklist

### 1. Infrastructure & Environment

- [ ] **Server/VPS provisioned** with minimum specifications:
  - 2GB RAM (4GB recommended)
  - 2 CPU cores
  - 20GB disk space (50GB+ recommended)
  - Ubuntu 20.04+ or compatible Linux distribution

- [ ] **Docker installed** (version 20.10+)
  ```bash
  docker --version
  docker compose version
  ```

- [ ] **Domain configured** with DNS records:
  - A record pointing to server IP
  - AAAA record (if IPv6)
  - DNS propagation verified (use `dig` or nslookup)

- [ ] **Firewall configured** (UFW or iptables):
  - Port 80 (HTTP) - Open
  - Port 443 (HTTPS) - Open
  - Port 22 (SSH) - Open (restrict to trusted IPs if possible)
  - Port 5432 (PostgreSQL) - Closed (internal only)
  - All other ports - Closed

### 2. Security Configuration

- [ ] **Strong secrets generated** using secure random generation:
  ```bash
  # Generate NEXTAUTH_SECRET (32+ characters)
  openssl rand -base64 32
  
  # Generate POSTGRES_PASSWORD (24+ characters)
  openssl rand -base64 24
  ```

- [ ] **Environment variables configured** in `deployment/.env`:
  - DATABASE_URL with strong password
  - NEXTAUTH_SECRET (unique, 32+ chars)
  - NEXTAUTH_URL (your production domain)
  - POSTGRES_PASSWORD (strong, 16+ chars)
  - Domain and SSL email configured

- [ ] **OAuth credentials** (if using Google Sign-In):
  - Generated in Google Cloud Console
  - Authorized redirect URIs configured
  - Never committed to version control

- [ ] **AWS S3 credentials** (if using file uploads):
  - IAM user created with limited permissions
  - Bucket created with proper CORS
  - Credentials stored in .env only

- [ ] **File permissions set correctly**:
  ```bash
  chmod 600 deployment/.env
  chmod 755 deployment/*.sh
  ```

- [ ] **Verify no secrets in git history**:
  ```bash
  git log --all --full-history --source --grep="password\|secret\|key" -i
  ```

### 3. Code Quality & Security

- [ ] **Latest code pulled** from main/production branch:
  ```bash
  git pull origin main
  git status  # Should show clean working tree
  ```

- [ ] **Dependencies installed** and audited:
  ```bash
  cd nextjs_space
  npm install --legacy-peer-deps
  npm audit  # Review and address critical/high vulnerabilities
  ```

- [ ] **Security advisory reviewed**: [SECURITY_ADVISORY.md](SECURITY_ADVISORY.md)
  - Known vulnerabilities documented
  - Mitigation strategies applied
  - No exposed credentials

- [ ] **Build succeeds** without errors:
  ```bash
  npm run build
  # Should complete with 0 errors (warnings acceptable)
  ```

- [ ] **Prisma client generated**:
  ```bash
  npx prisma generate
  # Should generate client successfully
  ```

### 4. Database Preparation

- [ ] **Database backup strategy** in place:
  - Backup script tested: `./deployment/backup.sh`
  - Restore script tested: `./deployment/restore.sh`
  - Backup retention policy defined (e.g., 30 days)
  - Offsite backup location configured (S3, etc.)

- [ ] **Migration strategy** planned:
  - Migrations reviewed: `ls nextjs_space/prisma/migrations/`
  - Rollback plan prepared
  - Database backup taken before migration

### 5. SSL/TLS Configuration

- [ ] **SSL certificates** ready (choose one):
  
  **Option A: Let's Encrypt (Recommended)**
  - Domain ownership verified
  - Email configured for renewal notifications
  - Certbot configured in docker-compose.yml
  
  **Option B: Custom Certificate**
  - Certificate files placed in `deployment/ssl/`
  - Certificate chain complete
  - Private key secured (chmod 600)
  - Expiration date documented

- [ ] **HTTPS redirect** configured in nginx.conf (already done)

- [ ] **Security headers** configured in nginx.conf (already done):
  - Strict-Transport-Security
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Referrer-Policy

---

## Deployment Steps

### Step 1: Clone & Configure

```bash
# 1. Clone repository to production server
cd /var/www
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro

# 2. Navigate to deployment directory
cd deployment

# 3. Create environment file from template
cp .env.example .env

# 4. Edit environment file with production values
nano .env  # or vim .env

# 5. Verify configuration
cat .env | grep -v "^#" | grep -v "^$"  # Show non-comment lines
```

**Checklist:**
- [ ] Repository cloned successfully
- [ ] .env file created and configured
- [ ] All required variables set (no "your_" placeholders)
- [ ] Secrets are strong and unique
- [ ] Domain configured correctly

### Step 2: Build Docker Images

```bash
# Build with no cache to ensure fresh build
docker-compose build --no-cache

# Expected output:
# - Successfully built images for app, postgres, nginx
# - No errors during build process
```

**Checklist:**
- [ ] All services built successfully
- [ ] No build errors
- [ ] Images tagged correctly
- [ ] Build time < 10 minutes

### Step 3: Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Verify all containers are running
docker-compose ps

# Expected output:
# All services in "Up" state
# postgres: healthy
# app: healthy (after ~60s)
# nginx: Up
```

**Checklist:**
- [ ] All services started
- [ ] No immediate crashes
- [ ] Health checks passing (wait 90 seconds for app)
- [ ] Logs show no critical errors

### Step 4: Database Migration

```bash
# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Expected output:
# Migrations applied successfully
# Database schema up to date
```

**Checklist:**
- [ ] All migrations applied
- [ ] No migration errors
- [ ] Database schema matches code

### Step 5: Seed Database (Optional)

```bash
# Create initial admin user and demo data
docker-compose exec app npx tsx scripts/seed.ts

# Or set custom admin password
docker-compose exec app sh -c "ADMIN_PASSWORD='your-secure-password' npx tsx scripts/seed.ts"
```

**Checklist:**
- [ ] Seed script completed (if running)
- [ ] Admin user created
- [ ] Demo organization created (if applicable)
- [ ] Initial data populated

### Step 6: SSL Certificate Setup (Let's Encrypt)

**For Let's Encrypt only:**

```bash
# 1. Temporarily modify nginx to allow HTTP for verification
# (Already configured in nginx.conf)

# 2. Obtain certificate
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@domain.com \
  --agree-tos \
  --no-eff-email \
  -d your-domain.com \
  -d www.your-domain.com

# 3. Restart nginx to use certificates
docker-compose restart nginx
```

**Checklist:**
- [ ] Certificate obtained successfully
- [ ] Certificate files exist in /etc/letsencrypt/live/
- [ ] Nginx using certificates
- [ ] HTTPS accessible

---

## Post-Deployment Verification

### 1. Service Health

```bash
# Check all containers are running and healthy
docker-compose ps

# View logs for any errors
docker-compose logs -f --tail=50

# Check resource usage
docker stats --no-stream
```

**Checklist:**
- [ ] All services "Up" and "healthy"
- [ ] No error logs
- [ ] CPU usage < 50%
- [ ] Memory usage < 80%
- [ ] Disk space > 5GB free

### 2. Application Access

```bash
# Test HTTP to HTTPS redirect
curl -I http://your-domain.com
# Should return 301 redirect to HTTPS

# Test HTTPS response
curl -I https://your-domain.com
# Should return 200 OK

# Test API health endpoint
curl https://your-domain.com/api/health
# Should return {"status": "ok"} or similar

# Test authentication providers
curl https://your-domain.com/api/auth/providers
# Should return provider configuration
```

**Checklist:**
- [ ] HTTP redirects to HTTPS
- [ ] HTTPS loads without certificate errors
- [ ] Homepage accessible
- [ ] API endpoints responding
- [ ] Static assets loading

### 3. Database Connectivity

```bash
# Test database connection
docker-compose exec app sh -c "npx prisma db pull --print"

# Should show schema without errors

# Check database size
docker-compose exec postgres psql -U cortexbuild -d cortexbuild -c "\dt+"
```

**Checklist:**
- [ ] Application connects to database
- [ ] Tables created correctly
- [ ] Migrations applied
- [ ] Query performance acceptable

### 4. Real-time Features

**Test WebSocket Connection:**
1. Open browser console on your site
2. Navigate to a project page
3. Check Network tab for WebSocket connection
4. Should see successful upgrade to WebSocket
5. Status: 101 Switching Protocols

**Checklist:**
- [ ] WebSocket connection established
- [ ] Real-time updates working (if testable)
- [ ] No connection errors in console

### 5. Security Verification

```bash
# Test security headers
curl -I https://your-domain.com | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security"

# Expected output shows all security headers

# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Should show valid certificate dates
```

**Checklist:**
- [ ] All security headers present
- [ ] SSL certificate valid
- [ ] Certificate not expired
- [ ] TLS 1.2+ enabled
- [ ] Strong cipher suites

### 6. Authentication Test

**Manual Testing:**
1. Navigate to https://your-domain.com/login
2. Try to log in with invalid credentials → Should fail with error
3. Create a new account at /signup → Should succeed
4. Log in with new account → Should succeed
5. Log out → Should redirect to login
6. Protected routes → Should redirect to login when not authenticated

**Checklist:**
- [ ] Login page accessible
- [ ] Signup working
- [ ] Authentication successful
- [ ] Session persistence
- [ ] Logout working
- [ ] Protected routes secured

### 7. File Upload Test (if S3 configured)

**Manual Testing:**
1. Log in to application
2. Navigate to Documents or any upload section
3. Try uploading a file
4. Verify file appears in interface
5. Check S3 bucket for uploaded file

**Checklist:**
- [ ] Upload interface accessible
- [ ] File upload succeeds
- [ ] File stored in S3
- [ ] File retrieval working
- [ ] Proper permissions set

---

## Monitoring Setup

### 1. Log Monitoring

```bash
# Set up log rotation
cat > /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=10M
  missingok
  delaycompress
  copytruncate
}
EOF

# Test log rotation
logrotate -d /etc/logrotate.d/docker-containers
```

**Checklist:**
- [ ] Log rotation configured
- [ ] Old logs compressed
- [ ] Disk space monitored

### 2. Uptime Monitoring

**Configure external monitoring service:**
- [ ] UptimeRobot / Pingdom / StatusCake configured
- [ ] Monitor: https://your-domain.com/api/health
- [ ] Check interval: 5 minutes
- [ ] Alert configured for downtime
- [ ] Email/SMS notifications set up

### 3. Backup Automation

```bash
# Create backup cron job
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/cortexbuild-pro/deployment && ./backup.sh > /var/log/cortexbuild-backup.log 2>&1

# Test backup immediately
cd /var/www/cortexbuild-pro/deployment
./backup.sh
ls -lh backups/
```

**Checklist:**
- [ ] Backup script tested successfully
- [ ] Cron job configured
- [ ] Backup verification
- [ ] Offsite backup configured
- [ ] Restore procedure tested

### 4. SSL Certificate Renewal

```bash
# Certbot auto-renewal is configured in docker-compose.yml
# Verify it's working
docker-compose logs certbot

# Test renewal (dry run)
docker-compose run --rm certbot renew --dry-run
```

**Checklist:**
- [ ] Certbot container running
- [ ] Auto-renewal configured
- [ ] Dry-run successful
- [ ] Email notifications configured

---

## Performance Optimization

### 1. Database Tuning

```bash
# Check current database statistics
docker-compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT * FROM pg_stat_database WHERE datname='cortexbuild';"

# Monitor slow queries (if needed)
docker-compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

**Checklist:**
- [ ] Connection pool configured (in docker-compose.yml)
- [ ] Indexes reviewed
- [ ] Query performance acceptable
- [ ] No long-running queries

### 2. Caching

**Already Configured:**
- ✓ Nginx static asset caching (365 days)
- ✓ Next.js automatic code splitting
- ✓ Image optimization disabled (unoptimized: true)

**Checklist:**
- [ ] Static assets cached properly
- [ ] Browser caching headers present
- [ ] Gzip compression enabled (Nginx default)

### 3. Resource Monitoring

```bash
# Monitor resource usage
docker stats

# Expected:
# App: < 512MB RAM, < 30% CPU
# Postgres: < 256MB RAM, < 20% CPU
# Nginx: < 50MB RAM, < 5% CPU
```

**Checklist:**
- [ ] Memory usage acceptable
- [ ] CPU usage normal
- [ ] No memory leaks
- [ ] Disk I/O reasonable

---

## Troubleshooting

### Common Issues

**1. 502 Bad Gateway**
```bash
# Check if app container is running
docker-compose ps app

# Check app logs
docker-compose logs app --tail=100

# Common causes:
# - App not fully started (wait 90 seconds)
# - Database connection failed
# - Missing environment variables
```

**2. Database Connection Errors**
```bash
# Verify DATABASE_URL is correct
docker-compose exec app printenv DATABASE_URL

# Check postgres container
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT version();"
```

**3. SSL Certificate Issues**
```bash
# Check certificate files exist
ls -la /etc/letsencrypt/live/your-domain.com/

# Verify nginx configuration
docker-compose exec nginx nginx -t

# Restart nginx
docker-compose restart nginx
```

**4. WebSocket Connection Fails**
```bash
# Check Socket.IO endpoint
curl -I https://your-domain.com/api/socketio/

# Verify nginx WebSocket config
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep -A 10 "location /api/socketio"

# Check app logs for Socket.IO errors
docker-compose logs app | grep -i socket
```

---

## Rollback Procedures

### Quick Rollback

```bash
# 1. Stop current deployment
docker-compose down

# 2. Restore database from backup
./restore.sh backups/backup-[timestamp].sql

# 3. Checkout previous stable version
git checkout [previous-stable-tag]

# 4. Rebuild and restart
docker-compose build
docker-compose up -d

# 5. Verify functionality
curl https://your-domain.com/api/health
```

### Rollback Checklist
- [ ] Current state documented
- [ ] Backup verified
- [ ] Previous version identified
- [ ] Services stopped cleanly
- [ ] Database restored
- [ ] Application rolled back
- [ ] Services restarted
- [ ] Functionality verified
- [ ] Users notified (if applicable)

---

## Sign-Off

### Deployment Completed By

- **Name:** ___________________________
- **Date:** ___________________________
- **Time:** ___________________________
- **Environment:** Production
- **Version/Tag:** ___________________________

### Verification

- [ ] All pre-deployment checks completed
- [ ] All deployment steps successful
- [ ] All post-deployment verifications passed
- [ ] Monitoring configured and active
- [ ] Backup procedures tested
- [ ] Documentation updated
- [ ] Team notified of deployment

### Known Issues (if any)

Document any issues discovered during deployment that are non-blocking:

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Notes

Additional deployment notes or observations:

___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

## Quick Reference

### Essential Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx

# Restart a service
docker-compose restart app

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# Execute command in container
docker-compose exec app [command]

# Backup database
./backup.sh

# Restore database
./restore.sh backups/[backup-file]

# Update application
git pull origin main
docker-compose build
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

### Emergency Contacts

- **System Administrator:** ___________________________
- **DevOps Lead:** ___________________________
- **Application Owner:** ___________________________
- **On-Call Support:** ___________________________

---

**Document Version:** 1.0.0  
**Last Review:** January 27, 2026  
**Next Review:** Before each production deployment

---

*This checklist should be reviewed and updated with each major deployment to reflect lessons learned and new requirements.*
