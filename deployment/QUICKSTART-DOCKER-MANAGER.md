# 🐳 Docker Manager & Windmill - Quick Start Guide

## Overview
This guide provides quick deployment instructions using Docker Manager (Portainer) and Windmill automation on your VPS.

---

## 🚀 Option 1: Docker Manager (Portainer) Deployment

### Prerequisites
- VPS with Docker installed
- Root or sudo access

### Installation (One Command)

```bash
# Upload project to VPS, then run:
cd /root/cortexbuild_pro/deployment
./docker-manager-deploy.sh
```

This script will:
1. ✅ Check Docker installation
2. ✅ Build the application image
3. ✅ Offer to deploy with Docker Compose
4. ✅ Show Portainer deployment instructions

### Deploy via Portainer Web UI

1. **Install Portainer (if not already installed):**
   ```bash
   docker volume create portainer_data
   docker run -d -p 9000:9000 -p 9443:9443 \
     --name portainer --restart=always \
     -v /var/run/docker.sock:/var/run/docker.sock \
     -v portainer_data:/data \
     portainer/portainer-ce:latest
   ```

2. **Access Portainer:**
   - Open: `http://YOUR_SERVER_IP:9000`
   - Create admin account

3. **Create Stack:**
   - Go to **Stacks** → **Add stack**
   - Name: `cortexbuild-pro`
   - Build method: **Web editor**
   - Paste contents of `docker-compose.yml`
   - Add environment variables from `portainer-stack-env.txt`
   - Click **Deploy the stack**

4. **Initialize Database:**
   ```bash
   docker exec cortexbuild-app npx prisma migrate deploy
   docker exec cortexbuild-app npx prisma db seed
   ```

5. **Access Application:**
   - `http://YOUR_SERVER_IP:3000`

---

## 🔄 Option 2: Windmill Automation

### Installation

```bash
cd /root/cortexbuild_pro/deployment
./windmill-setup.sh
```

This will:
1. ✅ Check Docker installation
2. ✅ Install Windmill (if not present)
3. ✅ Create deployment workflow
4. ✅ Set up automation scripts

### Configure Workflow

1. **Access Windmill:**
   - Open: `http://YOUR_SERVER_IP:8000`
   - Create admin account

2. **Import Workflow:**
   - Go to **Flows** → **New Flow**
   - Name: `CortexBuild Pro Deployment`
   - Import from: `windmill-deploy-flow.yaml`

3. **Configure:**
   - Set schedule: Daily at 2 AM (optional)
   - Enable webhook: For CI/CD (optional)
   - Add notifications

4. **Test Run:**
   - Click **Run** in Windmill UI
   - Monitor execution logs

### Automated Deployment Features

- ✅ Pull latest code from Git
- ✅ Build Docker image
- ✅ Deploy/update containers
- ✅ Health check verification
- ✅ Run database migrations
- ✅ Email notifications

---

## 📋 Quick Reference

### View Application
```bash
# Check status
docker ps

# View logs
docker logs -f cortexbuild-app

# Test endpoint
curl http://localhost:3000
```

### Update Application
```bash
# Via script
cd /root/cortexbuild_pro/deployment
./windmill-deploy-app.sh

# Or manually
docker compose up -d --no-deps --build app
```

### Database Operations
```bash
# Run migrations
docker exec cortexbuild-app npx prisma migrate deploy

# Seed database
docker exec cortexbuild-app npx prisma db seed

# Access database
docker exec -it cortexbuild-db psql -U cortexbuild -d cortexbuild
```

### Backup
```bash
# Database backup
docker exec cortexbuild-db pg_dump -U cortexbuild cortexbuild > backup.sql

# Restore
docker exec -i cortexbuild-db psql -U cortexbuild cortexbuild < backup.sql
```

---

## 🔗 Links

- **Full Documentation:** [README-DOCKER-MANAGER.md](./README-DOCKER-MANAGER.md)
- **VPS Deployment Guide:** [README-VPS-DEPLOY.md](./README-VPS-DEPLOY.md)
- **General Deployment:** [README.md](./README.md)

---

## 🆘 Troubleshooting

### Portainer Issues
```bash
# Restart Portainer
docker restart portainer

# View logs
docker logs portainer
```

### Windmill Issues
```bash
# Restart Windmill
cd /root/windmill
docker compose restart

# View logs
docker compose logs -f
```

### Application Issues
```bash
# View app logs
docker logs cortexbuild-app

# Restart app
docker restart cortexbuild-app

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## ✅ Deployment Verification

After deployment, verify:

1. **Containers Running:**
   ```bash
   docker ps
   # Should show: cortexbuild-app, cortexbuild-db
   ```

2. **Health Checks:**
   ```bash
   curl -I http://localhost:3000/api/auth/providers
   # Should return: HTTP/1.1 200 OK
   ```

3. **Database Connected:**
   ```bash
   docker logs cortexbuild-app | grep "Database"
   # Should show successful connection
   ```

4. **Access Web Interface:**
   - Open browser: `http://YOUR_SERVER_IP:3000`
   - Login with default credentials

---

## 🎯 Best Practices

1. **Security:**
   - Change default passwords in `.env`
   - Generate secure `NEXTAUTH_SECRET`
   - Enable firewall (UFW)
   - Use HTTPS/SSL in production

2. **Monitoring:**
   - Use Portainer dashboards
   - Set up Windmill alerts
   - Monitor disk space
   - Check logs regularly

3. **Backups:**
   - Schedule daily database backups
   - Keep 7 days of backups
   - Test restore procedures

4. **Updates:**
   - Use Windmill for automated updates
   - Test updates in staging first
   - Keep Docker images up to date

---

**Last Updated:** 2026-02-03
