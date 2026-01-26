# 📖 CortexBuild Pro - Quick Reference Guide

> **Fast reference for common deployment and management tasks**

---

## 🚀 Quick Deploy Commands

### Deploy from Published Image (Fastest)
```bash
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment
cp .env.example .env && nano .env  # Set POSTGRES_PASSWORD
./deploy-from-published-image.sh
```

### Deploy to Production (Full Setup)
```bash
cd cortexbuild-pro/deployment
./deploy-production.sh
```

### Manual Docker Deploy
```bash
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:latest
docker compose up -d
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

---

## 📦 Docker Image Commands

### Pull Images
```bash
# Latest stable
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:latest

# Specific version
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:v1.0.0

# Main branch (bleeding edge)
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:main
```

### Build Locally
```bash
cd deployment
docker compose build
docker compose up -d
```

### Update to Latest
```bash
docker compose pull app
docker compose up -d app
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

---

## 🔧 Service Management

### Start Services
```bash
docker compose up -d                    # All services
docker compose up -d postgres           # Database only
docker compose up -d app                # Application only
```

### Stop Services
```bash
docker compose down                     # Stop all (data preserved)
docker compose down -v                  # Stop and delete data
docker compose stop                     # Stop without removing
```

### Restart Services
```bash
docker compose restart                  # All services
docker compose restart app              # Application only
```

### View Status
```bash
docker compose ps                       # Service status
docker stats                            # Resource usage
docker compose top                      # Running processes
```

---

## 📊 Logs and Monitoring

### View Logs
```bash
docker compose logs -f                  # All services (follow)
docker compose logs -f app              # Application only
docker compose logs --tail=100 app      # Last 100 lines
docker compose logs --since 10m app     # Last 10 minutes
```

### Health Checks
```bash
# Application health
curl http://localhost:3000/api/auth/providers

# Database health
docker compose exec postgres pg_isready -U cortexbuild

# Service status
docker compose ps
```

### Monitoring
```bash
# Real-time stats
docker stats cortexbuild-app cortexbuild-db

# Disk usage
df -h
docker system df

# Network connections
docker compose exec app netstat -tulpn
```

---

## 🗃️ Database Commands

### Access Database
```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Run single query
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT COUNT(*) FROM \"User\";"
```

### Backup Database
```bash
# Manual backup
docker compose exec postgres pg_dump -U cortexbuild cortexbuild > backup_$(date +%Y%m%d).sql

# Using backup script
cd deployment
./backup.sh
```

### Restore Database
```bash
# From backup file
cat backup.sql | docker compose exec -T postgres psql -U cortexbuild cortexbuild

# Using restore script
cd deployment
./restore.sh backups/backup_20260126.sql
```

### Migrations
```bash
# Run pending migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Check migration status
docker compose exec app sh -c "cd /app && npx prisma migrate status"

# Seed database
docker compose exec app sh -c "cd /app && npx prisma db seed"
```

---

## 🌐 SSL/HTTPS Setup

### Setup SSL with Let's Encrypt
```bash
cd deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### Manual SSL Setup
```bash
# Get certificate
docker compose run --rm certbot certonly \
  --standalone \
  --email admin@yourdomain.com \
  --agree-tos \
  -d yourdomain.com -d www.yourdomain.com

# Restart nginx
docker compose restart nginx
```

### Check Certificate
```bash
# Expiration date
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Certificate details
docker compose run --rm certbot certificates
```

### Renew Certificate
```bash
# Manual renewal
docker compose run --rm certbot renew

# Force renewal
docker compose run --rm certbot renew --force-renewal
```

---

## 🔐 Security Commands

### Generate Secrets
```bash
# Generate database password
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate random string
openssl rand -hex 16
```

### Firewall Configuration
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Update System
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

---

## 📁 File Management

### View Application Files
```bash
# Enter container
docker compose exec app sh

# List files
docker compose exec app ls -la /app

# View environment variables
docker compose exec app printenv
```

### Copy Files
```bash
# From container to host
docker compose cp app:/app/uploads ./local-uploads

# From host to container
docker compose cp ./local-file.txt app:/app/uploads/
```

### View Logs Files
```bash
# Application logs
docker compose logs app > app_logs.txt

# All logs
docker compose logs > all_logs.txt
```

---

## 🔍 Troubleshooting Commands

### Container Issues
```bash
# Inspect container
docker inspect cortexbuild-app

# View container config
docker compose config

# Check networks
docker network ls
docker network inspect cortexbuild-network
```

### Database Issues
```bash
# Check database logs
docker compose logs postgres

# Test connection
docker compose exec postgres pg_isready

# List databases
docker compose exec postgres psql -U cortexbuild -l

# Check connections
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT count(*) FROM pg_stat_activity;"
```

### Application Issues
```bash
# Check environment variables
docker compose exec app printenv | grep -E 'DATABASE|NEXTAUTH'

# Test application
curl http://localhost:3000/api/auth/providers

# Restart application
docker compose restart app
docker compose logs -f app
```

### Cleanup
```bash
# Remove unused containers
docker system prune

# Remove all unused images
docker system prune -a

# Remove volumes (⚠️ deletes data)
docker system prune -a --volumes

# Clean old logs
docker compose exec app sh -c "find /app -name '*.log' -delete"
```

---

## 📦 Update & Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### Update from Published Image
```bash
# Pull latest image
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:latest

# Update and restart
docker compose pull app
docker compose up -d app

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### Rollback
```bash
# Stop current version
docker compose down

# Pull specific version
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:v1.0.0

# Update docker-compose to use specific tag
nano docker-compose.yml  # Change image tag

# Start services
docker compose up -d
```

---

## 🎯 Common Tasks

### Create Admin User
1. Access application: `http://yourdomain.com`
2. Click "Sign Up"
3. Fill in details (first user becomes admin)
4. Login with credentials

### Check System Health
```bash
# Run health check script
cd deployment
docker compose exec app node scripts/health-check.js

# Check all services
docker compose ps
curl http://localhost:3000/api/auth/providers
```

### Backup Before Updates
```bash
# Backup database
./deployment/backup.sh

# Backup configuration
cp deployment/.env deployment/.env.backup
```

### Schedule Automated Backups
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/cortexbuild-pro/deployment/backup.sh

# Add weekly cleanup at Sunday 3 AM
0 3 * * 0 find /path/to/backups -mtime +30 -delete
```

---

## 📚 Documentation Links

- **[PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md)** - Complete deployment guide
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Production options
- **[RELEASE_NOTES.md](RELEASE_NOTES.md)** - Version history
- **[README.md](README.md)** - Project overview
- **[SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)** - Security guide

---

## 🆘 Emergency Commands

### Application Not Responding
```bash
# Check logs
docker compose logs -f app

# Restart application
docker compose restart app

# Full restart
docker compose down && docker compose up -d
```

### Database Connection Issues
```bash
# Check database
docker compose ps postgres
docker compose logs postgres

# Restart database
docker compose restart postgres

# Wait for health
while ! docker compose exec postgres pg_isready; do sleep 1; done
```

### Out of Disk Space
```bash
# Check space
df -h

# Clean Docker
docker system prune -a

# Clean logs
docker compose exec app sh -c "find /app -name '*.log' -delete"

# Remove old backups
find /path/to/backups -mtime +7 -delete
```

### Container Won't Start
```bash
# Check configuration
docker compose config

# Check for port conflicts
netstat -tulpn | grep -E ':3000|:5432'

# Check Docker daemon
systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

---

## 💡 Pro Tips

1. **Use Docker Compose profiles** for different environments
2. **Always backup** before updates
3. **Monitor logs** regularly
4. **Keep images updated** for security
5. **Use specific version tags** in production
6. **Enable SSL** for production
7. **Schedule automated backups**
8. **Test in staging** before production updates
9. **Document custom configurations**
10. **Keep environment variables secure**

---

**Need help?** Check the full documentation or open an issue on GitHub.

https://github.com/adrianstanca1/cortexbuild-pro
