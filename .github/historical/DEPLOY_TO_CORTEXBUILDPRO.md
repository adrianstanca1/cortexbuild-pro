# 🚀 CortexBuild Pro - Deployment to www.cortexbuildpro.com

**Status:** ✅ Ready for Production Deployment  
**Target Domain:** www.cortexbuildpro.com  
**Generated:** January 26, 2026

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Domain `cortexbuildpro.com` registered and DNS configured
- [ ] Server/VPS with Ubuntu 20.04+ (minimum 2GB RAM, 2 CPU cores, 20GB disk)
- [ ] SSH access to the server
- [ ] Root or sudo privileges
- [ ] Docker and Docker Compose installed on server
- [ ] Ports 80, 443, and 22 open in firewall

---

## 🌐 DNS Configuration

### Required DNS Records

Point your domain to your server IP address:

```
Type    Name                Value               TTL
A       cortexbuildpro.com  YOUR_SERVER_IP      3600
A       www                 YOUR_SERVER_IP      3600
```

**Verification:**
```bash
# Check if DNS is propagated
dig cortexbuildpro.com +short
dig www.cortexbuildpro.com +short
```

Wait for DNS propagation (can take 1-48 hours, typically 15-30 minutes).

---

## 🔧 Server Setup

### 1. Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
# or
ssh your_user@YOUR_SERVER_IP
```

### 2. Install Docker and Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Enable Docker to start on boot
systemctl enable docker
systemctl start docker
```

### 3. Configure Firewall

```bash
# Install UFW if not already installed
apt install ufw -y

# Allow SSH (important - do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## 📦 Application Deployment

### 1. Clone Repository

```bash
# Navigate to deployment directory
cd /var/www

# Clone the repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro
```

### 2. Configure Environment

```bash
# Navigate to deployment directory
cd deployment

# The .env file is already created, but you need to set a secure database password
nano .env
```

**⚠️ IMPORTANT:** Replace `REPLACE_WITH_SECURE_PASSWORD` with a strong, unique password:

```bash
# Generate a secure password
openssl rand -base64 32
```

Update these lines in `.env`:
```env
POSTGRES_PASSWORD=YOUR_GENERATED_PASSWORD
DATABASE_URL="postgresql://cortexbuild:YOUR_GENERATED_PASSWORD@postgres:5432/cortexbuild?schema=public"
```

The following are already configured correctly:
- ✅ `NEXTAUTH_SECRET` - Already set with secure random value
- ✅ `NEXTAUTH_URL=https://www.cortexbuildpro.com`
- ✅ `DOMAIN=cortexbuildpro.com`
- ✅ `NEXT_PUBLIC_WEBSOCKET_URL=https://www.cortexbuildpro.com`

**Optional Services** (configure if needed):
- AWS S3 for file storage
- SendGrid for transactional emails
- Google OAuth for social login
- AbacusAI for AI features

### 3. Build and Start Services

```bash
# Build Docker images
docker compose build

# Start services (without SSL first)
docker compose up -d postgres app

# Check if services are running
docker compose ps

# View logs to ensure everything is starting correctly
docker compose logs -f
```

**Expected output:**
- `cortexbuild-db` should be healthy
- `cortexbuild-app` should be running and healthy

### 4. Run Database Migrations

```bash
# Run Prisma migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Optional: Seed database with sample data
docker compose exec app sh -c "cd /app && npx prisma db seed"
```

### 5. Test Application (Without SSL)

```bash
# Test if the application is responding
curl http://localhost:3000/api/auth/providers

# Expected: JSON response with authentication providers
```

You can also test by visiting `http://YOUR_SERVER_IP:3000` in your browser.

---

## 🔐 SSL/HTTPS Setup

### Before Starting SSL Setup

Ensure:
1. DNS records are propagated (test with `dig cortexbuildpro.com`)
2. Application is running on port 3000
3. Ports 80 and 443 are accessible

### Run SSL Setup Script

```bash
# Still in /var/www/cortexbuild-pro/deployment directory
./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com
```

This script will:
1. Request SSL certificates from Let's Encrypt
2. Configure Nginx with HTTPS
3. Update environment variables
4. Start Nginx with SSL

**If you encounter issues:**
```bash
# Check if ports are open
netstat -tulpn | grep -E ':80|:443'

# View nginx logs
docker compose logs nginx

# Manually obtain certificate
docker compose run --rm certbot certonly \
    --standalone \
    --email admin@cortexbuildpro.com \
    --agree-tos \
    -d cortexbuildpro.com \
    -d www.cortexbuildpro.com
```

### 6. Restart All Services with SSL

```bash
docker compose down
docker compose up -d

# Check all services
docker compose ps
```

---

## ✅ Verify Deployment

### 1. Check Services

```bash
# All services should be running
docker compose ps

# Expected output:
# cortexbuild-db        running (healthy)
# cortexbuild-app       running (healthy)
# cortexbuild-nginx     running
# cortexbuild-certbot   running
```

### 2. Test HTTP to HTTPS Redirect

```bash
curl -I http://www.cortexbuildpro.com
# Should return 301 redirect to https://
```

### 3. Test HTTPS

```bash
curl https://www.cortexbuildpro.com/api/auth/providers
# Should return JSON with authentication providers
```

### 4. Access in Browser

Open your browser and navigate to:
- **https://www.cortexbuildpro.com** ✅
- **https://cortexbuildpro.com** ✅

You should see the CortexBuild Pro login page.

### 5. Create Admin Account

1. Click "Sign Up"
2. Enter your details:
   - Full Name
   - Email
   - Password
   - Company Name
3. Submit

**The first user automatically becomes a platform administrator.**

---

## 📊 Post-Deployment

### View Application Logs

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx
```

### Access Database

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Common queries
\dt                          # List tables
SELECT COUNT(*) FROM "User"; # Count users
\q                           # Quit
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart app
```

### Update Application

```bash
cd /var/www/cortexbuild-pro

# Pull latest changes
git pull origin main

# Rebuild and restart
cd deployment
docker compose down
docker compose build --no-cache
docker compose up -d

# Run migrations if there are schema changes
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

---

## 🔄 Backup and Restore

### Automated Backup

```bash
# Setup daily backup (run once)
cd /var/www/cortexbuild-pro/deployment

# Make backup script executable
chmod +x backup.sh

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/cortexbuild-pro/deployment/backup.sh") | crontab -
```

### Manual Backup

```bash
cd /var/www/cortexbuild-pro/deployment

# Run backup script
./backup.sh

# Backups are stored in: ./backups/
ls -lh backups/
```

### Restore from Backup

```bash
cd /var/www/cortexbuild-pro/deployment

# Restore from specific backup
./restore.sh backups/cortexbuild_backup_YYYY-MM-DD_HH-MM-SS.sql
```

---

## 🔍 Monitoring and Health Checks

### System Health

```bash
# Check Docker container health
docker compose ps

# Check Docker stats (CPU, Memory usage)
docker stats

# Check disk space
df -h
```

### Application Health Endpoints

```bash
# Basic health check
curl https://www.cortexbuildpro.com/api/auth/providers

# System health (requires admin login)
curl https://www.cortexbuildpro.com/api/admin/system-health
```

### SSL Certificate Renewal

SSL certificates auto-renew via the certbot container. To manually renew:

```bash
docker compose run --rm certbot renew
docker compose restart nginx
```

Check certificate expiration:
```bash
echo | openssl s_client -servername www.cortexbuildpro.com -connect www.cortexbuildpro.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose logs app

# Common issues:
# 1. Database not ready - wait a few seconds and check again
# 2. Environment variables missing - verify .env file
# 3. Port already in use - check with: netstat -tulpn | grep 3000
```

### Database Connection Errors

```bash
# Check if database is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Test database connection
docker compose exec postgres pg_isready -U cortexbuild
```

### SSL Certificate Issues

```bash
# Check if domain resolves to your server
dig www.cortexbuildpro.com +short

# Check if ports 80 and 443 are open
curl -I http://www.cortexbuildpro.com

# View nginx logs
docker compose logs nginx

# Manually renew certificate
docker compose run --rm certbot renew --force-renewal
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old backups
cd /var/www/cortexbuild-pro/deployment/backups
ls -lt | tail -n +8 | awk '{print $9}' | xargs rm -f
```

---

## 🔒 Security Best Practices

### After Deployment

1. **Change Default Passwords**
   - Update PostgreSQL password if you used a simple one
   - Update all admin account passwords

2. **Enable Firewall**
   ```bash
   ufw status
   # Should show: Status: active
   ```

3. **Keep System Updated**
   ```bash
   apt update && apt upgrade -y
   ```

4. **Monitor Logs Regularly**
   ```bash
   docker compose logs --tail=100
   ```

5. **Setup Automated Backups**
   - Already configured in the backup section above

6. **Secure SSH Access**
   ```bash
   # Disable root login
   nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   systemctl restart sshd
   ```

---

## 📞 Support and Resources

### Documentation
- **Main README**: `/README.md`
- **API Setup Guide**: `/API_SETUP_GUIDE.md`
- **Code Structure**: `/CODE_STRUCTURE.md`
- **Security Guide**: `/SECURITY_COMPLIANCE.md`

### Quick Commands Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart application
docker compose restart app

# Access database
docker compose exec postgres psql -U cortexbuild -d cortexbuild

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Backup database
./backup.sh

# Check service health
docker compose ps
```

---

## 🎉 Deployment Complete!

Your CortexBuild Pro application is now live at:
- **https://www.cortexbuildpro.com**
- **https://cortexbuildpro.com**

### Next Steps

1. ✅ Create your admin account via signup
2. ✅ Configure platform settings in Admin Console
3. ✅ Set up optional services (S3, SendGrid, etc.)
4. ✅ Invite team members
5. ✅ Create your first project

---

**Deployment Date:** January 26, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
