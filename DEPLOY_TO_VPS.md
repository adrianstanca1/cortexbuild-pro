# 🚀 Deploy CortexBuild Pro to VPS - Simple Guide

**One-command deployment for production VPS servers**

---

## Quick Start (Recommended)

### For Fresh VPS:

```bash
# Run this single command on your VPS
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
```

This script will:
- ✅ Install Docker and dependencies
- ✅ Configure firewall and security
- ✅ Clone repository
- ✅ Generate secure credentials
- ✅ Build and deploy application
- ✅ Run database migrations
- ✅ Start all services

**⏱️ Expected time:** 10-15 minutes

---

## Manual Installation

If you prefer step-by-step control:

### Step 1: Clone Repository
```bash
cd /var/www
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro
```

### Step 2: Run Deployment Script
```bash
./deploy-to-vps.sh
```

The script will guide you through the process with clear prompts.

---

## System Requirements

### Minimum Specifications
- **OS:** Ubuntu 20.04+ or Debian 10+
- **RAM:** 2GB (4GB recommended)
- **CPU:** 2 cores (4 cores recommended)
- **Storage:** 20GB (40GB+ recommended)
- **Network:** Public IP address

### Required Access
- SSH access to the server
- Root or sudo privileges
- Ports 22, 80, 443 accessible

---

## What Gets Installed

The deployment script installs and configures:

1. **Docker & Docker Compose** - Container runtime
2. **PostgreSQL 15** - Database (in container)
3. **Next.js Application** - Main application (in container)
4. **Nginx** - Reverse proxy and web server (in container)
5. **Certbot** - SSL certificate management (in container)
6. **UFW** - Firewall with secure defaults
7. **Fail2Ban** - SSH brute-force protection

---

## Post-Deployment

### Access Your Application

After deployment completes, access your application at:
```
http://YOUR_SERVER_IP:3000
```

### Create Admin Account

1. Open the application URL in your browser
2. Click **"Sign Up"**
3. Fill in your details
4. **The first user automatically becomes the platform administrator**

### Set Up SSL (Optional but Recommended)

If you have a domain name:

```bash
cd /var/www/cortexbuild-pro/deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

After SSL setup, your site will be available at:
```
https://yourdomain.com
```

---

## Common Commands

### View Logs
```bash
cd /var/www/cortexbuild-pro/deployment
docker compose logs -f
```

### Restart Application
```bash
docker compose restart app
```

### Check Service Status
```bash
docker compose ps
```

### Backup Database
```bash
./backup.sh
```

### Stop Services
```bash
docker compose down
```

### Update Application
```bash
cd /var/www/cortexbuild-pro
git pull
cd deployment
docker compose up -d --build
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

---

## Troubleshooting

### Application Not Loading

**Check if services are running:**
```bash
cd /var/www/cortexbuild-pro/deployment
docker compose ps
```

**View application logs:**
```bash
docker compose logs app
```

**Restart application:**
```bash
docker compose restart app
```

### Database Connection Issues

**Check database status:**
```bash
docker compose ps postgres
docker compose logs postgres
```

**Verify database is healthy:**
```bash
docker compose exec postgres pg_isready -U cortexbuild
```

### Port Already in Use

**Check what's using the port:**
```bash
sudo netstat -tlnp | grep :3000
```

**Stop conflicting service or change port in .env file**

### SSL Certificate Issues

**Ensure DNS is propagated:**
```bash
dig yourdomain.com +short
```

**Check certificate status:**
```bash
docker compose run --rm certbot certificates
```

**Manually renew certificate:**
```bash
docker compose run --rm certbot renew
docker compose restart nginx
```

---

## Security Checklist

After deployment, ensure:

- [ ] Strong passwords generated (script does this automatically)
- [ ] Firewall is enabled: `sudo ufw status`
- [ ] Only necessary ports are open (22, 80, 443)
- [ ] Fail2Ban is active: `sudo systemctl status fail2ban`
- [ ] Credentials file deleted after saving: `rm DEPLOYMENT_CREDENTIALS_*.txt`
- [ ] SSL certificate installed (if using domain)
- [ ] Regular backups scheduled
- [ ] System updates scheduled: `sudo apt update && sudo apt upgrade`

---

## Maintenance

### Daily
- Monitor application logs for errors
- Check disk space: `df -h`

### Weekly
- Review application logs: `docker compose logs --tail=100`
- Check service status: `docker compose ps`

### Monthly
- Backup database: `./backup.sh`
- Update system: `sudo apt update && sudo apt upgrade`
- Update Docker images: `docker compose pull && docker compose up -d`
- Clean Docker resources: `docker system prune`

### Automated Backups

Set up automated daily backups:

```bash
crontab -e
```

Add this line:
```cron
0 2 * * * /var/www/cortexbuild-pro/deployment/backup.sh
```

---

## Optional Services

### AWS S3 (File Storage)

Edit `.env` file:
```bash
nano /var/www/cortexbuild-pro/deployment/.env
```

Add your AWS credentials:
```env
AWS_REGION=us-west-2
AWS_BUCKET_NAME=your-bucket-name
AWS_FOLDER_PREFIX=cortexbuild/
```

Restart application:
```bash
docker compose restart app
```

### SendGrid (Email)

Add to `.env`:
```env
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=CortexBuild Pro
```

Restart application:
```bash
docker compose restart app
```

### Google OAuth

1. Create OAuth credentials in Google Cloud Console
2. Add to `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

3. Restart application:
```bash
docker compose restart app
```

---

## Getting Help

### Documentation
- 📖 [Complete Deployment Guide](VPS_DEPLOYMENT_GUIDE.md)
- 📋 [Quick Reference](DEPLOYMENT_QUICK_REFERENCE.md)
- 🔧 [Troubleshooting Guide](TROUBLESHOOTING.md)
- 🔐 [Security Checklist](SECURITY_CHECKLIST.md)

### Support Resources
1. **Check logs:** `docker compose logs -f`
2. **Run diagnostics:** `docker compose exec app npx tsx scripts/system-diagnostics.ts`
3. **Review documentation** in `/var/www/cortexbuild-pro/`
4. **GitHub Issues:** https://github.com/adrianstanca1/cortexbuild-pro/issues

---

## Uninstall

To completely remove CortexBuild Pro:

```bash
cd /var/www/cortexbuild-pro/deployment
docker compose down -v  # Stop and remove containers + volumes
cd /var/www
sudo rm -rf cortexbuild-pro
```

**⚠️ Warning:** This will delete all data including the database!

---

## Advanced Options

For more deployment options, see:

- **[deploy-from-published-image.sh](deployment/deploy-from-published-image.sh)** - Deploy from pre-built Docker image
- **[deploy-production.sh](deployment/deploy-production.sh)** - Production deployment with extra validations
- **[vps-setup.sh](deployment/vps-setup.sh)** - VPS-only setup (no application deployment)

---

## Success!

Your CortexBuild Pro instance is now running! 🎉

**Next Steps:**
1. Access your application
2. Create your admin account
3. Configure platform settings
4. Invite team members
5. Start managing your construction projects!

---

**Need help?** Check the documentation or open an issue on GitHub.

**Last Updated:** January 27, 2026
**Version:** 2.0.0
