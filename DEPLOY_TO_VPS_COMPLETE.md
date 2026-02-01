# 🚀 VPS Deployment Guide - Complete Step-by-Step Instructions

**Status:** ✅ Ready for Production Deployment  
**Last Updated:** February 1, 2026  
**Branch:** copilot/build-and-deploy-platform-vps

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Deployment (Automated)](#quick-deployment-automated)
3. [Manual Deployment (Step-by-Step)](#manual-deployment-step-by-step)
4. [Environment Configuration](#environment-configuration)
5. [Post-Deployment Setup](#post-deployment-setup)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### VPS Server Requirements

- **Operating System:** 
  - **Automated deployment:** Ubuntu 20.04+ / Debian 11+ (apt-based systems)
  - **Manual deployment:** Also supports CentOS 8+ / RHEL 8+ (with manual package installation)
- **RAM:** Minimum 2GB, Recommended 4GB+
- **CPU:** Minimum 2 cores, Recommended 4 cores+
- **Disk Space:** Minimum 20GB available
- **Network:** Public IP address and open ports 80, 443, 3000

### Software Requirements

The automated deployment script (`deploy-to-vps.sh`) will install these if not present on **Debian/Ubuntu systems**:
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.x+

**Note:** For CentOS/RHEL systems, install these prerequisites manually before using the deployment scripts.

### Domain Requirements (Optional but Recommended)

- Domain name pointing to your VPS IP address
- DNS A record: `yourdomain.com` → `YOUR_VPS_IP`
- DNS A record: `www.yourdomain.com` → `YOUR_VPS_IP`

---

## 🚀 Quick Deployment (Automated)

### Option 1: One-Command Deployment

The fastest way to deploy CortexBuild Pro to your VPS:

**⚠️ Note:** This automated script is designed for Ubuntu 20.04+/Debian 11+ systems. For CentOS/RHEL, use the manual deployment method below.

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Run the automated deployment script
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
```

**What it does:**
1. ✅ Installs Docker, Docker Compose, and Git
2. ✅ Configures firewall (UFW)
3. ✅ Clones the repository
4. ✅ Generates secure credentials
5. ✅ Creates environment configuration
6. ✅ Builds and starts all services
7. ✅ Runs database migrations

**Time:** ~10-15 minutes

### Option 2: Deployment Preparation + Deploy

If you want more control, prepare first, then deploy:

```bash
# On your local machine
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro

# Run preparation script (validates everything)
./prepare-vps-deployment.sh

# Review the generated deployment summary
cat DEPLOYMENT_SUMMARY.md

# Then deploy on VPS using manual steps below
```

---

## 📖 Manual Deployment (Step-by-Step)

### Step 1: Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Install Prerequisites

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Install Git
apt-get install -y git

# Verify installations
docker --version
docker compose version
git --version
```

### Step 3: Configure Firewall

```bash
# Install UFW (if not installed)
apt-get install -y ufw

# Allow necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 3000/tcp # Application

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### Step 4: Clone Repository

```bash
# Create directory
mkdir -p /var/www
cd /var/www

# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro

# Checkout the deployment branch
git checkout copilot/build-and-deploy-platform-vps
```

### Step 5: Configure Environment

```bash
# Navigate to deployment directory
cd deployment

# Copy environment template
cp .env.example .env

# Generate secure credentials
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Edit environment file
nano .env
```

**Required Changes in `.env`:**

```env
# Database (set a strong password)
POSTGRES_PASSWORD=YOUR_GENERATED_PASSWORD_HERE

# Authentication (use generated secret)
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_HERE
NEXTAUTH_URL=http://YOUR_VPS_IP:3000  # or https://yourdomain.com

# Domain (if you have one)
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com
```

**Save the credentials securely!**

### Step 6: Build and Deploy

```bash
# Ensure you're in the deployment directory
cd /var/www/cortexbuild-pro/deployment

# Build the application
docker compose build --no-cache app

# Start all services
docker compose up -d

# Check service status
docker compose ps
```

### Step 7: Initialize Database

```bash
# Wait for database to be ready (check logs)
docker compose logs -f postgres
# Press Ctrl+C when you see "database system is ready to accept connections"

# Run database migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# (Optional) Seed database with sample data
docker compose exec app sh -c "cd /app && npx prisma db seed"
```

### Step 8: Verify Deployment

```bash
# Check all services are running
docker compose ps

# Check application logs
docker compose logs -f app

# Test API health endpoint
curl http://localhost:3000/api/auth/providers
```

**Expected Response:**
```json
{
  "credentials": {...},
  "google": {...}
}
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Authentication secret | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | `https://yourdomain.com` or `http://IP:3000` |

### Optional Environment Variables

| Variable | Description | When to Use |
|----------|-------------|-------------|
| `AWS_*` | AWS S3 credentials | For file uploads/storage |
| `SENDGRID_API_KEY` | Email service API key | For email notifications |
| `GOOGLE_CLIENT_ID` | Google OAuth credentials | For Google sign-in |
| `ABACUSAI_API_KEY` | AI service credentials | For AI features |

### Generating Secure Credentials

```bash
# Generate database password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

# Generate NextAuth secret
openssl rand -base64 32

# Generate any secure token
head -c 32 /dev/urandom | base64
```

---

## 🔐 SSL Certificate Setup

### Automatic SSL with Let's Encrypt

```bash
cd /var/www/cortexbuild-pro/deployment

# Run SSL setup script
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

**Prerequisites:**
- Domain DNS must be pointing to your VPS IP
- Ports 80 and 443 must be open
- Valid email address for certificate notifications

### Manual SSL Setup

1. Stop Nginx temporarily:
   ```bash
   docker compose stop nginx
   ```

2. Install Certbot:
   ```bash
   apt-get install -y certbot
   ```

3. Obtain certificate:
   ```bash
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

4. Update Nginx configuration to use certificates

5. Restart Nginx:
   ```bash
   docker compose up -d nginx
   ```

---

## 📊 Monitoring & Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Application only
docker compose logs -f app

# Database only
docker compose logs -f postgres

# Last 100 lines
docker compose logs --tail=100
```

### Service Management

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart app

# Stop all services
docker compose down

# Start all services
docker compose up -d
```

### Database Backup

```bash
# Manual backup
cd /var/www/cortexbuild-pro/deployment
./backup.sh

# The backup will be saved to ./backups/ directory
```

### Automated Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/cortexbuild-pro/deployment && ./backup.sh

# Add weekly cleanup of old backups (keep last 30 days)
0 3 * * 0 find /var/www/cortexbuild-pro/deployment/backups -mtime +30 -delete
```

### Database Restore

```bash
cd /var/www/cortexbuild-pro/deployment
./restore.sh /path/to/backup-file.sql
```

### Health Monitoring

```bash
# Create health check script
cat > /usr/local/bin/cortexbuild-health.sh << 'EOF'
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/providers)
if [ $RESPONSE -ne 200 ]; then
  echo "Health check failed: $RESPONSE"
  cd /var/www/cortexbuild-pro/deployment
  docker compose restart app
fi
EOF

chmod +x /usr/local/bin/cortexbuild-health.sh

# Add to crontab (check every 5 minutes)
*/5 * * * * /usr/local/bin/cortexbuild-health.sh
```

### System Resource Monitoring

```bash
# Check Docker stats
docker stats

# Check disk usage
df -h

# Check memory usage
free -h

# Check container status
docker compose ps
```

---

## 🐛 Troubleshooting

### Issue: Application won't start

**Solution:**
```bash
# Check logs
docker compose logs app

# Check environment variables
cat deployment/.env

# Rebuild container
docker compose down
docker compose build --no-cache app
docker compose up -d
```

### Issue: Database connection error

**Solution:**
```bash
# Check database is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL in .env
cat deployment/.env | grep DATABASE_URL

# Restart database
docker compose restart postgres
```

### Issue: Port already in use

**Solution:**
```bash
# Check what's using port 3000
lsof -i :3000

# If it's another service, stop it or change the port in docker-compose.yml
# Then restart
docker compose down
docker compose up -d
```

### Issue: Out of memory

**Solution:**
```bash
# Check memory usage
free -h

# Add swap space
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Issue: Migration failed

**Solution:**
```bash
# Check database is accessible
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Try running migrations again
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# If still failing, check migration logs
docker compose logs app | grep -i migrate
```

### Issue: Can't access application

**Solution:**
```bash
# Check all services are running
docker compose ps

# Check firewall
ufw status

# Check if port 3000 is accessible
curl http://localhost:3000/api/auth/providers

# Check from external
curl http://YOUR_VPS_IP:3000/api/auth/providers
```

---

## 🔄 Update Application

### Pull Latest Changes

```bash
cd /var/www/cortexbuild-pro

# Pull latest code
git pull origin copilot/build-and-deploy-platform-vps

# Rebuild and restart
cd deployment
docker compose down
docker compose build --no-cache app
docker compose up -d

# Run any new migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

---

## 🎯 Access Your Application

After successful deployment, access your application at:

- **Main Application:** `http://YOUR_VPS_IP:3000` or `https://yourdomain.com`
- **Admin Console:** `http://YOUR_VPS_IP:3000/admin`
- **API Health:** `http://YOUR_VPS_IP:3000/api/auth/providers`

### First-Time Setup

1. Open the application in your browser
2. Click **"Sign Up"** to create your first account
3. The first user automatically becomes the platform administrator
4. Navigate to **Admin Console** to configure settings
5. Create organizations and invite team members

---

## 📚 Additional Resources

- **[VPS_DEPLOYMENT_INSTRUCTIONS.md](VPS_DEPLOYMENT_INSTRUCTIONS.md)** - Detailed deployment instructions
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Production deployment guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - API documentation
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Security best practices

---

## 🛡️ Security Checklist

Before going live, ensure you have:

- [ ] Changed all default passwords
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configured firewall properly
- [ ] Enabled SSL/TLS certificates
- [ ] Set up automated backups
- [ ] Configured log rotation
- [ ] Restricted SSH access (key-based auth)
- [ ] Enabled fail2ban for SSH protection
- [ ] Reviewed all environment variables
- [ ] Tested backup and restore procedures

---

## 💬 Support

For issues, questions, or contributions:

- **GitHub Issues:** [github.com/adrianstanca1/cortexbuild-pro/issues](https://github.com/adrianstanca1/cortexbuild-pro/issues)
- **Documentation:** Check the guides in the repository
- **Logs:** Always check `docker compose logs` for error details

---

**🎉 Congratulations! Your CortexBuild Pro platform is now deployed and ready to use!**
