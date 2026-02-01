# CortexBuild Pro - Final Deployment Checklist

**Date**: February 1, 2026  
**Status**: ✅ All Build Steps Complete - Ready for VPS Deployment  
**Target**: cortexbuildpro.com (72.62.132.43)

---

## ✅ Completed Steps

### 1. Local Build ✅
- [x] Dependencies installed (1,412 packages)
- [x] Prisma client generated (v6.7.0)
- [x] Next.js production build completed (57MB)
- [x] All 200+ API routes compiled successfully
- [x] Build artifacts verified

### 2. Deployment Package ✅
- [x] Deployment package created: `cortexbuild_vps_deploy.tar.gz`
- [x] Package size: 922KB (774 files)
- [x] Contains all necessary files:
  - Next.js application source
  - Docker Compose configuration
  - Dockerfile for production build
  - Environment templates
  - Deployment scripts
  - Comprehensive documentation

### 3. Documentation ✅
- [x] Deployment instructions created (DEPLOYMENT_STATUS.md)
- [x] Troubleshooting guide included
- [x] Security checklist prepared
- [x] Post-deployment procedures documented

---

## 📋 Next Steps - VPS Deployment

### Prerequisites

Before proceeding, ensure you have:
- [ ] VPS root access (SSH key or password)
- [ ] VPS IP: 72.62.132.43
- [ ] Domain DNS configured: cortexbuildpro.com → 72.62.132.43
- [ ] Required credentials ready:
  - Database password (secure, 32+ chars)
  - NextAuth secret (generate with: `openssl rand -base64 32`)
  - SSL email for Let's Encrypt
  - AWS S3 credentials (optional, for file uploads)
  - SMTP/SendGrid credentials (optional, for emails)

---

## 🚀 Deployment Process

### Step 1: Upload Deployment Package

**Option A: Using SCP**
```bash
# From your local machine where cortexbuild_vps_deploy.tar.gz exists
scp cortexbuild_vps_deploy.tar.gz root@72.62.132.43:/root/cortexbuild/
```

**Option B: Using SFTP**
```bash
sftp root@72.62.132.43
put cortexbuild_vps_deploy.tar.gz /root/cortexbuild/
exit
```

**Option C: Manual Upload**
- Use FileZilla, WinSCP, or any SFTP client
- Upload to: `/root/cortexbuild/cortexbuild_vps_deploy.tar.gz`

---

### Step 2: SSH into VPS

```bash
ssh root@72.62.132.43
```

---

### Step 3: Extract Deployment Package

```bash
# Create directory if it doesn't exist
mkdir -p /root/cortexbuild
cd /root/cortexbuild

# Extract the package
tar -xzf cortexbuild_vps_deploy.tar.gz

# Navigate to deployment directory
cd cortexbuild/deployment

# Verify extraction
ls -la
```

Expected files:
- `docker-compose.yml`
- `Dockerfile`
- `.env.example`
- Various deployment scripts

---

### Step 4: Configure Environment

```bash
# Create .env from template
cp .env.example .env

# Edit environment file
nano .env
```

**Critical Configuration (MUST be set):**

```env
# PostgreSQL Database
POSTGRES_PASSWORD=<GENERATE_SECURE_PASSWORD>  # Use: openssl rand -base64 32

# Authentication
NEXTAUTH_SECRET=<GENERATE_SECRET>  # Use: openssl rand -base64 32
NEXTAUTH_URL=https://cortexbuildpro.com  # Or http://72.62.132.43:3000 for testing

# Domain (for SSL)
DOMAIN=cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=https://cortexbuildpro.com
WEBSOCKET_PORT=3000
```

**Optional Configuration:**

```env
# AWS S3 (for file uploads)
AWS_PROFILE=hosted_storage
AWS_REGION=us-west-2
AWS_BUCKET_NAME=cortexbuild-files
AWS_FOLDER_PREFIX=uploads/

# SendGrid (for email notifications)
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com
SENDGRID_FROM_NAME=CortexBuild Pro

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# AbacusAI (for AI features)
ABACUSAI_API_KEY=your_api_key
WEB_APP_ID=your_web_app_id
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

---

### Step 5: Build Docker Image

**This step will take 5-10 minutes**

```bash
# Make sure you're in /root/cortexbuild/cortexbuild/deployment
cd /root/cortexbuild/cortexbuild/deployment

# Build the application image
docker compose build --no-cache app

# Expected output: 
# - Dependencies installation
# - Prisma client generation
# - Next.js build
# - Image creation
```

**Monitor the build:**
- Watch for any errors
- Build should complete with "Successfully built" message
- Image size will be approximately 500MB-1GB

---

### Step 6: Start Services

```bash
# Start all services (PostgreSQL, App, Nginx, Certbot)
docker compose up -d

# Check services are starting
docker compose ps

# Wait for services to be healthy (30-60 seconds)
sleep 60
```

**Verify all services are up:**
```bash
docker compose ps
```

Expected output: All services showing "Up" status
- `cortexbuild-db` (postgres)
- `cortexbuild-app` (app)
- `cortexbuild-nginx` (nginx)
- `cortexbuild-certbot` (certbot)

---

### Step 7: Initialize Database

```bash
# Run database migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Expected output: "All migrations have been successfully applied"
```

**Optional: Seed with sample data**
```bash
docker compose exec app sh -c "cd /app && npx prisma db seed"
```

---

### Step 8: Verify Deployment

**Test 1: Check services are running**
```bash
docker compose ps
```
All services should show "Up" status

**Test 2: Check application logs**
```bash
docker compose logs -f app
# Press Ctrl+C to exit
```
Look for: "Ready on http://0.0.0.0:3000" or similar

**Test 3: Test API endpoint (from VPS)**
```bash
curl http://localhost:3000/api/auth/providers
```
Expected: JSON response with authentication providers

**Test 4: Test external access**
```bash
curl http://72.62.132.43:3000/api/auth/providers
```
Expected: Same JSON response

**Test 5: Test from browser**
- Open: http://72.62.132.43:3000
- You should see the login/signup page

---

### Step 9: Configure Firewall

```bash
# Install UFW if not installed
apt-get install -y ufw

# Allow SSH (IMPORTANT - do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow application port (optional, if not using nginx proxy)
ufw allow 3000/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

### Step 10: Configure SSL/HTTPS (Optional but Recommended)

**Prerequisites:**
- Domain DNS must point to VPS IP
- Ports 80 and 443 must be open

```bash
cd /root/cortexbuild/cortexbuild/deployment

# Run SSL setup script
./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com

# If script doesn't exist, use manual method:
# Stop nginx temporarily
docker compose stop nginx

# Install certbot
apt-get install -y certbot

# Obtain certificate
certbot certonly --standalone -d cortexbuildpro.com -d www.cortexbuildpro.com

# Restart nginx
docker compose up -d nginx
```

---

### Step 11: Set Up Automated Backups

```bash
# Create backup directory
mkdir -p /root/cortexbuild/cortexbuild/deployment/backups

# Test backup script
cd /root/cortexbuild/cortexbuild/deployment
./backup.sh

# Set up automated daily backups
crontab -e

# Add this line (backup at 2 AM daily):
0 2 * * * cd /root/cortexbuild/cortexbuild/deployment && ./backup.sh

# Add backup cleanup (keep last 30 days):
0 3 * * 0 find /root/cortexbuild/cortexbuild/deployment/backups -mtime +30 -delete
```

---

### Step 12: Configure Health Monitoring

```bash
# Create health check script
cat > /usr/local/bin/cortexbuild-health.sh << 'EOF'
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/providers)
if [ $RESPONSE -ne 200 ]; then
  echo "[$(date)] Health check failed: $RESPONSE" >> /var/log/cortexbuild-health.log
  cd /root/cortexbuild/cortexbuild/deployment
  docker compose restart app
fi
EOF

# Make executable
chmod +x /usr/local/bin/cortexbuild-health.sh

# Add to crontab (check every 5 minutes)
crontab -e

# Add this line:
*/5 * * * * /usr/local/bin/cortexbuild-health.sh
```

---

## ✅ Post-Deployment Verification

### Check List

- [ ] All Docker services running (`docker compose ps`)
- [ ] Application accessible at http://72.62.132.43:3000
- [ ] API health endpoint responding: `/api/auth/providers`
- [ ] Can create user account (signup)
- [ ] Can login successfully
- [ ] Firewall configured and enabled
- [ ] SSL certificate installed (if using domain)
- [ ] Automated backups configured
- [ ] Health monitoring enabled

### Test Scenarios

1. **User Registration**
   - Go to signup page
   - Create new account
   - Verify email confirmation (if SMTP configured)
   - Login with new account

2. **Create Organization**
   - After login, create organization
   - Invite team members (test email if SMTP configured)

3. **Create Project**
   - Create a test project
   - Add tasks
   - Upload documents (test S3 if configured)

4. **Real-time Updates**
   - Open project in two browser tabs
   - Update task in one tab
   - Verify update appears in other tab (WebSocket test)

---

## 🎯 Access Points

After successful deployment:

| Access Point | URL | Purpose |
|--------------|-----|---------|
| **Main App** | https://cortexbuildpro.com | Primary application |
| **Admin Console** | https://cortexbuildpro.com/admin | Admin dashboard |
| **API Health** | https://cortexbuildpro.com/api/auth/providers | Health check |
| **Direct Access** | http://72.62.132.43:3000 | Direct IP access |

---

## 📊 Service Management

### Common Commands

```bash
# View all logs
docker compose logs -f

# View app logs only
docker compose logs -f app

# View database logs
docker compose logs -f postgres

# Restart application
docker compose restart app

# Restart all services
docker compose restart

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Check service status
docker compose ps

# Check resource usage
docker stats

# Access database shell
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

---

## 🔧 Troubleshooting

### Application Won't Start

```bash
# Check logs for errors
docker compose logs app | tail -100

# Verify environment configuration
cat .env

# Rebuild container
docker compose down
docker compose build --no-cache app
docker compose up -d
```

### Database Connection Error

```bash
# Check database is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL
cat .env | grep DATABASE_URL

# Restart database
docker compose restart postgres
```

### Port Already in Use

```bash
# Check what's using port
lsof -i :3000

# If needed, stop conflicting service
# Or change port in docker-compose.yml
```

### Out of Memory

```bash
# Check memory usage
free -h

# Add swap space (4GB)
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 🔒 Security Checklist

- [ ] Changed default passwords
- [ ] Strong NEXTAUTH_SECRET configured
- [ ] Firewall configured and enabled
- [ ] SSH key-based authentication (recommended)
- [ ] fail2ban installed (recommended)
- [ ] SSL/TLS certificates installed
- [ ] Regular backups configured
- [ ] Log rotation configured
- [ ] Monitoring enabled
- [ ] Security updates enabled

---

## 📚 Documentation References

- **Deployment Status**: `DEPLOYMENT_STATUS.md`
- **VPS Instructions**: `VPS_DEPLOYMENT_INSTRUCTIONS.md`
- **Production Guide**: `PRODUCTION_DEPLOYMENT.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **API Documentation**: `API_ENDPOINTS.md`
- **Security Guide**: `SECURITY_CHECKLIST.md`

---

## 🎉 Deployment Complete!

Once all steps are completed:

1. Access your application at https://cortexbuildpro.com
2. Create your admin account (first user becomes admin)
3. Configure organization settings
4. Invite team members
5. Start managing construction projects!

---

## 📞 Support

For issues or questions:

1. Check application logs: `docker compose logs -f`
2. Review troubleshooting guide: `TROUBLESHOOTING.md`
3. Check deployment documentation
4. Review GitHub issues

---

**Deployment Package**: `cortexbuild_vps_deploy.tar.gz` (922KB)  
**Last Updated**: February 1, 2026  
**Version**: Next.js 16.1.6, Node.js 20.x, PostgreSQL 15
