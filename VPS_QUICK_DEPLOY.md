# VPS Deployment - Quick Reference

## 🚀 One-Command Deployment

```bash
./one-command-deploy.sh 'Cumparavinde1@'
```

This will automatically:
- Create deployment package
- Upload to VPS
- Extract files
- Start Docker build

## 📦 Manual Deployment Steps

### 1. Create Package

```bash
./create-deployment-package.sh
```

### 2. Deploy to VPS

```bash
sshpass -p 'Cumparavinde1@' scp cortexbuild_vps_deploy.tar.gz root@72.62.132.43:/root/cortexbuild/
```

### 3. Execute on VPS

```bash
sshpass -p 'Cumparavinde1@' ssh -o StrictHostKeyChecking=no root@72.62.132.43 '
cd /root/cortexbuild
tar -xzf cortexbuild_vps_deploy.tar.gz
cd cortexbuild/deployment
nohup docker compose build --no-cache app > /root/docker_build.log 2>&1 &
'
```

### 4. Monitor and Complete

SSH into VPS:
```bash
ssh root@72.62.132.43
```

Monitor build:
```bash
tail -f /root/docker_build.log
```

Start services after build completes:
```bash
cd /root/cortexbuild/cortexbuild/deployment
docker compose up -d
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

## 📋 Available Scripts

| Script | Purpose |
|--------|---------|
| `create-deployment-package.sh` | Create deployment tarball |
| `one-command-deploy.sh` | Full automated deployment |
| `vps-deploy.sh` | VPS-side deployment script |

## 🔍 Monitoring Commands

```bash
# Check service status
docker compose ps

# View app logs
docker compose logs -f app

# View build log
tail -f /root/docker_build.log

# Check health
curl http://72.62.132.43:3000/api/health
```

## 🛠️ Management Commands

```bash
# Restart services
docker compose restart app

# Stop services
docker compose down

# View all logs
docker compose logs --tail=100

# Access database
docker compose exec postgres psql -U cortexbuild -d cortexbuild
```

## 📚 Documentation

- **Complete Guide:** VPS_DEPLOYMENT_PACKAGE_GUIDE.md
- **Detailed Instructions:** VPS_DEPLOYMENT_INSTRUCTIONS.md
- **Troubleshooting:** TROUBLESHOOTING.md

## 🌐 Access Points

- Application: http://72.62.132.43:3000
- Health Check: http://72.62.132.43:3000/api/health
- Admin Panel: http://72.62.132.43:3000/admin

---

**VPS Server:** 72.62.132.43  
**Deployment Path:** /root/cortexbuild  
**Build Log:** /root/docker_build.log
