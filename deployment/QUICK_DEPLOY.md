# Quick VPS Deployment for 72.62.132.43

## 🚀 Quick Start (Automated)

Run this single command to deploy everything:

```bash
cd deployment
./one-command-deploy.sh
```

This will:
- Test VPS connection
- Create deployment package
- Transfer files to VPS
- Install dependencies
- Configure environment
- Build and start services
- Run database migrations

**Note:** Requires `sshpass` to be installed locally.

## 📦 Manual Deployment (If Automated Fails)

### Step 1: Transfer Files

From your local machine:

```bash
# Create deployment package
cd /home/runner/work/cortexbuild-pro/cortexbuild-pro
tar --exclude='node_modules' --exclude='.next' --exclude='.env' --exclude='.git' \
    -czf cortexbuild-deploy.tar.gz nextjs_space deployment README.md DEPLOYMENT_GUIDE.md

# Transfer to VPS
scp cortexbuild-deploy.tar.gz root@72.62.132.43:/tmp/
```

### Step 2: Deploy on VPS

SSH into the VPS:

```bash
ssh root@72.62.132.43
# Password: Cumparavinde1@
```

Then run:

```bash
# Extract files
mkdir -p /var/www/cortexbuild-pro
cd /var/www/cortexbuild-pro
tar -xzf /tmp/cortexbuild-deploy.tar.gz

# Run deployment
cd deployment
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

## 📋 What Gets Deployed

- **PostgreSQL 15** - Database
- **Next.js Application** - Main app on port 3000
- **Nginx** - Reverse proxy on ports 80/443
- **Certbot** - SSL certificate management

## 🌐 Access After Deployment

- Application: http://72.62.132.43:3000
- Nginx: http://72.62.132.43

## 🔧 Post-Deployment

### View Logs
```bash
ssh root@72.62.132.43
cd /var/www/cortexbuild-pro/deployment
docker-compose logs -f
```

### Restart Services
```bash
docker-compose restart
```

### Update Configuration
```bash
nano /var/www/cortexbuild-pro/deployment/.env
docker-compose restart
```

### Configure SSL (Optional)
```bash
cd /var/www/cortexbuild-pro/deployment
./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com
```

## 🔐 Default Setup

The deployment script automatically generates:
- Secure PostgreSQL password
- Secure NextAuth secret
- Basic environment configuration

**Save these credentials when displayed during deployment!**

## 📚 Full Documentation

- [Complete VPS Deployment Guide](./DEPLOYMENT_TO_VPS.md)
- [General Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Build Status](../BUILD_STATUS.md)

## ⚠️ Troubleshooting

### SSH Connection Fails
- Check VPS is running
- Verify SSH service on port 22
- Check firewall rules
- Use manual deployment method

### Container Won't Start
```bash
docker-compose logs app
docker ps -a
```

### Database Connection Issues
```bash
docker-compose logs postgres
docker-compose exec postgres psql -U cortexbuild -d cortexbuild
```

### Port Already in Use
```bash
netstat -tulpn | grep 3000
docker-compose down
docker-compose up -d
```

## 📞 Support

For issues, check:
1. Container logs: `docker-compose logs -f`
2. System resources: `docker stats`
3. Environment: `cat .env`
4. Documentation: `DEPLOYMENT_TO_VPS.md`
