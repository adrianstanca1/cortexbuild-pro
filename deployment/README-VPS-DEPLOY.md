# CortexBuild Pro - VPS Deployment Guide

## Version

**Current Version:** 2.1.0

The application version is tracked in the `VERSION` file and displayed during deployment and in the application footer.

## Server Configuration

**IMPORTANT:** This section should contain your VPS-specific configuration.

For security reasons:
- **DO NOT** commit actual server IP addresses or credentials to version control
- Store sensitive information in a secure password manager
- Use SSH keys instead of password authentication when possible
- Change default passwords immediately after initial setup
- Restrict SSH access to specific IP addresses if possible

### Example Configuration (Replace with your values):

```bash
# VPS Details (DO NOT commit real values)
export VPS_IP="YOUR_SERVER_IP"
export VPS_USER="YOUR_USERNAME"

# Use SSH keys instead of passwords
ssh-copy-id $VPS_USER@$VPS_IP
```

## Quick Deployment Steps (Traditional Docker Compose)

### 1. Upload Files to VPS
```bash
# From local machine (replace with your values):
scp -r /path/to/cortexbuild_pro $VPS_USER@$VPS_IP:/home/$VPS_USER/
```

### 2. SSH into VPS
```bash
# Using SSH key (recommended)
ssh $VPS_USER@$VPS_IP

# Or using password (less secure)
# ssh $VPS_USER@$VPS_IP
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
# Then access Portainer UI at http://YOUR_SERVER_IP:9000
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
