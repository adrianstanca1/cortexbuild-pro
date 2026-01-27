# 🚀 CortexBuild Pro - VPS Deployment Quick Reference Card

**One-page reference for common deployment tasks**

---

## 🎯 Quick Deploy (Fresh VPS)

```bash
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
```

---

## 📁 File Locations

| Item | Path |
|------|------|
| Application | `/var/www/cortexbuild-pro` |
| Configuration | `/var/www/cortexbuild-pro/deployment/.env` |
| Backups | `/var/www/cortexbuild-pro/deployment/backups/` |
| Logs | `docker compose logs` |

---

## 🔧 Essential Commands

### Navigation
```bash
cd /var/www/cortexbuild-pro/deployment
```

### Service Control
```bash
docker compose ps              # Check status
docker compose up -d           # Start all
docker compose down            # Stop all
docker compose restart app     # Restart app
docker compose restart nginx   # Restart web server
```

### Logs
```bash
docker compose logs -f         # All services (follow)
docker compose logs -f app     # App only
docker compose logs --tail=50  # Last 50 lines
```

### Health Checks
```bash
# Quick check
curl http://localhost:3000/api/auth/providers

# Full verification
cd /var/www/cortexbuild-pro
./verify-deployment.sh
```

### Database
```bash
# Access database
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Backup
cd /var/www/cortexbuild-pro/deployment
./backup.sh

# Restore
./restore.sh backups/backup_filename.sql
```

---

## 🔄 Updates

```bash
cd /var/www/cortexbuild-pro
git pull
cd deployment
docker compose up -d --build
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

---

## 🆘 Emergency

### Application Not Responding
```bash
cd /var/www/cortexbuild-pro/deployment
docker compose restart app
docker compose logs -f app
```

### Rollback
```bash
cd /var/www/cortexbuild-pro
./rollback-deployment.sh
# Select option from menu
```

### Full System Restart
```bash
cd /var/www/cortexbuild-pro/deployment
docker compose restart
```

### Stop Everything
```bash
docker compose down
```

---

## 🔐 Security

### Firewall Status
```bash
sudo ufw status
```

### Open/Close Ports
```bash
sudo ufw allow 80/tcp
sudo ufw delete allow 80/tcp
```

### Check Fail2Ban
```bash
sudo systemctl status fail2ban
sudo fail2ban-client status sshd
```

---

## 🌐 SSL/HTTPS

### Setup SSL
```bash
cd /var/www/cortexbuild-pro/deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### Check Certificate
```bash
docker compose run --rm certbot certificates
```

### Renew Certificate
```bash
docker compose run --rm certbot renew
docker compose restart nginx
```

---

## 📊 Monitoring

### Resource Usage
```bash
docker stats                   # Live container stats
df -h                         # Disk space
free -h                       # Memory
htop                          # System monitor
```

### Check Disk Space
```bash
df -h
docker system df              # Docker disk usage
docker system prune           # Clean unused
```

---

## 🔍 Troubleshooting

### Container Won't Start
```bash
docker compose ps
docker compose logs app
docker compose up -d --force-recreate app
```

### Database Connection Failed
```bash
docker compose exec postgres pg_isready
docker compose logs postgres
```

### Port Already in Use
```bash
sudo netstat -tlnp | grep :3000
# Kill process or change port in .env
```

---

## ⚙️ Configuration

### Edit Environment
```bash
nano /var/www/cortexbuild-pro/deployment/.env
docker compose restart app     # Apply changes
```

### View Current Config
```bash
cat /var/www/cortexbuild-pro/deployment/.env | grep -v PASSWORD
docker compose config
```

---

## 📱 Access URLs

| Service | URL |
|---------|-----|
| Application | `http://YOUR_SERVER_IP:3000` |
| With Domain | `https://yourdomain.com` |
| Database | `localhost:5432` (internal) |

---

## 📞 Support

### Documentation
- Full Guide: `/var/www/cortexbuild-pro/VPS_DEPLOYMENT_GUIDE.md`
- Quick Start: `/var/www/cortexbuild-pro/DEPLOY_TO_VPS.md`
- Troubleshooting: `/var/www/cortexbuild-pro/TROUBLESHOOTING.md`

### Logs & Diagnostics
```bash
docker compose logs -f
./verify-deployment.sh
docker compose exec app npx tsx scripts/system-diagnostics.ts
```

---

## 💾 Backup Schedule

### Manual Backup
```bash
cd /var/www/cortexbuild-pro/deployment
./backup.sh
```

### Automated Daily Backup (2 AM)
```bash
crontab -e
# Add: 0 2 * * * /var/www/cortexbuild-pro/deployment/backup.sh
```

---

## 🎯 Common Tasks

| Task | Command |
|------|---------|
| Create admin account | Access app URL, sign up (first user = admin) |
| View logs | `docker compose logs -f` |
| Restart app | `docker compose restart app` |
| Check status | `docker compose ps` |
| Backup DB | `./backup.sh` |
| Update app | `git pull && docker compose up -d --build` |
| Verify deployment | `./verify-deployment.sh` |
| Emergency stop | `docker compose down` |

---

## 🔑 Important Notes

✅ **First user** becomes platform administrator
✅ **Backups** are stored in `deployment/backups/`
✅ **Credentials** file should be deleted after saving
✅ **SSL** certificates auto-renew via Certbot
✅ **Ports** 22, 80, 443 must be open in firewall
✅ **Minimum** 2GB RAM, 2 CPU cores, 20GB disk

---

## 📋 Pre-Deployment Checklist

- [ ] VPS meets minimum requirements
- [ ] Ubuntu 20.04+ or Debian 10+
- [ ] Root or sudo access available
- [ ] SSH access working
- [ ] Domain pointed to server IP (optional)
- [ ] Ports 22, 80, 443 accessible

---

**Version:** 2.0.0
**Last Updated:** January 27, 2026

**🌐 Repository:** https://github.com/adrianstanca1/cortexbuild-pro
