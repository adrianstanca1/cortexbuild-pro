# CortexBuild Pro - VPS Deployment Guide

## Version

**Current Version:** 1.0.0

The application version is tracked in the `VERSION` file and displayed during deployment and in the application footer.

## Server Details
- **IP Address**: 72.62.132.43
- **Root Password**: Cumparavinde1@

## Quick Deployment Steps

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

### 4. Build and Start
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
