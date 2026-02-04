# 🚀 CortexBuild Pro - Quick Deployment Reference

## VPS Server Details
- **IP Address:** 72.62.132.43
- **SSH User:** root
- **SSH Password:** Cumparavinde1@
- **Domain:** cortexbuildpro.com

---

## ⚡ One-Command Deployment

```bash
ssh root@72.62.132.43
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/vps-full-deploy.sh | sudo bash
```

---

## 🔑 SSH Access

```bash
# Connect to VPS
ssh root@72.62.132.43
# Password: Cumparavinde1@

# Or with password in command (less secure)
sshpass -p 'Cumparavinde1@' ssh root@72.62.132.43
```

---

## 📦 Manual Deployment Steps

```bash
# 1. Connect
ssh root@72.62.132.43

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# 3. Clone repo
git clone https://github.com/adrianstanca1/cortexbuild-pro.git /root/cortexbuild-pro

# 4. Setup environment
cd /root/cortexbuild-pro
cp deployment/.env.production .env
chmod 600 .env

# 5. Build and deploy
cd deployment
docker build --no-cache -t cortexbuild-app:latest -f Dockerfile ..
docker compose up -d

# 6. Run migrations
sleep 30
docker compose exec app npx prisma migrate deploy

# 7. Verify
docker compose ps
curl -I http://localhost:3000/
```

---

## 🌐 Access URLs

After deployment:
- **Application:** http://72.62.132.43:3000
- **With Domain:** http://cortexbuildpro.com:3000 (after DNS)
- **With SSL:** https://cortexbuildpro.com (after SSL setup)

---

## 🔧 Essential Commands

```bash
# Navigate to deployment
cd /root/cortexbuild-pro/deployment

# View logs
docker compose logs -f app

# Restart application
docker compose restart app

# Check status
docker compose ps

# Run migrations
docker compose exec app npx prisma migrate deploy

# Access database
docker compose exec db psql -U cortexbuild -d cortexbuild

# Health check
bash health-check.sh

# Update application
git pull && docker compose up -d --build
```

---

## 🔐 Important Credentials

### Database
- **User:** cortexbuild
- **Password:** CortexSecure2026 (⚠️ CHANGE IN PRODUCTION!)
- **Database:** cortexbuild
- **Port:** 5433 (external), 5432 (internal)

### API Keys
- **AbacusAI:** aab7e27d61c14a81a2bcf4d395478e4c (✅ Real API key)

### Authentication
- **NextAuth Secret:** MlKVwMSzZh25ydHp6rFPiaxTQ2WT88nK
- **Encryption Key:** cortexbuild_encryption_key_2026_secure

---

## 🛠️ Troubleshooting

### Application not starting?
```bash
docker compose logs app
docker compose restart app
```

### Database connection issues?
```bash
docker compose logs db
docker compose exec db pg_isready -U cortexbuild
```

### Port conflicts?
```bash
lsof -i :3000
docker ps -a
```

### Out of space?
```bash
docker system prune -a
bash cleanup-repos.sh --aggressive
```

---

## 📊 Monitoring

```bash
# Real-time stats
docker stats

# Container status
docker compose ps

# System resources
df -h
free -h
top
```

---

## 🔄 Update Workflow

```bash
cd /root/cortexbuild-pro
git pull origin main
cd deployment
docker compose build --no-cache app
docker compose up -d app
docker compose exec app npx prisma migrate deploy
docker compose logs --tail=50 app
```

---

## 💾 Backup & Restore

```bash
# Create backup
cd /root/cortexbuild-pro/deployment
bash backup.sh

# Restore backup
bash restore.sh /root/cortexbuild_backups/cortexbuild_backup_YYYYMMDD.sql.gz
```

---

## 🔒 Security Hardening

```bash
# Change database password
nano /root/cortexbuild-pro/.env
# Update POSTGRES_PASSWORD and DATABASE_URL

# Restart services
docker compose down && docker compose up -d

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Setup SSL
cd /root/cortexbuild-pro/deployment
bash setup-ssl.sh
```

---

## 📚 Documentation

- **Full Guide:** [VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)
- **Docker Manager:** [README-DOCKER-MANAGER.md](README-DOCKER-MANAGER.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Main README:** [../README.md](../README.md)

---

## ✅ Deployment Checklist

- [ ] SSH access working
- [ ] Docker installed
- [ ] Repository cloned
- [ ] Environment configured
- [ ] Image built successfully
- [ ] Services running
- [ ] Database migrations completed
- [ ] Application accessible
- [ ] Health checks passing
- [ ] Firewall configured
- [ ] SSL certificates installed
- [ ] Backups scheduled
- [ ] Admin credentials changed

---

## 🆘 Quick Support

**Logs not helpful?**
```bash
docker compose logs --tail=100 app
docker compose logs --tail=100 db
```

**Need to start fresh?**
```bash
cd /root/cortexbuild-pro/deployment
docker compose down -v  # ⚠️ Deletes all data!
docker compose up -d
```

**Database corrupted?**
```bash
# Restore from backup
bash restore.sh /root/cortexbuild_backups/latest_backup.sql.gz
```

---

**Last Updated:** 2026-02-04  
**Version:** 2.2.0  
**Status:** ✅ Production Ready

---

For detailed instructions, see [VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)
