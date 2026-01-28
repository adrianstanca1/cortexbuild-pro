# 🎯 VPS Deployment - Quick Reference Card

**Version:** 1.0.0 | **Last Updated:** January 28, 2026

---

## 🚀 Three Ways to Deploy

### 1️⃣ One-Command Deployment (Fastest)

```bash
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
```

⏱️ **10-15 minutes** | ✅ **Complete setup** | 🔧 **No prerequisites**

---

### 2️⃣ Automated CI/CD (Best for Teams)

**Setup:** Configure GitHub secrets once  
**Deploy:** Push to main branch  
**Time:** 5-10 minutes per deployment

```bash
git push origin main  # Auto-deploys to VPS
```

📖 [Setup Guide](VPS_DEPLOYMENT_AUTOMATION.md)

---

### 3️⃣ Manual Deployment

```bash
cd /var/www/cortexbuild-pro/deployment
docker compose pull app
docker compose up -d --no-build
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

⏱️ **2-3 minutes** | ✅ **Full control**

---

## 📋 Quick Commands

### View Logs
```bash
cd /var/www/cortexbuild-pro/deployment
docker compose logs -f                    # All services
docker compose logs -f app               # App only
docker compose logs -f postgres          # Database only
```

### Restart Services
```bash
docker compose restart                   # All services
docker compose restart app              # App only
```

### Check Status
```bash
docker compose ps                        # Container status
docker stats                            # Resource usage
curl http://localhost:3000/api/auth/providers  # Health check
```

### Database Operations
```bash
# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Backup database
./backup.sh

# Restore database
./restore.sh backups/backup-YYYYMMDD.sql
```

### Rollback
```bash
cd /var/www/cortexbuild-pro
./rollback-deployment.sh
```

---

## 🔐 Required Secrets (GitHub Actions)

| Secret | Description | Example |
|--------|-------------|---------|
| `VPS_SSH_KEY` | Private SSH key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `VPS_HOST` | VPS IP or hostname | `203.0.113.10` |
| `VPS_USER` | SSH username | `root` or `ubuntu` |
| `VPS_PORT` | SSH port (optional) | `22` |

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Application** | `http://VPS_IP:3000` | Main application |
| **With Domain** | `https://yourdomain.com` | SSL-enabled access |
| **Health Check** | `http://VPS_IP:3000/api/auth/providers` | API health |

---

## 🐛 Quick Troubleshooting

### Application won't start
```bash
docker compose logs app              # Check logs
docker compose restart app           # Restart app
./verify-deployment.sh              # Run diagnostics
```

### Database connection issues
```bash
docker compose ps postgres           # Check status
docker compose logs postgres         # Check logs
docker compose restart postgres      # Restart DB
```

### Deployment failed (GitHub Actions)
1. Check Actions tab for error logs
2. Verify secrets are configured
3. Test SSH connection: `ssh VPS_USER@VPS_HOST`
4. Check VPS resources: `free -h`, `df -h`

---

## 📁 Important Files & Locations

```
/var/www/cortexbuild-pro/          # Application root
├── deployment/                     # Deployment files
│   ├── .env                       # Environment config
│   ├── docker-compose.yml         # Container orchestration
│   └── backups/                   # Database backups
├── deploy-to-vps.sh               # One-command deployment
├── verify-deployment.sh           # Health check script
└── rollback-deployment.sh         # Rollback utility
```

---

## ⚡ Common Tasks

### Update Application
```bash
cd /var/www/cortexbuild-pro
git pull origin main
cd deployment
docker compose up -d --build
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### Configure SSL
```bash
cd /var/www/cortexbuild-pro/deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### View Environment Variables
```bash
cd /var/www/cortexbuild-pro/deployment
docker compose exec app printenv | grep -E 'DATABASE_URL|NEXTAUTH|AWS'
```

### Clean Up Docker Resources
```bash
docker system prune -a              # Remove unused images
docker volume prune                 # Remove unused volumes
```

---

## 📊 Monitoring

### Check Application Health
```bash
# Quick health check
curl -f http://localhost:3000/api/auth/providers && echo "✅ Healthy" || echo "❌ Unhealthy"

# Full diagnostics
cd /var/www/cortexbuild-pro
./verify-deployment.sh
```

### Monitor Resources
```bash
# Real-time container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

---

## 🔄 Deployment Workflow

### GitHub Actions Automated
```
Push to main → Tests → Build → Deploy → Migrate → Verify
```

### Manual Process
```
SSH to VPS → Pull code → Pull image → Restart → Migrate
```

---

## 🆘 Get Help

- **Logs:** `docker compose logs -f`
- **Diagnostics:** `./verify-deployment.sh`
- **Documentation:** [VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)
- **Automation:** [VPS_DEPLOYMENT_AUTOMATION.md](VPS_DEPLOYMENT_AUTOMATION.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **GitHub Issues:** https://github.com/adrianstanca1/cortexbuild-pro/issues

---

## ✅ Pre-Deployment Checklist

**VPS Ready:**
- [ ] Ubuntu 20.04+ installed
- [ ] 2GB+ RAM, 2+ CPU cores
- [ ] SSH access configured
- [ ] Firewall allows ports 22, 80, 443

**GitHub Actions Setup:**
- [ ] Secrets configured (SSH key, host, user)
- [ ] Variables configured (deployment path, URL)
- [ ] Test deployment successful

**Post-Deployment:**
- [ ] Application accessible
- [ ] Health checks passing
- [ ] SSL configured (if using domain)
- [ ] Backups scheduled

---

## 🎉 Success Indicators

✅ All containers running: `docker compose ps`  
✅ Health check passes: `curl http://localhost:3000/api/auth/providers`  
✅ No errors in logs: `docker compose logs --tail=50`  
✅ Application accessible from browser

---

**Need more details?** See full guides in repository root.

**Last Updated:** January 28, 2026
