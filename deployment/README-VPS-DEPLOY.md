# CortexBuild Pro - VPS Deployment Guide

## 🎯 New: Docker Manager & Windmill Support

**We now support multiple deployment methods!**

Choose the best option for your needs:
- **[Docker Manager (Portainer)](./QUICKSTART-DOCKER-MANAGER.md)** - Visual web interface for container management
- **[Windmill Automation](./README-DOCKER-MANAGER.md#windmill-workflow-setup)** - Automated deployment workflows
- **[Quick Deploy Script](./quick-deploy.sh)** - Interactive one-command deployment
- **Docker Compose** (This guide) - Traditional CLI deployment

> **Quick Start:** Run `./quick-deploy.sh` for guided deployment

---

## ⚠️ Security Warning

**IMPORTANT:** This file contains production credentials for a specific VPS deployment. 
- Change the root password immediately after first login
- Store credentials securely (password manager)
- Do not share this file publicly
- Consider using SSH keys instead of password authentication
- Restrict SSH access to specific IPs if possible

---

## Server Details
- **IP Address**: 72.62.132.43
- **Root Password**: Cumparavinde1@ *(Change immediately after login)*

## Quick Deployment Steps (Traditional Docker Compose)

### 1. Upload Files to VPS
```bash
# From local machine:
scp -r /home/ubuntu/cortexbuild_pro root@72.62.132.43:/root/
```

### 2. SSH into VPS
```bash
ssh root@72.62.132.43
# Password: Cumparavinde1@
```

### 3. Setup Environment
```bash
cd /root/cortexbuild_pro/deployment
cp .env.production .env
```

### 4. Choose Deployment Method

#### Option A: Quick Deploy (Recommended)
```bash
cd /root/cortexbuild_pro/deployment
./quick-deploy.sh
# Follow the interactive prompts
```

#### Option B: Docker Manager (Portainer)
```bash
cd /root/cortexbuild_pro/deployment
./docker-manager-deploy.sh
# Then access Portainer UI at http://72.62.132.43:9000
```

#### Option C: Windmill Automation
```bash
cd /root/cortexbuild_pro/deployment
./windmill-setup.sh
# Then access Windmill UI at http://72.62.132.43:8000
```

#### Option D: Traditional Docker Compose
```bash
docker compose build app
docker compose up -d
```

### 5. Run Database Migrations
```bash
# Enter the app container
docker exec -it cortexbuild-app sh

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Exit container
exit
```

### 6. Verify Deployment
```bash
# Check containers
docker compose ps

# Check logs
docker compose logs app

# Test endpoint
curl http://localhost:3000
```

## User Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | adrian.stanca1@gmail.com | Cumparavinde1 |
| Company Owner | adrian@ascladdingltd.co.uk | Cumparavinde1 |
| Demo Admin | admin@cortexbuild.com | johndoe123 |
| Project Manager | pm@cortexbuild.com | manager123 |
| Field Worker | worker@cortexbuild.com | worker123 |

## Access URLs
- **HTTP**: http://72.62.132.43
- **Abacus Hosted**: https://cortexbuildpro.abacusai.app

## Troubleshooting

### Check Container Status
```bash
docker compose ps
docker compose logs -f app
```

### Restart Services
```bash
docker compose restart app
```

### Full Rebuild
```bash
docker compose down
docker compose build --no-cache app
docker compose up -d
```

### Database Access
```bash
docker exec -it cortexbuild-db psql -U cortexbuild -d cortexbuild_production
```
