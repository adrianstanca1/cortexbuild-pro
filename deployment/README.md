# CortexBuild Pro - VPS Deployment Guide

Complete guide to deploy CortexBuild Pro on your private VPS.

> **🚀 New!** For the fastest deployment experience, check out our [Quick Start Guide](QUICKSTART.md) which includes a one-click deployment script!

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

### One-Click Deployment (Recommended)

The easiest way to deploy:

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
```

**Required settings in `.env`:**
```env
# Database
POSTGRES_PASSWORD=choose_a_strong_password_here

# Auth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=https://your-domain.com

# Domain
DOMAIN=your-domain.com
SSL_EMAIL=admin@your-domain.com
```

### 3. Deploy
```bash
chmod +x *.sh
./deploy.sh
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
├── .env.example          # Environment template
├── docker-compose.yml    # Container orchestration
├── Dockerfile            # App build instructions
├── nginx.conf            # Reverse proxy config
├── one-click-deploy.sh   # ⭐ One-click deployment (NEW)
├── health-check.sh       # ⭐ Health monitoring (NEW)
├── rollback.sh           # ⭐ Deployment rollback (NEW)
├── QUICKSTART.md         # ⭐ Quick start guide (NEW)
├── deploy.sh             # Main deployment script
├── setup-ssl.sh          # SSL certificate setup
├── backup.sh             # Database backup
├── restore.sh            # Database restore
└── seed-db.sh            # Seed initial data
```

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database password |
| `NEXTAUTH_SECRET` | Yes | Auth encryption key |
| `NEXTAUTH_URL` | Yes | Full domain URL |
| `DOMAIN` | Yes | Domain without https |
| `AWS_*` | No | S3 for file uploads |

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
