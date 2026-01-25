# 🚀 Deploy to Your VPS: 72.62.132.43

## One-Command Deployment (Easiest Method)

SSH into your VPS and run this single command:

```bash
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/copilot/build-and-deploy-full-app/deployment/deploy-from-github.sh | sudo bash
```

Or download and run:

```bash
ssh root@72.62.132.43
# Password: Cumparavinde1@

# Then run:
wget https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/copilot/build-and-deploy-full-app/deployment/deploy-from-github.sh
chmod +x deploy-from-github.sh
./deploy-from-github.sh
```

**That's it!** The script will:
1. ✅ Install Docker, Docker Compose, and dependencies
2. ✅ Configure firewall (ports 22, 80, 443, 3000)
3. ✅ Clone the repository from GitHub
4. ✅ Generate secure database password and secrets
5. ✅ Build Docker images
6. ✅ Start all services (Database, App, Nginx)
7. ✅ Run database migrations
8. ✅ Display access URL and credentials

## After Deployment

### Access Your Application
Open in browser: **http://72.62.132.43:3000**

### Create Admin Account
1. Click "Sign Up"
2. Create your admin user
3. Log in and start using CortexBuild Pro

### View Deployment Credentials
```bash
cat /var/www/cortexbuild-pro/DEPLOYMENT_CREDENTIALS.txt
```

**⚠️ IMPORTANT:** Save these credentials securely, then delete the file:
```bash
rm /var/www/cortexbuild-pro/DEPLOYMENT_CREDENTIALS.txt
```

## Management Commands

### View Application Logs
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose logs -f app
```

### View All Service Logs
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose logs -f
```

### Restart Application
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose restart app
```

### Restart All Services
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose restart
```

### Stop All Services
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose down
```

### Start All Services
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose up -d
```

### Check Service Status
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose ps
```

### Access Database
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose exec postgres psql -U cortexbuild -d cortexbuild
```

### Update Application
```bash
cd /var/www/cortexbuild-pro
git pull
cd deployment
docker-compose up -d --build
```

## Configure External Services (Optional)

### Edit Environment Variables
```bash
nano /var/www/cortexbuild-pro/deployment/.env
```

### Configure AWS S3 (File Storage)
Add to .env:
```env
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name
AWS_FOLDER_PREFIX=cortexbuild/
```

### Configure SendGrid (Email)
Add to .env:
```env
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=CortexBuild Pro
```

### Configure AbacusAI (AI Features)
Add to .env:
```env
ABACUSAI_API_KEY=your-api-key
WEB_APP_ID=your-app-id
```

### Apply Configuration Changes
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose restart
```

## Set Up SSL/HTTPS (For Production with Domain)

### Prerequisites
1. Point your domain A record to: 72.62.132.43
2. Wait for DNS propagation (can take 1-24 hours)

### Run SSL Setup
```bash
cd /var/www/cortexbuild-pro/deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### Update Environment for HTTPS
```bash
nano /var/www/cortexbuild-pro/deployment/.env
```

Change:
```env
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_WEBSOCKET_URL=https://yourdomain.com
```

Restart:
```bash
docker-compose restart
```

## Backup Database

### Create Backup
```bash
cd /var/www/cortexbuild-pro/deployment
./backup.sh
```

Backups are saved to: `/var/www/cortexbuild-pro/deployment/backups/`

### Restore from Backup
```bash
cd /var/www/cortexbuild-pro/deployment
./restore.sh backups/backup-YYYYMMDD-HHMMSS.sql.gz
```

## Troubleshooting

### Application Not Loading
```bash
# Check if containers are running
docker ps

# Check application logs
cd /var/www/cortexbuild-pro/deployment
docker-compose logs app

# Restart application
docker-compose restart app
```

### Database Connection Errors
```bash
# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Verify database is accessible
docker-compose exec postgres pg_isready -U cortexbuild
```

### Port 3000 Already in Use
```bash
# Find what's using the port
netstat -tulpn | grep 3000

# Stop all services and restart
cd /var/www/cortexbuild-pro/deployment
docker-compose down
docker-compose up -d
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a

# Remove old images
docker image prune -a
```

### Reset Everything (⚠️ Destroys All Data)
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose down -v  # -v removes volumes (database data)
rm -rf /var/www/cortexbuild-pro
# Then run deployment script again
```

## Monitoring

### Check System Resources
```bash
# CPU and Memory usage
docker stats

# Disk usage
df -h

# Container resource usage
docker stats --no-stream
```

### Health Check
```bash
# Test application endpoint
curl http://localhost:3000/api/auth/providers

# Check with external IP
curl http://72.62.132.43:3000/api/auth/providers
```

## Security Best Practices

1. **Change SSH Password**
   ```bash
   passwd root
   ```

2. **Set Up SSH Key Authentication**
   ```bash
   mkdir -p ~/.ssh
   nano ~/.ssh/authorized_keys
   # Add your public key
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Disable Password Authentication** (after adding SSH key)
   ```bash
   nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   systemctl restart sshd
   ```

4. **Regular Updates**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

5. **Enable Automatic Security Updates**
   ```bash
   apt-get install unattended-upgrades
   dpkg-reconfigure -plow unattended-upgrades
   ```

## Support & Documentation

- **Full Deployment Guide**: `/var/www/cortexbuild-pro/DEPLOYMENT_GUIDE.md`
- **VPS Deployment Details**: `/var/www/cortexbuild-pro/deployment/DEPLOYMENT_TO_VPS.md`
- **Application README**: `/var/www/cortexbuild-pro/README.md`
- **Build Status**: `/var/www/cortexbuild-pro/BUILD_STATUS.md`

## Quick Reference

| Action | Command |
|--------|---------|
| View logs | `cd /var/www/cortexbuild-pro/deployment && docker-compose logs -f` |
| Restart app | `cd /var/www/cortexbuild-pro/deployment && docker-compose restart` |
| Stop all | `cd /var/www/cortexbuild-pro/deployment && docker-compose down` |
| Start all | `cd /var/www/cortexbuild-pro/deployment && docker-compose up -d` |
| Update app | `cd /var/www/cortexbuild-pro && git pull && cd deployment && docker-compose up -d --build` |
| Backup DB | `cd /var/www/cortexbuild-pro/deployment && ./backup.sh` |
| Check status | `cd /var/www/cortexbuild-pro/deployment && docker-compose ps` |

---

**Need Help?** Check the logs first:
```bash
cd /var/www/cortexbuild-pro/deployment && docker-compose logs -f
```
