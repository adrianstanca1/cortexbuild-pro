# 🎯 CortexBuild Pro - VPS Deployment Checklist

**Last Updated:** January 26, 2026  
**Purpose:** Ensure successful production deployment to VPS

---

## Pre-Deployment Checklist

### VPS Requirements

- [ ] **Operating System:** Ubuntu 20.04+ or Debian-based Linux
- [ ] **RAM:** Minimum 2GB (4GB recommended)
- [ ] **CPU:** Minimum 2 cores (4 cores recommended)
- [ ] **Storage:** Minimum 20GB (40GB+ recommended)
- [ ] **Network:** Public IP address accessible via internet
- [ ] **Access:** SSH access with root or sudo privileges

### Access Credentials

- [ ] VPS IP address: `_________________`
- [ ] SSH username: `_________________`
- [ ] SSH password or key file location: `_________________`
- [ ] Can successfully SSH: `ssh username@IP_ADDRESS`

### Optional (Recommended)

- [ ] Domain name registered
- [ ] DNS A record pointing to VPS IP
- [ ] DNS propagation verified (15 min - 24 hours)
- [ ] SSL email address for Let's Encrypt

---

## Deployment Process Checklist

### Step 1: Connect to VPS

- [ ] SSH connection successful: `ssh username@YOUR_VPS_IP`
- [ ] Have sudo/root access verified

### Step 2: System Setup

- [ ] Run VPS setup script:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/vps-setup.sh | bash
  ```
- [ ] Docker installed and running: `docker --version`
- [ ] Docker Compose installed: `docker compose version`
- [ ] Firewall configured and enabled: `sudo ufw status`
- [ ] Fail2Ban configured for security

### Step 3: Clone Repository

- [ ] Changed to deployment directory: `cd /var/www`
- [ ] Repository cloned:
  ```bash
  git clone https://github.com/adrianstanca1/cortexbuild-pro.git
  ```
- [ ] Changed to deployment folder: `cd cortexbuild-pro/deployment`

### Step 4: Configure Environment

- [ ] Environment file created: `cp .env.example .env`
- [ ] Database password generated (or will be auto-generated)
- [ ] NextAuth secret generated (or will be auto-generated)
- [ ] Optional: AWS S3 credentials added (if needed)
- [ ] Optional: SendGrid API key added (if needed)
- [ ] Optional: Google OAuth credentials added (if needed)

### Step 5: Deploy Application

- [ ] Deployment script executed: `./deploy-vps.sh`
- [ ] Secure credentials generated and saved
- [ ] Docker images built successfully
- [ ] All services started (postgres, app, nginx, certbot)
- [ ] Database migrations completed
- [ ] No errors in deployment output

### Step 6: Verify Deployment

- [ ] Check services running: `docker compose ps`
  - [ ] cortexbuild-db (postgres) - Up
  - [ ] cortexbuild-app (application) - Up
  - [ ] cortexbuild-nginx (web server) - Up
  - [ ] cortexbuild-certbot (SSL) - Up
- [ ] Application accessible: `http://YOUR_VPS_IP:3000`
- [ ] API responds: `curl http://localhost:3000/api/auth/providers`
- [ ] No errors in logs: `docker compose logs app | tail -50`

### Step 7: Post-Deployment Security

- [ ] Credentials file reviewed and saved securely
- [ ] DEPLOYMENT_CREDENTIALS.txt deleted: `rm DEPLOYMENT_CREDENTIALS.txt`
- [ ] Firewall status verified: `sudo ufw status`
- [ ] Only necessary ports open (22, 80, 443)

---

## Optional: SSL/HTTPS Setup

### Prerequisites

- [ ] Domain name registered
- [ ] DNS A records configured:
  - [ ] `yourdomain.com` → VPS IP
  - [ ] `www.yourdomain.com` → VPS IP
- [ ] DNS propagation verified: `dig yourdomain.com +short`

### SSL Configuration

- [ ] Run SSL setup script: `./setup-ssl.sh yourdomain.com admin@yourdomain.com`
- [ ] Certificates obtained successfully
- [ ] Update .env file:
  - [ ] `NEXTAUTH_URL=https://yourdomain.com`
  - [ ] `NEXT_PUBLIC_WEBSOCKET_URL=https://yourdomain.com`
  - [ ] `DOMAIN=yourdomain.com`
- [ ] Application restarted: `docker compose restart app`
- [ ] HTTPS works: `https://yourdomain.com`
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate valid (no browser warnings)

---

## Application Configuration Checklist

### Initial Setup

- [ ] Open application in browser
- [ ] Sign up page accessible
- [ ] Create first admin account (becomes platform admin automatically)
- [ ] Login successful
- [ ] Dashboard loads correctly

### Admin Console Configuration

- [ ] Navigate to Admin Console: `/admin`
- [ ] Organization settings configured
- [ ] User roles and permissions reviewed
- [ ] Platform settings customized

### Optional Services

- [ ] AWS S3 file uploads tested (if configured)
- [ ] Email notifications working (if configured)
- [ ] Google OAuth working (if configured)
- [ ] WebSocket/real-time features working

---

## Testing Checklist

### Basic Functionality

- [ ] User registration works
- [ ] User login/logout works
- [ ] Dashboard loads
- [ ] Can create project
- [ ] Can create task
- [ ] Can upload document (if S3 configured)
- [ ] Real-time updates work
- [ ] Mobile responsive design works

### Performance

- [ ] Page load times acceptable (< 3 seconds)
- [ ] No console errors in browser
- [ ] Database queries performing well
- [ ] WebSocket connection stable

### Security

- [ ] HTTPS working (if domain configured)
- [ ] Authentication required for protected pages
- [ ] No sensitive data in URLs
- [ ] CORS properly configured
- [ ] Environment secrets not exposed

---

## Backup and Maintenance Setup

### Database Backups

- [ ] Test manual backup: `./backup.sh`
- [ ] Backup file created in `./backups/` directory
- [ ] Test restore process: `./restore.sh backups/latest_backup.sql`
- [ ] Schedule automated backups (cron):
  ```bash
  crontab -e
  # Add: 0 2 * * * /var/www/cortexbuild-pro/deployment/backup.sh
  ```

### Monitoring

- [ ] Set up log monitoring: `docker compose logs -f`
- [ ] Monitor resource usage: `docker stats`
- [ ] Set up alerts for service failures (external monitoring recommended)

### Updates

- [ ] Document update process
- [ ] Test update procedure:
  ```bash
  cd /var/www/cortexbuild-pro
  git pull
  cd deployment
  docker compose up -d --build
  docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
  ```

---

## Documentation Checklist

### Required Documentation

- [ ] System architecture documented
- [ ] Deployment details documented
- [ ] Access credentials securely stored
- [ ] Backup procedures documented
- [ ] Recovery procedures documented
- [ ] Update procedures documented

### Team Knowledge

- [ ] Team members have access credentials
- [ ] Team trained on basic management commands
- [ ] Emergency contacts established
- [ ] Escalation procedures defined

---

## Troubleshooting Reference

### Common Issues Checklist

**If application won't start:**
- [ ] Check logs: `docker compose logs app`
- [ ] Check database: `docker compose logs postgres`
- [ ] Verify environment variables: `cat .env`
- [ ] Restart services: `docker compose restart`

**If database connection fails:**
- [ ] Database running: `docker compose ps postgres`
- [ ] Database healthy: `docker compose exec postgres pg_isready`
- [ ] Check connection string in .env

**If SSL doesn't work:**
- [ ] DNS resolving: `dig yourdomain.com +short`
- [ ] Certificate obtained: `docker compose run --rm certbot certificates`
- [ ] Nginx config correct: `docker compose exec nginx nginx -t`

---

## Final Verification

### Production Readiness

- [ ] All services running and healthy
- [ ] Application accessible from internet
- [ ] Admin account created and tested
- [ ] Basic functionality verified
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Backups configured
- [ ] Documentation complete
- [ ] Team informed and trained
- [ ] Monitoring in place

### Sign-off

- [ ] **Deployment Date:** _______________
- [ ] **Deployed By:** _______________
- [ ] **Application URL:** _______________
- [ ] **Verification Date:** _______________
- [ ] **Verified By:** _______________

---

## Quick Command Reference

```bash
# View logs
docker compose logs -f app

# Restart application
docker compose restart app

# Check status
docker compose ps

# Backup database
./backup.sh

# Update application
git pull && docker compose up -d --build

# Access database
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Check disk space
df -h

# Monitor resources
docker stats
```

---

## Support Resources

- **Full Deployment Guide:** [DEPLOY_TO_VPS.md](DEPLOY_TO_VPS.md)
- **Quick Reference:** [QUICK_VPS_DEPLOY.md](QUICK_VPS_DEPLOY.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Repository:** https://github.com/adrianstanca1/cortexbuild-pro

---

**Deployment Status:** 
- [ ] ❌ Not Started
- [ ] 🔄 In Progress
- [ ] ✅ Complete
- [ ] ⚠️ Issues Found

**Notes:**
```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

---

**Last Updated:** January 26, 2026  
**Version:** 1.0.0
