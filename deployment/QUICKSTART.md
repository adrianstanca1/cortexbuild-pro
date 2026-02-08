# CortexBuild Pro - VPS Deployment Quick Start

## 🚀 Deployment Options

CortexBuild Pro offers multiple deployment methods to suit your workflow:

### Option 1: Automated Deployment via GitHub Actions (⭐ Recommended)

**Best for:** Streamlined deployments, CI/CD workflows, team collaboration

Deploy with a single click from GitHub - no manual SSH access required!

**Features:**
- ✅ One-click deployment from GitHub UI
- ✅ Automated pre-deployment validation (tests, linting, builds)
- ✅ Built-in health checks after deployment
- ✅ Support for multiple environments (production, staging)
- ✅ Complete deployment history and logs
- ✅ Easy rollback capability

**Quick Setup:**
```bash
# 1. Complete initial VPS setup (one-time)
ssh root@YOUR_VPS_IP
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment
sudo bash quick-start.sh

# 2. Configure GitHub secrets in your repository:
#    - VPS_SSH_KEY (SSH private key)
#    - VPS_HOST (your VPS IP or domain)
#    - VPS_USER (usually 'root')

# 3. Deploy from GitHub:
#    Navigate to: Actions → Deploy to VPS → Run workflow
```

**See [AUTOMATED-DEPLOYMENT.md](AUTOMATED-DEPLOYMENT.md) for complete setup instructions.**

---

### Option 2: One-Command Manual Deployment

**Best for:** Quick deployments, initial setup, learning the system

```bash
# Download and deploy in one command
wget https://github.com/adrianstanca1/cortexbuild-pro/archive/main.tar.gz
tar -xzf main.tar.gz
cd cortexbuild-pro-main/deployment

# Run one-click deployment
sudo bash quick-start.sh
```

That's it! The script will:
- ✅ Check system requirements
- ✅ Install Docker & Docker Compose
- ✅ Configure environment
- ✅ Build and deploy application
- ✅ Run database migrations
- ✅ Verify deployment health
- ✅ Create automatic backups

---

## 📋 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Ubuntu 20.04+ | Ubuntu 22.04 LTS |
| **RAM** | 2GB | 4GB+ |
| **CPU** | 2 cores | 4 cores |
| **Disk** | 20GB SSD | 40GB+ SSD |
| **Ports** | 22, 80, 443 | 22, 80, 443, 3000 |

---

## 📦 Additional Deployment Methods

### Method 3: Production Update Workflow

**Best for:** Production updates, code deployments, regular maintenance

```bash
cd /root/cortexbuild-pro/deployment
./production-deploy.sh
```

**Features:**
- Complete production workflow
- Commits all changes
- Fresh production build (no cache)
- Automatic migrations
- Repository cleanup
- Health verification

**What it does:**
1. ✅ Commits all pending changes
2. ✅ Rebuilds application for production
3. ✅ Deploys to VPS with migrations
4. ✅ Cleans up Docker and Git artifacts
5. ✅ Verifies deployment health

See [PRODUCTION-DEPLOY-GUIDE.md](PRODUCTION-DEPLOY-GUIDE.md) for complete details.

---

### Method 4: Manual Docker Deployment

**Best for:** Fresh VPS installations, automated setup

```bash
cd /root
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment
sudo bash quick-start.sh
```

**Features:**
- Fully automated setup
- Automatic prerequisites installation
- Built-in health checks
- Automatic backup creation
- Comprehensive error handling

---

### Method 5: CloudPanel Deployment

**Best for:** Managed hosting, GUI preference

See [CLOUDPANEL-GUIDE.md](CLOUDPANEL-GUIDE.md) for detailed instructions.

Quick steps:
1. Install CloudPanel: `curl -fsSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash`
2. Create Node.js site (port 3000)
3. Create PostgreSQL database
4. Run `cloudpanel-deploy.sh` script

---

## ⚙️ Configuration

### Essential Environment Variables

Edit `.env` file with these critical settings:

```bash
# Database
DATABASE_URL="postgresql://cortexbuild:YOUR_PASSWORD@localhost:5432/cortexbuild"

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# Optional: AWS S3 for file uploads
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_BUCKET_NAME="your-bucket"
AWS_REGION="eu-west-2"
```

---

## 🔒 SSL/HTTPS Setup

### Option A: Let's Encrypt (Automatic)

```bash
cd /root/cortexbuild-pro/deployment
./setup-ssl.sh your-domain.com admin@your-domain.com
```

### Option B: Manual Certificate

```bash
# Install certbot
apt install certbot -y

# Get certificate
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Configure nginx with SSL
cp nginx-ssl.conf nginx.conf
docker compose restart nginx
```

---

## 🛠️ Management Commands

### Check Deployment Health

```bash
cd /root/cortexbuild-pro/deployment
./health-check.sh
```

This provides comprehensive status including:
- Docker & container status
- Database connectivity
- Application health
- System resources
- Recent errors
- Backup status

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db

# Last 100 lines
docker compose logs --tail=100 app
```

### Restart Services

```bash
# Restart application only
docker compose restart app

# Restart all services
docker compose restart

# Full restart (down + up)
docker compose down
docker compose up -d
```

### Database Operations

```bash
# Run migrations
docker compose exec app npx prisma migrate deploy

# Seed database
docker compose exec app npx prisma db seed

# Access database
docker compose exec db psql -U cortexbuild -d cortexbuild

# Database backup
./backup.sh

# Database restore
./restore.sh backups/db_backup_20240123.sql.gz
```

---

## 🔄 Rollback

If something goes wrong, rollback to a previous state:

```bash
# Interactive rollback (select backup)
./rollback.sh

# Quick rollback (most recent backup)
./rollback.sh --quick
```

The rollback script:
- Creates a safety backup before rollback
- Restores database from backup
- Restarts application
- Verifies deployment

---

## 📊 Monitoring

### Container Resource Usage

```bash
docker stats
```

### System Resources

```bash
# Memory
free -h

# Disk
df -h

# CPU load
uptime
```

### Application Health Endpoint

```bash
curl http://localhost:3000/api/auth/providers
```

---

## 🔐 Security Checklist

- [ ] Change default database password
- [ ] Generate strong `NEXTAUTH_SECRET`
- [ ] Enable firewall (UFW)
- [ ] Setup SSL/HTTPS
- [ ] Disable root SSH login
- [ ] Configure automated backups
- [ ] Update system packages regularly
- [ ] Monitor logs for suspicious activity

### Quick Firewall Setup

```bash
# Install and configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔄 Updates

### Update Application (Production Workflow - Recommended)

```bash
cd /root/cortexbuild-pro

# Pull latest changes
git pull origin main

# Run production deployment
cd deployment
./production-deploy.sh
```

This will:
1. Commit any pending changes
2. Rebuild application with no cache
3. Deploy with migrations
4. Clean up repositories
5. Verify deployment

### Manual Update

```bash
cd /root/cortexbuild-pro

# Pull latest changes
git pull origin main

# Rebuild and deploy
cd deployment
docker compose build --no-cache app
docker compose up -d app

# Run any new migrations
docker compose exec app npx prisma migrate deploy
```

### Update Dependencies

```bash
# Update Docker images
docker compose pull

# Rebuild with new dependencies
docker compose build --no-cache
docker compose up -d
```

---

## 🗄️ Backup Strategy

### Automated Backups

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * cd /root/cortexbuild-pro/deployment && ./backup.sh
```

### Manual Backup

```bash
cd /root/cortexbuild-pro/deployment
./backup.sh
```

Backups are stored in `/root/cortexbuild_backups/`

### Backup Retention

```bash
# Keep last 30 days of backups
find /root/cortexbuild_backups -name "*.sql.gz" -mtime +30 -delete
```

---

## 🌐 DNS Configuration

Point your domain to your VPS:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | 300 |
| A | www | YOUR_VPS_IP | 300 |

Wait 5-10 minutes for DNS propagation.

---

## 🔧 Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose logs app

# Check database connection
docker compose exec app npx prisma db pull

# Verify environment
docker compose exec app env | grep DATABASE
```

### Database Connection Issues

```bash
# Test database
docker compose exec db pg_isready -U cortexbuild

# Restart database
docker compose restart db

# Check database logs
docker compose logs db
```

### Port Already in Use

```bash
# Find process using port 80
sudo lsof -i :80

# Stop conflicting service
sudo systemctl stop apache2
sudo systemctl stop nginx
```

### Out of Memory

```bash
# Increase Docker memory limit
# Edit docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

### SSL Certificate Issues

```bash
# Verify certificates
docker run --rm -v certbot-etc:/etc/letsencrypt alpine ls -la /etc/letsencrypt/live/

# Renew certificates
docker compose run --rm certbot renew
docker compose restart nginx
```

---

## 📞 Getting Help

### Check Health Status

```bash
./health-check.sh
```

### Review Logs

```bash
docker compose logs -f app
tail -f /var/log/cortexbuild-deploy.log
```

### Common Issues

1. **Build fails**: Increase memory, clear Docker cache: `docker system prune -a`
2. **Migration fails**: Check DATABASE_URL format in .env
3. **Can't access app**: Verify firewall rules and port 3000 is open
4. **Slow performance**: Check resource usage with `docker stats`

---

## 📄 Initial Setup - User Accounts

After seeding the database, several demo accounts are created for testing. 

**⚠️ SECURITY CRITICAL:** 

1. **First-time setup**: The database seed creates default accounts with preset passwords
2. **You MUST change these passwords immediately** after deployment
3. For production use, consider:
   - Deleting demo accounts after setup
   - Creating your own admin account with strong credentials
   - Using the application's user management to add real users

**Important:** The actual seeded accounts are defined in `nextjs_space/scripts/seed.ts`. The seed script creates specific test accounts with default credentials. For security reasons, we do not list the actual email addresses and passwords here in the public documentation.

**After Deployment:**
1. Run the seed script: `docker compose exec app npx prisma db seed`
2. Check `nextjs_space/scripts/seed.ts` to see which accounts were created
3. Log in with one of the admin accounts from the seed file
4. **Immediately change all passwords** through the user management interface
5. Delete or disable any demo/test accounts before production use

**Production Best Practices:**
- Set up your own admin account during initial configuration
- Never use default/demo credentials in production
- Enable two-factor authentication if available
- Regularly audit user accounts and permissions

---

## 🎯 Quick Reference

```bash
# Initial Deploy
sudo bash quick-start.sh

# Production Deploy (Updates)
./production-deploy.sh

# Repository Cleanup
./cleanup-repos.sh

# Repository Cleanup (Aggressive)
./cleanup-repos.sh --aggressive

# Check health
./health-check.sh

# View logs
docker compose logs -f app

# Restart
docker compose restart app

# Backup
./backup.sh

# Rollback
./rollback.sh

# Manual Update
git pull && docker compose build --no-cache app && docker compose up -d
```

---

## 🧹 Maintenance

### Regular Maintenance Tasks

**Weekly:**
```bash
# Check health
./health-check.sh

# Clean up repositories
./cleanup-repos.sh

# Review logs
docker compose logs --tail=100
```

**Monthly:**
```bash
# Aggressive cleanup (careful!)
./cleanup-repos.sh --aggressive

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
```

**As Needed:**
```bash
# Deploy updates
./production-deploy.sh

# Create backup before major changes
./backup.sh

# Monitor resources
docker stats
df -h
```

---

## 📚 Additional Resources

- [Full Deployment Guide](README.md)
- [Production Deployment Guide](PRODUCTION-DEPLOY-GUIDE.md) ⭐ NEW
- [CloudPanel Guide](CLOUDPANEL-GUIDE.md)
- [Docker Manager Guide](README-DOCKER-MANAGER.md)
- [GitHub Repository](https://github.com/adrianstanca1/cortexbuild-pro)

---

**Need help?** Open an issue on GitHub or check the troubleshooting section above.
