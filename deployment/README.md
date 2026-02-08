# CortexBuild Pro - VPS Deployment Guide

Complete guide to deploy CortexBuild Pro on your private VPS.

## 📌 Version Management

The current version is tracked in the `VERSION` file at the repository root. Version information is:
- Displayed during deployment scripts
- Available via API at `/api/version`
- Shown in the application footer

Current version: **2.3.0**

## 📦 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: 2+ cores
- **Storage**: 20GB+ SSD
- **Network**: Open ports 80, 443, 22

### Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### Automated Deployment via GitHub Actions (⭐ Recommended)

Deploy directly from GitHub with one click - no manual SSH required!

**Benefits:**
- ✅ One-click deployment from GitHub UI
- ✅ Automated pre-deployment validation
- ✅ Built-in health checks
- ✅ No need to manually SSH to VPS
- ✅ Deployment history tracking
- ✅ Easy rollback capability

**Quick Setup:**
1. Configure GitHub secrets (VPS_SSH_KEY, VPS_HOST, VPS_USER)
2. Navigate to Actions → Deploy to VPS
3. Click "Run workflow" and watch the magic happen!

**See [AUTOMATED-DEPLOYMENT.md](AUTOMATED-DEPLOYMENT.md) for detailed setup instructions.**

---

### One-Click Manual Deployment

The easiest way to deploy manually on your VPS:

```bash
cd /root
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment
sudo bash one-click-deploy.sh
```

This script handles everything: Docker installation, environment setup, deployment, migrations, and health checks.

For more options, see our [Quick Start Guide](QUICKSTART.md).

---

### Manual Deployment

### 1. Upload Project to Server
```bash
# Option A: SCP from local machine
scp -r cortexbuild_pro user@your-server:/home/user/

# Option B: Git clone (if hosted)
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
```

### 2. Configure Environment
```bash
cd cortexbuild_pro/deployment
cp .env.example .env
nano .env
chmod 600 .env
```

**Required settings in `.env`:**
```env
# Database (generate password with: openssl rand -base64 24)
POSTGRES_PASSWORD=choose_a_strong_password_here

# Auth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=https://your-domain.com

# Encryption (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_generated_key

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=your_bucket
```

> **Tip:** For the complete environment variable reference with all optional
> settings (Google OAuth, SendGrid, SMTP, AI providers, etc.), see
> [`.env.template`](../.env.template) in the project root.

### 3. Deploy
```bash
chmod +x *.sh
./production-deploy.sh
```

### 4. Setup SSL (Optional but Recommended)
```bash
./setup-ssl.sh your-domain.com admin@your-domain.com
```

### 5. Seed Database (First time only)
```bash
./seed-db.sh
```

---

## 📁 Project Structure

```
deployment/
├── .env.example          # Environment template (see also ../.env.template)
├── docker-compose.yml    # Container orchestration
├── docker-stack.yml      # Portainer / Docker Swarm variant
├── Dockerfile            # App build instructions
├── nginx.conf            # Reverse proxy config
├── nginx-ssl.conf        # Reverse proxy config with SSL
├── production-deploy.sh  # ⭐ Complete production workflow
├── cleanup-repos.sh      # ⭐ Repository cleanup
├── health-check.sh       # ⭐ Health monitoring
├── rollback.sh           # ⭐ Deployment rollback
├── QUICKSTART.md         # ⭐ Quick start guide
├── setup-ssl.sh          # SSL certificate setup
├── enterprise-backup.sh  # Database backup
├── enterprise-restore.sh # Database restore
├── seed-db.sh            # Seed initial data
└── scripts/
    ├── verify-deployment.sh  # Post-deployment verification
    └── verify-build.sh       # Build verification
```

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database password |
| `NEXTAUTH_SECRET` | Yes | Auth encryption key |
| `NEXTAUTH_URL` | Yes | Full domain URL |
| `ENCRYPTION_KEY` | Yes | Data encryption key |
| `AWS_*` | Recommended | S3 for file uploads |
| `ABACUSAI_API_KEY` | No | AI features |
| `GOOGLE_CLIENT_ID/SECRET` | No | Google OAuth login |
| `SENDGRID_API_KEY` | No | Email via SendGrid |
| `SMTP_*` | No | Email via SMTP |

### Using External Database

To use an external PostgreSQL (AWS RDS, DigitalOcean, etc.):

1. Comment out the `postgres` service in `docker-compose.yml`
2. Set `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"
```

---

## 🛠️ Management Commands

### Health Check & Monitoring

```bash
# Check deployment health
./health-check.sh

# Returns comprehensive status:
# - Docker & container status
# - Database connectivity
# - Application health
# - System resources
# - Log analysis
# - Backup status
```

### Deployment Rollback

```bash
# Interactive rollback (select backup)
./rollback.sh

# Quick rollback to most recent backup
./rollback.sh --quick
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f postgres
```

### Container Management
```bash
# Status
docker-compose ps

# Restart app
docker-compose restart app

# Stop all
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v
```

### Database Operations
```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Open Prisma Studio (database GUI)
docker-compose exec app npx prisma studio

# Direct database access
docker-compose exec postgres psql -U cortexbuild -d cortexbuild
```

### Backup & Restore
```bash
# Create backup
./backup.sh

# List backups
ls -la backups/

# Restore
./restore.sh backups/cortexbuild_backup_20240123.sql.gz
```

---

## 🔒 SSL Certificate Management

### Initial Setup
```bash
./setup-ssl.sh your-domain.com
```

### Manual Renewal
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Auto-Renewal (Cron)
Add to crontab (`crontab -e`):
```cron
0 3 * * * cd /home/user/cortexbuild_pro/deployment && docker-compose run --rm certbot renew && docker-compose restart nginx
```

---

## 🔄 Updating the Application

### Standard Update
```bash
cd cortexbuild_pro/deployment

# Pull latest code (if using git)
git pull origin main

# Rebuild and deploy
docker-compose build --no-cache app
docker-compose up -d app

# Run any new migrations
docker-compose exec app npx prisma migrate deploy
```

### Production Deployment Workflow (Recommended)

Complete production deployment with commit, rebuild, deploy, and cleanup:

```bash
cd cortexbuild_pro/deployment
./production-deploy.sh
```

This script performs:
1. ✅ Commits all pending changes
2. ✅ Rebuilds application with fresh production build
3. ✅ Deploys to VPS with database migrations
4. ✅ Cleans up repositories and Docker artifacts
5. ✅ Runs health checks to verify deployment

**Features:**
- Complete workflow automation
- Comprehensive logging
- Error handling and rollback support
- Post-deployment verification

**Example output:**
```
=============================================================================
  CortexBuild Pro - Production Deployment
  Version: 2.2.0
=============================================================================

[INFO] Step 1: Committing all changes...
[INFO] No changes to commit - working tree is clean
[INFO] Step 2: Rebuilding application for production...
[INFO] Building fresh Docker images (this may take several minutes)...
[SUCCESS] Production build completed successfully
[INFO] Step 3: Deploying to VPS...
[SUCCESS] Application deployed successfully
[INFO] Step 4: Cleaning repositories and artifacts...
[SUCCESS] Repository cleanup completed
[SUCCESS] Health check completed

Deployment completed successfully!
```

---

## 🌐 DNS Configuration

Point your domain to your server:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 300 |
| A | www | YOUR_SERVER_IP | 300 |

---

## 📊 Monitoring

### Health Check
```bash
curl -I http://localhost:3000/api/auth/providers
```

### Resource Usage
```bash
docker stats
```

### Disk Usage
```bash
docker system df

# Clean unused images/containers
docker system prune -a
```

---

## 🧹 Repository Cleanup

### Standard Cleanup
```bash
cd cortexbuild_pro/deployment
./cleanup-repos.sh
```

Performs standard cleanup:
- Removes stopped Docker containers
- Removes dangling Docker images
- Cleans build cache
- Optimizes Git repository
- Cleans old logs (7+ days)
- Removes temporary files

### Aggressive Cleanup
```bash
./cleanup-repos.sh --aggressive
```

**⚠️ WARNING:** Aggressive mode also removes:
- All unused Docker images (not just dangling)
- Unused Docker volumes (may contain data)
- Git untracked files

**Use aggressive mode only when:**
- Running low on disk space
- After major version upgrades
- During maintenance windows
- You have verified backups exist

**What gets cleaned:**
```
✓ Docker containers (stopped)
✓ Docker images (dangling/unused)
✓ Docker networks (unused)
✓ Docker volumes (unused in aggressive mode)
✓ Docker build cache
✓ Git repository optimization
✓ Next.js build cache
✓ node_modules cache
✓ Yarn cache
✓ Old logs (7+ days)
✓ Temporary files
```

**Example output:**
```
=============================================================================
  CortexBuild Pro - Repository Cleanup
=============================================================================

[INFO] Disk usage before cleanup: 45G
[INFO] Cleaning Docker artifacts...
[SUCCESS] Docker cleanup completed
[INFO] Cleaning Git repository...
[SUCCESS] Git repository cleanup completed
[INFO] Cleaning build artifacts...
[SUCCESS] Build artifacts cleanup completed
[SUCCESS] Disk usage after cleanup: 38G

Cleanup completed successfully!
```

---

## ⚠️ Troubleshooting

### App Won't Start
```bash
# Check logs
docker-compose logs app

# Check if database is running
docker-compose ps postgres

# Verify environment variables
docker-compose exec app env | grep -E 'DATABASE|NEXTAUTH'
```

### Database Connection Issues
```bash
# Test connection
docker-compose exec app sh -c "npx prisma db pull"

# Check PostgreSQL logs
docker-compose logs postgres
```

### SSL Issues
```bash
# Verify certificates exist
docker run --rm -v cortexbuild_certbot-etc:/etc/letsencrypt alpine ls -la /etc/letsencrypt/live/

# Check nginx config
docker-compose exec nginx nginx -t
```

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :80
sudo lsof -i :443

# Kill process or stop service
sudo systemctl stop apache2
```

---

## 📈 Performance Tuning

### PostgreSQL
Edit `docker-compose.yml` to add PostgreSQL config:
```yaml
postgres:
  command: postgres -c shared_buffers=256MB -c max_connections=100
```

### Nginx
Adjust worker connections in `nginx.conf`:
```nginx
worker_processes auto;
events {
    worker_connections 4096;
}
```

---

## 🔐 Security Checklist

- [ ] Change default database password
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Enable firewall (UFW)
- [ ] Disable root SSH login
- [ ] Enable SSL/HTTPS
- [ ] Regular backups scheduled
- [ ] Keep Docker images updated

### Firewall Setup (UFW)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📞 Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify `.env` configuration
3. Ensure DNS is properly configured
4. Check firewall rules

---

## 📄 Default Accounts

After running `seed-db.sh`:

| Email | Role | Organization |
|-------|------|-------------|
| adrian.stanca1@gmail.com | Super Admin | All |
| adrian@ascladdingltd.co.uk | Company Owner | AS Cladding Ltd |

**Note**: Check `scripts/seed.ts` for default passwords.
