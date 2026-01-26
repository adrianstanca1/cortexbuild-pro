# 🚀 CortexBuild Pro - Complete VPS Deployment Guide

**Version:** 1.0.0  
**Last Updated:** January 26, 2026  
**Status:** ✅ Production Ready

This guide provides step-by-step instructions to deploy CortexBuild Pro on your VPS for public use.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (One Command)](#quick-start-one-command)
3. [Manual Step-by-Step Deployment](#manual-step-by-step-deployment)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [SSL/HTTPS Setup](#ssl-https-setup)
6. [Verification & Testing](#verification-testing)
7. [Management & Maintenance](#management-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 📦 Prerequisites

### VPS Requirements
- **Operating System:** Ubuntu 20.04 LTS or later (or Debian-based)
- **RAM:** Minimum 2GB (4GB recommended)
- **CPU:** Minimum 2 cores (4 cores recommended)
- **Storage:** Minimum 20GB (40GB+ recommended)
- **Network:** Public IP address with open ports 22, 80, 443

### What You'll Need
- [ ] VPS with SSH access (root or sudo user)
- [ ] Domain name (optional, but recommended for production)
- [ ] Basic command line knowledge
- [ ] 15-30 minutes for deployment

### Optional Services
- AWS S3 bucket for file uploads
- SendGrid account for email notifications
- Google OAuth credentials for social login
- AbacusAI API key for AI features

---

## 🚀 Quick Start (One Command)

For the fastest deployment, use our automated script:

### Step 1: Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
# or
ssh your_username@YOUR_VPS_IP
```

### Step 2: Run Automated Setup

```bash
# Download and run the VPS setup script
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/vps-setup.sh | bash

# Clone the repository
cd /var/www
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# Configure environment
cp .env.example .env
nano .env  # Set POSTGRES_PASSWORD and other settings

# Deploy!
./deploy-production.sh
```

**That's it!** The script will:
- ✅ Install Docker and Docker Compose
- ✅ Configure firewall rules
- ✅ Set up security (Fail2Ban)
- ✅ Build and start all services
- ✅ Run database migrations
- ✅ Configure Nginx reverse proxy

**Time to Complete:** 10-15 minutes

Your application will be available at `http://YOUR_VPS_IP:3000`

---

## 🔧 Manual Step-by-Step Deployment

If you prefer to understand each step or customize the deployment:

### Step 1: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Update System

```bash
apt update && apt upgrade -y
apt install -y curl git wget ufw
```

### Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 4: Configure Firewall

```bash
# Allow SSH (IMPORTANT: Do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### Step 5: Clone Repository

```bash
cd /var/www
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment
```

### Step 6: Configure Environment

```bash
# Create .env file from template
cp .env.example .env

# Edit configuration
nano .env
```

**Required Settings:**

```env
# Database Password (REQUIRED - generate a secure one)
POSTGRES_PASSWORD=your_secure_password_here

# NextAuth Secret (REQUIRED - generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_generated_secret_here

# Application URLs
NEXTAUTH_URL=http://YOUR_VPS_IP:3000
NEXT_PUBLIC_WEBSOCKET_URL=http://YOUR_VPS_IP:3000
```

**Generate Secure Secrets:**

```bash
# Generate database password
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32
```

### Step 7: Build and Deploy

```bash
# Build Docker images
docker compose build

# Start all services
docker compose up -d

# Wait for database to be ready (about 10 seconds)
sleep 10

# Run database migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### Step 8: Verify Deployment

```bash
# Check services are running
docker compose ps

# Expected output: All services should show "Up" status
# - cortexbuild-db (postgres)
# - cortexbuild-app (application)
# - cortexbuild-nginx (web server)
# - cortexbuild-certbot (SSL certificates)

# Check application logs
docker compose logs app

# Test the application
curl http://localhost:3000/api/auth/providers
```

---

## 🌐 Post-Deployment Configuration

### Access Your Application

Open your browser and navigate to:
```
http://YOUR_VPS_IP:3000
```

### Create Admin Account

1. Click "Sign Up" on the login page
2. Fill in your details
3. Submit the form
4. **The first user automatically becomes the platform administrator**

### Configure Platform Settings

Navigate to the Admin Console:
```
http://YOUR_VPS_IP:3000/admin
```

Here you can:
- Configure organization settings
- Set up optional services (AWS S3, SendGrid, etc.)
- Manage users and permissions
- View system health and logs

---

## 🔒 SSL/HTTPS Setup

For production deployment with a domain name:

### Prerequisites

1. Register a domain name (e.g., yourdomain.com)
2. Point DNS A records to your VPS IP:
   ```
   Type    Name              Value
   A       yourdomain.com    YOUR_VPS_IP
   A       www               YOUR_VPS_IP
   ```
3. Wait for DNS propagation (15 minutes to 24 hours)

### Verify DNS

```bash
dig yourdomain.com +short
dig www.yourdomain.com +short
```

Both should return your VPS IP address.

### Setup SSL Certificate

```bash
cd /var/www/cortexbuild-pro/deployment

# Run SSL setup script
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

This will:
- Request SSL certificates from Let's Encrypt
- Configure Nginx with HTTPS
- Set up automatic certificate renewal
- Enable HTTP to HTTPS redirect

### Update Environment for HTTPS

Edit `.env` and update these values:

```env
NEXTAUTH_URL=https://www.yourdomain.com
NEXT_PUBLIC_WEBSOCKET_URL=https://www.yourdomain.com
DOMAIN=yourdomain.com
```

Then restart the application:

```bash
docker compose restart app
```

Your application is now available at:
- `https://www.yourdomain.com`
- `https://yourdomain.com`

---

## ✅ Verification & Testing

### Test Application Health

```bash
# Test API endpoint
curl http://localhost:3000/api/auth/providers

# Expected: JSON response with authentication providers
```

### Test WebSocket Connection

1. Open the application in your browser
2. Open browser console (F12)
3. Look for: "Socket.IO client connected"

### Test Database Connection

```bash
# Access database
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Run a test query
\dt

# Exit
\q
```

### Run System Diagnostics

```bash
docker compose exec app sh -c "cd /app && npx tsx scripts/system-diagnostics.ts"
```

---

## 🔧 Management & Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx

# Last 100 lines
docker compose logs --tail=100 app
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart postgres
```

### Stop Services

```bash
# Stop all services (data is preserved)
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (⚠️ DELETES ALL DATA)
docker compose down -v
```

### Update Application

```bash
cd /var/www/cortexbuild-pro

# Pull latest changes
git pull origin main

# Rebuild and restart
cd deployment
docker compose down
docker compose up -d --build

# Run migrations if schema changed
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### Backup Database

```bash
cd /var/www/cortexbuild-pro/deployment

# Run backup script
./backup.sh

# Backups are stored in: ./backups/
```

### Restore Database

```bash
cd /var/www/cortexbuild-pro/deployment

# Run restore script with backup file
./restore.sh backups/cortexbuild_backup_2026-01-26.sql
```

### Monitor Resource Usage

```bash
# View container stats
docker stats

# View disk usage
df -h

# View Docker disk usage
docker system df
```

---

## 🆘 Troubleshooting

### Application Won't Start

**Symptoms:** Container keeps restarting or exits immediately

**Solutions:**

```bash
# Check logs for errors
docker compose logs app

# Common issues:
# 1. Database not ready - wait longer, check postgres logs
# 2. Missing environment variables - verify .env file
# 3. Port already in use - check with: netstat -tlnp | grep 3000

# Restart with clean state
docker compose down
docker compose up -d
```

### Database Connection Errors

**Symptoms:** "Connection refused" or "Cannot connect to database"

**Solutions:**

```bash
# Check if database is running
docker compose ps postgres

# Test database connection
docker compose exec postgres pg_isready -U cortexbuild

# Check database logs
docker compose logs postgres

# Verify DATABASE_URL
docker compose exec app printenv DATABASE_URL

# Restart database
docker compose restart postgres
```

### SSL Certificate Issues

**Symptoms:** HTTPS not working or certificate errors

**Solutions:**

```bash
# Check if domain resolves
dig yourdomain.com +short

# Verify DNS points to your VPS
# Both domain and www should return your IP

# Check certificate status
docker compose run --rm certbot certificates

# Manually renew certificate
docker compose run --rm certbot renew
docker compose restart nginx

# Check Nginx logs
docker compose logs nginx
```

### WebSocket Connection Fails

**Symptoms:** Real-time features not working

**Solutions:**

```bash
# Verify WebSocket URL
docker compose exec app printenv NEXT_PUBLIC_WEBSOCKET_URL

# Check if Nginx is running
docker compose ps nginx

# Check Nginx configuration
docker compose exec nginx nginx -t

# Restart Nginx
docker compose restart nginx

# Check browser console for WebSocket errors
```

### Out of Disk Space

**Symptoms:** "No space left on device" errors

**Solutions:**

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old images
docker image prune -a

# Check logs size
du -sh /var/lib/docker/containers/*/*-json.log

# Clean up old logs if needed
find /var/lib/docker/containers/ -name "*-json.log" -exec truncate -s 0 {} \;
```

### Port Already in Use

**Symptoms:** "Port is already allocated" or "Address already in use"

**Solutions:**

```bash
# Find what's using the port
netstat -tlnp | grep 3000

# Stop the conflicting process
kill <PID>

# Or change the port in docker-compose.yml
# Then restart
docker compose down
docker compose up -d
```

### Performance Issues

**Symptoms:** Slow response times or high CPU usage

**Solutions:**

```bash
# Check resource usage
docker stats

# Check system resources
htop

# Restart application
docker compose restart app

# Optimize database
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "VACUUM ANALYZE;"

# Check for long-running queries
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

---

## 🔐 Security Best Practices

### Essential Security Checklist

- [ ] **Strong Passwords:** Use generated passwords (32+ characters)
- [ ] **Firewall Enabled:** Only ports 22, 80, 443 open
- [ ] **SSH Key Authentication:** Disable password login
- [ ] **SSL/HTTPS:** Always use in production
- [ ] **Database Not Exposed:** Port 5432 only accessible internally
- [ ] **Regular Updates:** Keep system and Docker up to date
- [ ] **Automated Backups:** Schedule regular database backups
- [ ] **Monitoring:** Set up log monitoring and alerts
- [ ] **Fail2Ban:** Configure for SSH protection
- [ ] **Environment Secrets:** Never commit .env to git

### Enable SSH Key Authentication

```bash
# On your local machine, generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to VPS
ssh-copy-id your_username@YOUR_VPS_IP

# On VPS, disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### Set Up Automated Backups

```bash
# Create backup script
crontab -e

# Add line to run backup daily at 2 AM
0 2 * * * /var/www/cortexbuild-pro/deployment/backup.sh
```

---

## 📊 System Requirements Summary

### Minimum Configuration
- **OS:** Ubuntu 20.04+ or Debian 10+
- **RAM:** 2GB
- **CPU:** 2 cores
- **Storage:** 20GB
- **Network:** 100 Mbps

### Recommended Configuration
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 4GB
- **CPU:** 4 cores
- **Storage:** 40GB SSD
- **Network:** 1 Gbps

### Supported VPS Providers
- DigitalOcean (Droplet)
- AWS EC2
- Google Cloud Compute Engine
- Linode
- Vultr
- Hetzner
- Any Ubuntu/Debian-based VPS

---

## 🎯 Quick Command Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart application
docker compose restart app

# View logs
docker compose logs -f app

# Check status
docker compose ps

# Backup database
./backup.sh

# Update application
git pull && docker compose up -d --build

# Access database
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Check disk space
df -h

# Clean up Docker
docker system prune -a
```

---

## 📚 Additional Documentation

- **[README.md](README.md)** - Project overview and features
- **[PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md)** - Public deployment guide
- **[VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)** - Detailed VPS guide
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Production best practices
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - API configuration
- **[SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)** - Security guidelines
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🆘 Support

If you encounter issues:

1. **Check logs:** `docker compose logs -f`
2. **Review documentation** in the repository
3. **Run diagnostics:** `docker compose exec app sh -c "cd /app && npx tsx scripts/system-diagnostics.ts"`
4. **Check service status:** `docker compose ps`
5. **Verify configuration:** `./validate-config.sh`

---

## 🎉 Success!

Your CortexBuild Pro deployment is complete!

**Access Points:**
- Application: `http://YOUR_VPS_IP:3000` or `https://yourdomain.com`
- Admin Console: `/admin`
- API: `/api/*`

**Next Steps:**
1. Create your admin account
2. Configure platform settings
3. Add team members
4. Create your first project
5. Explore features!

---

**Deployed with ❤️ using CortexBuild Pro**

For updates and support, visit: https://github.com/adrianstanca1/cortexbuild-pro

---

**Version:** 1.0.0  
**Last Updated:** January 26, 2026
