# CortexBuild Pro - Complete VPS Deployment Guide

## 🎯 Overview

This guide provides complete instructions for deploying CortexBuild Pro to your VPS server at **72.62.132.43** using Docker and Docker Manager.

**Deployment Method:** Automated Docker deployment with production-ready configuration

---

## 📋 Prerequisites

### VPS Server Requirements
- **Server IP:** 72.62.132.43
- **OS:** Ubuntu 20.04+ or Debian 11+
- **RAM:** Minimum 2GB (4GB recommended)
- **Storage:** 20GB+ available
- **Ports:** 80, 443, 3000 open

### Access Requirements
- Root SSH access to your VPS
- SSH credentials or SSH key configured
- VPS with Ubuntu 20.04+ or Debian 11+

---

## 🚀 Quick Deployment (Automated)

### Option 1: One-Command Deployment

The fastest way to deploy:

```bash
# 1. SSH into your VPS
ssh root@YOUR_VPS_IP
# Enter your SSH password or use SSH key

# 2. Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/vps-full-deploy.sh -o vps-full-deploy.sh
chmod +x vps-full-deploy.sh
sudo bash vps-full-deploy.sh
```

This script will:
1. ✅ Install Docker and Docker Compose
2. ✅ Install Git
3. ✅ Clone the repository
4. ✅ Configure environment variables
5. ✅ Build Docker image (no cache)
6. ✅ Deploy with Docker Compose
7. ✅ Run database migrations
8. ✅ Seed database (optional)
9. ✅ Configure firewall
10. ✅ Run health checks
11. ✅ Setup SSL (optional)

**Total deployment time:** 10-15 minutes

---

## 📝 Step-by-Step Manual Deployment

If you prefer manual control, follow these steps:

### Step 1: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

### Step 2: Install Docker

```bash
# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 3: Install Git

```bash
apt-get install -y git
```

### Step 4: Clone Repository

```bash
# Navigate to root directory
cd /root

# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git

# Navigate to project
cd cortexbuild-pro
```

### Step 5: Configure Environment

```bash
# Copy production environment file
cp deployment/.env.production .env

# Edit environment variables if needed
nano .env

# Set proper permissions
chmod 600 .env
```

**Environment variables in `.env.production`:**
- ✅ `POSTGRES_USER=cortexbuild`
- ✅ `POSTGRES_PASSWORD` - Generate strong password with `openssl rand -base64 32`
- ✅ `POSTGRES_DB=cortexbuild`
- ✅ `NEXTAUTH_URL` - Your production domain URL
- ✅ `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- ✅ `ENCRYPTION_KEY` - Generate with `openssl rand -hex 32`
- ✅ `ABACUSAI_API_KEY` - Get from https://abacus.ai/

### Step 6: Build Docker Image

```bash
cd /root/cortexbuild-pro/deployment

# Build with no cache for fresh production build
docker build --no-cache -t cortexbuild-app:latest -f Dockerfile ..

# Tag with timestamp for backup
docker tag cortexbuild-app:latest cortexbuild-app:$(date +%Y%m%d_%H%M%S)

# Verify image
docker images | grep cortexbuild
```

**Expected build time:** 5-10 minutes

### Step 7: Deploy with Docker Compose

```bash
cd /root/cortexbuild-pro/deployment

# Stop any existing containers
docker compose down

# Start services
docker compose up -d

# Check status
docker compose ps
```

### Step 8: Wait for Database

```bash
# Wait for database to be ready (30-60 seconds)
sleep 30

# Check database health
docker compose exec db pg_isready -U cortexbuild -d cortexbuild
```

### Step 9: Run Database Migrations

```bash
cd /root/cortexbuild-pro/deployment

# Run migrations
docker compose exec app npx prisma migrate deploy

# Verify migration
docker compose logs app | grep -i migrate
```

### Step 10: Seed Database (Optional)

```bash
# Seed with initial data (admin user, sample projects, etc.)
docker compose exec app npx prisma db seed
```

### Step 11: Configure Firewall

```bash
# Install UFW if not present
apt-get install -y ufw

# Allow required ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 12: Verify Deployment

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f app

# Test application endpoint
curl -I http://localhost:3000/

# Test database connection
docker compose exec db psql -U cortexbuild -d cortexbuild -c "SELECT current_database();"
```

### Step 13: Access Application

Open your browser and navigate to:
- **Local:** http://YOUR_VPS_IP:3000
- **Domain:** http://your-domain.com:3000 (after DNS setup)

---

## 🔐 Production Security Checklist

### Before Going Live

- [ ] Change default database password
- [ ] Generate new `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- [ ] Generate new `ENCRYPTION_KEY` with `openssl rand -hex 32`
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Verify all API keys are production keys
- [ ] Set up SSL certificates
- [ ] Configure proper firewall rules
- [ ] Set up automated backups
- [ ] Review and secure SSH access
- [ ] Enable fail2ban for SSH protection

### Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32

# Generate secure database password
openssl rand -base64 24
```

---

## 🌐 Domain and SSL Setup

### Configure DNS

Point your domain to the VPS:

```
A Record: @ -> YOUR_VPS_IP
A Record: www -> YOUR_VPS_IP
```

### Install and Configure SSL

```bash
cd /root/cortexbuild-pro/deployment

# Run SSL setup script
bash setup-ssl.sh

# Or manually with certbot:
apt-get install -y certbot
certbot certonly --standalone -d cortexbuildpro.com -d www.cortexbuildpro.com
```

### Configure Nginx Reverse Proxy (Recommended)

```bash
# Install Nginx
apt-get install -y nginx

# Copy nginx configuration
cp /root/cortexbuild-pro/deployment/nginx-ssl.conf /etc/nginx/sites-available/cortexbuild

# Update domain in config
nano /etc/nginx/sites-available/cortexbuild

# Enable site
ln -s /etc/nginx/sites-available/cortexbuild /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 📊 Monitoring and Management

### View Logs

```bash
# Application logs
docker compose logs -f app

# Database logs
docker compose logs -f db

# All services
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100 app
```

### Container Management

```bash
# Check status
docker compose ps
docker ps

# Resource usage
docker stats

# Restart application
docker compose restart app

# Stop all services
docker compose down

# Start all services
docker compose up -d
```

### Health Checks

```bash
cd /root/cortexbuild-pro/deployment

# Run health check script
bash health-check.sh

# Manual health check
curl -I http://localhost:3000/
docker compose exec db pg_isready -U cortexbuild
```

---

## 🔄 Updating the Application

### Method 1: Using Production Deploy Script

```bash
cd /root/cortexbuild-pro/deployment
./production-deploy.sh
```

### Method 2: Manual Update

```bash
cd /root/cortexbuild-pro

# Pull latest code
git pull origin main

# Rebuild image
cd deployment
docker compose build --no-cache app

# Restart services
docker compose up -d app

# Run migrations
docker compose exec app npx prisma migrate deploy

# Verify update
docker compose logs --tail=50 app
```

---

## 💾 Backup and Restore

### Create Backup

```bash
cd /root/cortexbuild-pro/deployment

# Run backup script
bash backup.sh

# Backups saved to /root/cortexbuild_backups/
ls -lh /root/cortexbuild_backups/
```

### Restore Backup

```bash
cd /root/cortexbuild-pro/deployment

# Restore from specific backup
bash restore.sh /root/cortexbuild_backups/cortexbuild_backup_20260204.sql.gz
```

### Automated Backups

Set up daily backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * cd /root/cortexbuild-pro/deployment && bash backup.sh

# Verify crontab
crontab -l
```

---

## 🛠️ Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose logs app

# Check environment variables
docker compose exec app env | grep DATABASE

# Restart application
docker compose restart app

# Rebuild if needed
docker compose build --no-cache app
docker compose up -d app
```

### Database Connection Failed

```bash
# Check database status
docker compose logs db

# Verify database is running
docker compose ps db

# Test connection
docker compose exec db pg_isready -U cortexbuild -d cortexbuild

# Check connection string
docker compose exec app env | grep DATABASE_URL
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
netstat -tulpn | grep 3000

# Kill process if needed
kill -9 <PID>

# Or change port in docker-compose.yml
nano docker-compose.yml
# Change "3000:3000" to "8080:3000" for external port 8080
```

### Out of Disk Space

```bash
# Check disk usage
df -h
docker system df

# Clean up Docker
cd /root/cortexbuild-pro/deployment
bash cleanup-repos.sh --aggressive

# Or manual cleanup
docker system prune -a
docker volume prune
```

### Migrations Failed

```bash
# Check migration status
docker compose exec app npx prisma migrate status

# Reset database (DANGER: deletes all data)
docker compose exec app npx prisma migrate reset

# Or manually fix
docker compose exec db psql -U cortexbuild -d cortexbuild
# Run SQL commands to fix issues
```

---

## 🔧 Advanced Configuration

### Using Docker Manager (Portainer)

```bash
# Install Portainer
docker volume create portainer_data
docker run -d \
  -p 9000:9000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Access Portainer at http://72.62.132.43:9000
# Create admin account on first visit
```

See [README-DOCKER-MANAGER.md](README-DOCKER-MANAGER.md) for detailed Portainer setup.

### Performance Tuning

```bash
# Increase PostgreSQL performance
docker compose exec db psql -U cortexbuild -d cortexbuild -c "
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
"

# Restart database
docker compose restart db
```

### Enable Redis Caching (Optional)

```bash
# Add to docker-compose.yml
nano docker-compose.yml

# Add Redis service:
# redis:
#   image: redis:7-alpine
#   restart: unless-stopped
#   ports:
#     - "6379:6379"
#   networks:
#     - cortexbuild-network

# Add to .env:
# REDIS_URL=redis://redis:6379

# Restart services
docker compose up -d
```

---

## 📞 Support and Resources

### Documentation
- Main README: `/root/cortexbuild-pro/README.md`
- Deployment README: `/root/cortexbuild-pro/deployment/README.md`
- Docker Manager Guide: `/root/cortexbuild-pro/deployment/README-DOCKER-MANAGER.md`
- Quick Start: `/root/cortexbuild-pro/deployment/QUICKSTART.md`

### Useful Commands Reference

```bash
# Project directory
cd /root/cortexbuild-pro/deployment

# View all available scripts
bash scripts-help.sh

# Health check
bash health-check.sh

# Backup
bash backup.sh

# Deploy
bash production-deploy.sh

# Cleanup
bash cleanup-repos.sh

# Rollback
bash rollback.sh
```

### Common Tasks

| Task | Command |
|------|---------|
| Start services | `docker compose up -d` |
| Stop services | `docker compose down` |
| View logs | `docker compose logs -f app` |
| Restart app | `docker compose restart app` |
| Run migrations | `docker compose exec app npx prisma migrate deploy` |
| Access database | `docker compose exec db psql -U cortexbuild -d cortexbuild` |
| Check status | `docker compose ps` |
| Update app | `git pull && docker compose up -d --build` |

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Application accessible at http://72.62.132.43:3000
- [ ] Database migrations completed successfully
- [ ] Admin login works
- [ ] All pages load without errors
- [ ] File uploads work
- [ ] Email notifications work (if configured)
- [ ] API endpoints respond correctly
- [ ] SSL certificate installed (for HTTPS)
- [ ] Firewall configured properly
- [ ] Backups configured and tested
- [ ] Monitoring set up
- [ ] Documentation reviewed

---

## 🎉 Success!

Your CortexBuild Pro application should now be deployed and running at:

**Application URL:** http://72.62.132.43:3000

**Default Admin Credentials** (if seeded):
- Email: admin@cortexbuild.com
- Password: Check seed script output or set during seeding

**Next Steps:**
1. Access the application and verify functionality
2. Change all default passwords
3. Set up SSL for HTTPS
4. Configure domain DNS
5. Set up automated backups
6. Configure monitoring and alerts

---

**Deployment Date:** 2026-02-04
**Version:** 2.2.0
**Server:** 72.62.132.43
**Domain:** cortexbuildpro.com

For questions or issues, check the logs and documentation, or refer to the troubleshooting section above.

**Happy deploying! 🚀**
