# 🚀 CortexBuild Pro - Public Deployment Guide

**Version:** 1.0.0  
**Last Updated:** January 26, 2026  
**Status:** ✅ Production Ready

---

## 📦 Docker Image

CortexBuild Pro is available as a Docker image published to GitHub Container Registry.

**Registry:** `ghcr.io`  
**Image:** `ghcr.io/adrianstanca1/cortexbuild-pro`  
**Tags:** `latest`, `main`, version tags (e.g., `v1.0.0`)

### Image Publishing

Docker images are automatically built and published when code is pushed to:
- `cortexbuildpro` branch → tagged as `cortexbuildpro` and `latest`
- `main` branch → tagged as `main` and `latest`
- Version tags (e.g., `v1.0.0`) → published with the same tag

**CI/CD Workflow:** See `.github/workflows/docker-publish.yml`

**Publishing Guide:** Run `./deployment/publish-docker-image-guide.sh` for detailed publishing instructions and current status.

### Pull the Image

```bash
# Pull the latest stable version
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:latest

# Pull a specific version
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:v1.0.0

# Verify the image
docker images | grep cortexbuild-pro
```

> **Note:** If the repository is private, you'll need to authenticate with GitHub Container Registry using a Personal Access Token (PAT).

---

## ✅ Pre-Deployment Validation

Before deploying, validate that your environment is ready:

```bash
# Clone repository (if not already done)
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# Run validation script
./validate-public-deployment.sh
```

This will check:
- ✓ Docker and Docker Compose installation
- ✓ Docker image availability in GHCR
- ✓ Deployment scripts presence
- ✓ Configuration files integrity

> **Note:** If the Docker image is not yet published, the script will indicate this. You can either wait for the image to be published (happens automatically on pushes to `cortexbuildpro` or `main` branches) or use Option 2 below to build locally.

---

## 🎯 Quick Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Domain name pointed to your server (for production)
- Minimum 2GB RAM, 2 CPU cores, 20GB disk space

### Option 1: Deploy from Published Image (Recommended)

This is the fastest way to deploy using the pre-built Docker image from GitHub Container Registry.

```bash
# 1. Clone repository to get deployment scripts
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# 2. Create environment file
cp .env.example .env

# 3. Edit .env and set secure database password
nano .env
# Set POSTGRES_PASSWORD to a secure value

# 4. Deploy using published image
./deploy-from-published-image.sh
```

**What this does:**
- Pulls the latest pre-built Docker image
- Starts PostgreSQL database
- Starts the application
- Runs database migrations
- Sets up all services

**Time to deploy:** ~5 minutes

### Option 2: Build and Deploy Locally

Build the Docker image locally on your server.

```bash
# 1. Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# 2. Create environment file
cp .env.example .env
nano .env  # Configure your settings

# 3. Build and deploy
docker compose build
docker compose up -d

# 4. Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

**Time to deploy:** ~15-20 minutes (includes build time)

---

## 🔐 Environment Configuration

### Required Settings

Edit the `.env` file and configure these required settings:

```env
# Database Password (REQUIRED)
POSTGRES_PASSWORD=your_secure_password_here

# NextAuth Secret (Pre-configured for www.cortexbuildpro.com)
NEXTAUTH_SECRET=mK8vX3wR5yZ9qL2nP4tJ7aB6cD1eF0gH9iM3oS8uV5wY2zA4bE6dG1hI7jK0lN3pQ

# Domain (Adjust for your deployment)
NEXTAUTH_URL=https://your-domain.com
DOMAIN=your-domain.com
```

### Generate Secure Passwords

```bash
# Generate a secure database password
openssl rand -base64 32

# Generate a new NEXTAUTH_SECRET
openssl rand -base64 32
```

### Optional Services

The following services are optional but recommended:

**AWS S3 (File Uploads)**
```env
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**SendGrid (Email Notifications)**
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@your-domain.com
```

**Google OAuth (Social Login)**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 🌐 Domain and SSL Setup

### 1. Configure DNS

Point your domain to your server:

```
Type    Name                Value           TTL
A       yourdomain.com      YOUR_SERVER_IP  3600
A       www                 YOUR_SERVER_IP  3600
```

### 2. Setup SSL with Let's Encrypt

After deployment, configure SSL:

```bash
cd deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

This will:
- Request SSL certificates from Let's Encrypt
- Configure Nginx with HTTPS
- Setup automatic certificate renewal
- Enable HTTP to HTTPS redirect

---

## 🔧 Management Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart app
```

### Stop Services

```bash
# Stop all services (data is preserved)
docker compose down

# Stop and remove volumes (⚠️ deletes all data)
docker compose down -v
```

### Update to Latest Version

```bash
# Pull latest image
docker pull ghcr.io/adrianstanca1/cortexbuild-pro:latest

# Restart application with new image
docker compose pull app
docker compose up -d app

# Run migrations if schema changed
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### Database Access

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Backup database
docker compose exec postgres pg_dump -U cortexbuild cortexbuild > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U cortexbuild cortexbuild
```

---

## 📊 Health Checks

### Application Health

```bash
# Basic health check
curl http://localhost:3000/api/auth/providers

# Expected response: JSON with authentication providers
```

### Service Status

```bash
# Check all services
docker compose ps

# Check Docker stats
docker stats cortexbuild-app cortexbuild-db cortexbuild-nginx
```

### SSL Certificate Status

```bash
# Check certificate expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🔒 Security Checklist

Before going live, verify:

- [ ] Strong, unique database password set
- [ ] NEXTAUTH_SECRET is secure (32+ characters)
- [ ] SSL/HTTPS is enabled and working
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Database not exposed to internet (port 5432 internal only)
- [ ] Regular backups scheduled
- [ ] Environment variables secured (not in git)
- [ ] System updates applied

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose logs app

# Common issues:
# 1. Database not ready - wait a few seconds
# 2. Missing environment variables - check .env
# 3. Port conflict - check if port 3000 is in use
```

### Database Connection Errors

```bash
# Check if database is running
docker compose ps postgres

# Test connection
docker compose exec postgres pg_isready -U cortexbuild

# Check database logs
docker compose logs postgres
```

### SSL Certificate Issues

```bash
# Check if domain resolves
dig yourdomain.com +short

# Manually obtain certificate
docker compose run --rm certbot certonly \
    --standalone \
    --email admin@yourdomain.com \
    --agree-tos \
    -d yourdomain.com \
    -d www.yourdomain.com
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old logs
docker compose exec app sh -c "rm -f /app/*.log"
```

---

## 📈 Scaling and Performance

### Horizontal Scaling

To run multiple app instances behind a load balancer:

```yaml
services:
  app:
    deploy:
      replicas: 3
    # ... rest of config
```

### Database Optimization

```bash
# Optimize database
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "VACUUM ANALYZE;"

# Check database size
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "
  SELECT pg_size_pretty(pg_database_size('cortexbuild'));"
```

### Monitoring

Consider adding monitoring tools:
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Portainer** - Docker management UI

---

## 🔄 Backup and Restore

### Automated Backup Script

The deployment includes an automated backup script:

```bash
# Run manual backup
cd deployment
./backup.sh

# Backups are stored in: deployment/backups/
```

### Schedule Automatic Backups

```bash
# Add to crontab for daily backups at 2 AM
crontab -e

# Add this line:
0 2 * * * /path/to/cortexbuild-pro/deployment/backup.sh
```

### Restore from Backup

```bash
cd deployment
./restore.sh backups/cortexbuild_backup_2026-01-26_02-00-00.sql
```

---

## 📚 Additional Resources

### Documentation
- **[README.md](../README.md)** - Project overview
- **[PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md)** - Detailed deployment guide
- **[API_SETUP_GUIDE.md](../API_SETUP_GUIDE.md)** - API configuration
- **[SECURITY_COMPLIANCE.md](../SECURITY_COMPLIANCE.md)** - Security best practices

### Support
- **GitHub Issues:** https://github.com/adrianstanca1/cortexbuild-pro/issues
- **Documentation:** https://github.com/adrianstanca1/cortexbuild-pro

---

## 📋 Deployment Checklist

Use this checklist for production deployment:

### Pre-Deployment
- [ ] Server provisioned (2GB+ RAM, 2+ CPU cores, 20GB+ disk)
- [ ] Docker and Docker Compose installed
- [ ] Run validation script: `./deployment/validate-public-deployment.sh`
- [ ] Docker image available in GHCR or ready to build locally
- [ ] Domain registered and DNS configured
- [ ] SSL email configured for Let's Encrypt
- [ ] Firewall rules configured (ports 80, 443, 22)

### Configuration
- [ ] `.env` file created from `.env.example`
- [ ] Secure database password set
- [ ] NEXTAUTH_SECRET configured
- [ ] Domain URLs configured
- [ ] Optional services configured (AWS S3, SendGrid, etc.)

### Deployment
- [ ] Docker image pulled or built
- [ ] Services started with Docker Compose
- [ ] Database migrations completed
- [ ] Application health check passes
- [ ] SSL certificates obtained
- [ ] HTTPS redirect enabled

### Post-Deployment
- [ ] Admin user created
- [ ] Platform settings configured
- [ ] Backups scheduled
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Security checklist completed

---

## 🎉 Success!

Your CortexBuild Pro instance is now deployed and ready for use!

**Default Application Access:**
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

**First Steps:**
1. Create your admin account via signup
2. Configure organization settings
3. Invite team members
4. Create your first project

---

**Deployed with ❤️ using CortexBuild Pro**

*For support and updates, visit: https://github.com/adrianstanca1/cortexbuild-pro*
