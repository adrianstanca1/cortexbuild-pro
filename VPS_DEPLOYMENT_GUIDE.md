# 🚀 CortexBuild Pro - Complete VPS Deployment Guide

**Last Updated:** January 26, 2026  
**Target:** Production VPS (Ubuntu 20.04+)  
**Domain:** www.cortexbuildpro.com (configurable)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [DNS Configuration](#dns-configuration)
4. [Server Setup](#server-setup)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Application Deployment](#application-deployment)
8. [WebSocket Configuration](#websocket-configuration)
9. [SSL/HTTPS Setup](#ssl-https-setup)
10. [Verification & Testing](#verification-testing)
11. [Troubleshooting](#troubleshooting)
12. [Monitoring & Maintenance](#monitoring-maintenance)

---

## 📦 Prerequisites

Before you begin, ensure you have:

- ✅ VPS server with Ubuntu 20.04+ (minimum 2GB RAM, 2 CPU cores, 20GB disk)
- ✅ Domain name registered (e.g., cortexbuildpro.com)
- ✅ SSH access to the server with root/sudo privileges
- ✅ Basic knowledge of Linux command line
- ✅ AWS account for S3 storage (or alternative storage solution)
- ✅ AbacusAI API key for AI features

---

## 💻 Server Requirements

### Minimum Specifications
- **OS:** Ubuntu 20.04 LTS or later
- **RAM:** 2GB (4GB recommended)
- **CPU:** 2 cores (4 cores recommended)
- **Storage:** 20GB (40GB+ recommended)
- **Ports:** 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Recommended VPS Providers
- DigitalOcean (Droplet)
- Linode
- AWS EC2
- Vultr
- Hetzner

---

## 🌐 DNS Configuration

### Step 1: Add DNS Records

Log into your domain registrar or DNS provider and add the following records:

```
Type    Name                    Value               TTL
A       @                       YOUR_SERVER_IP      3600
A       www                     YOUR_SERVER_IP      3600
CNAME   *.cortexbuildpro.com   cortexbuildpro.com  3600
```

Replace `YOUR_SERVER_IP` with your VPS IP address.

### Step 2: Verify DNS Propagation

```bash
# Check main domain
dig cortexbuildpro.com +short

# Check www subdomain
dig www.cortexbuildpro.com +short

# Both should return your server IP
```

**Note:** DNS propagation can take 1-48 hours (typically 15-30 minutes).

---

## 🔧 Server Setup

### Step 1: Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
# or
ssh your_username@YOUR_SERVER_IP
```

### Step 2: Update System

```bash
# Update package lists
apt update && apt upgrade -y

# Install essential tools
apt install -y curl git wget ufw
```

### Step 3: Configure Firewall

```bash
# Allow SSH (IMPORTANT: Do this first!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### Step 4: Install Docker

```bash
# Install Docker using official script
curl -fsSL https://get.docker.com | sh

# Add current user to docker group (if not root)
usermod -aG docker $USER

# Start Docker service
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
```

### Step 5: Install Docker Compose

```bash
# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Verify installation
docker compose version
```

---

## 📂 Application Deployment

### Step 1: Clone Repository

```bash
# Navigate to desired directory
cd /opt

# Clone the repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git

# Navigate to project
cd cortexbuild-pro
```

### Step 2: Configure Environment Variables

```bash
# Navigate to deployment directory
cd deployment

# Edit the .env file
nano .env
```

### Required Environment Variables (MUST CHANGE):

```env
# Database credentials
POSTGRES_PASSWORD=your_secure_password_here

# NextAuth configuration
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=https://www.cortexbuildpro.com

# Domain configuration
DOMAIN=www.cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com

# AWS S3 Configuration
AWS_REGION=us-west-2
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_FOLDER_PREFIX=cortexbuild/

# AbacusAI API
ABACUSAI_API_KEY=your_abacusai_api_key
WEB_APP_ID=your_web_app_id
NOTIF_ID_MILESTONE_DEADLINE_REMINDER=your_notif_id
NOTIF_ID_TOOLBOX_TALK_COMPLETED=your_notif_id
NOTIF_ID_MEWP_CHECK_COMPLETED=your_notif_id
NOTIF_ID_TOOL_CHECK_COMPLETED=your_notif_id

# WebSocket URL
NEXT_PUBLIC_WEBSOCKET_URL=https://www.cortexbuildpro.com
```

### Generate Secure Secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -hex 32
```

---

## 🗄️ Database Setup

### Option 1: Use Docker PostgreSQL (Recommended)

The Docker Compose configuration includes PostgreSQL. No additional setup needed.

```bash
# Database runs in Docker container
# Data is persisted in Docker volume 'postgres_data'
```

### Option 2: Use External Database

If using an external PostgreSQL database:

```env
# Update DATABASE_URL in deployment/.env
DATABASE_URL="postgresql://user:password@your-db-host:5432/cortexbuild?schema=public"
```

---

## 🚢 Application Deployment

### Step 1: Build and Start Services

```bash
# Navigate to deployment directory
cd /opt/cortexbuild-pro/deployment

# Build and start all services
docker compose up -d

# This will:
# 1. Build the Next.js application
# 2. Start PostgreSQL database
# 3. Start the application server
# 4. Start Nginx reverse proxy
# 5. Start Certbot for SSL
```

### Step 2: Check Service Status

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx
```

### Step 3: Run Database Migrations

```bash
# Run Prisma migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Generate Prisma client (if needed)
docker compose exec app sh -c "cd /app && npx prisma generate"
```

### Step 4: Seed Database (Optional)

```bash
# Seed initial data
docker compose exec app sh -c "cd /app && npx prisma db seed"
```

---

## 🔌 WebSocket Configuration

### WebSocket Endpoint

The application uses Socket.IO for real-time communication:

- **Development:** `ws://localhost:3000/api/socketio`
- **Production:** `wss://www.cortexbuildpro.com/api/socketio`

### Nginx WebSocket Proxy

The Nginx configuration already includes WebSocket support:

```nginx
# WebSocket upgrade headers
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Environment Variables

Ensure these are set in `deployment/.env`:

```env
NEXT_PUBLIC_WEBSOCKET_URL=https://www.cortexbuildpro.com
WEBSOCKET_PORT=3000
```

---

## 🔒 SSL/HTTPS Setup

### Automatic SSL with Let's Encrypt

```bash
# Navigate to deployment directory
cd /opt/cortexbuild-pro/deployment

# Run SSL setup script
chmod +x setup-ssl.sh
./setup-ssl.sh
```

### Manual SSL Setup

```bash
# Obtain SSL certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@cortexbuildpro.com \
  --agree-tos \
  --no-eff-email \
  -d cortexbuildpro.com \
  -d www.cortexbuildpro.com

# Restart Nginx to apply SSL
docker compose restart nginx
```

### SSL Certificate Renewal

Certbot automatically renews certificates. To manually renew:

```bash
docker compose run --rm certbot renew
docker compose restart nginx
```

---

## ✅ Verification & Testing

### Step 1: Check Application Health

```bash
# Health check endpoint
curl http://localhost:3000/api/auth/providers

# Should return JSON with auth providers
```

### Step 2: Test from Browser

1. Open browser and navigate to: `https://www.cortexbuildpro.com`
2. You should see the CortexBuild Pro login page
3. Create a test account or login

### Step 3: Test WebSocket Connection

1. Login to the application
2. Open browser console (F12)
3. Check for WebSocket connection messages
4. Look for: "Socket.IO client connected"

### Step 4: Run System Diagnostics

```bash
# Run diagnostics from host machine
docker compose exec app sh -c "cd /app && npx tsx scripts/system-diagnostics.ts"
```

### Step 5: Test API Endpoints

```bash
# Test health endpoint
curl https://www.cortexbuildpro.com/api/auth/providers

# Test dashboard API (requires authentication)
# Use browser dev tools to get auth token
```

---

## 🔍 Troubleshooting

### Issue: Cannot connect to database

**Solution:**

```bash
# Check PostgreSQL container status
docker compose ps postgres

# View database logs
docker compose logs postgres

# Verify DATABASE_URL is correct
docker compose exec app printenv DATABASE_URL

# Test database connection
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT version();"
```

### Issue: Application won't start

**Solution:**

```bash
# Check application logs
docker compose logs app

# Rebuild and restart
docker compose down
docker compose up -d --build

# Check for port conflicts
netstat -tlnp | grep :3000
```

### Issue: WebSocket connection fails

**Solution:**

```bash
# Verify WebSocket URL
docker compose exec app printenv NEXT_PUBLIC_WEBSOCKET_URL

# Check Nginx configuration
docker compose exec nginx cat /etc/nginx/nginx.conf

# Restart Nginx
docker compose restart nginx

# Check browser console for errors
```

### Issue: SSL certificate error

**Solution:**

```bash
# Check certificate status
docker compose run --rm certbot certificates

# Renew certificate
docker compose run --rm certbot renew

# Restart Nginx
docker compose restart nginx
```

### Issue: File uploads fail

**Solution:**

```bash
# Verify AWS credentials
docker compose exec app printenv | grep AWS

# Check S3 bucket permissions
# Ensure bucket has proper CORS configuration

# Test AWS connection
docker compose exec app sh -c "cd /app && npx tsx scripts/test-api-connections.ts"
```

---

## 📊 Monitoring & Maintenance

### View Container Status

```bash
# List all containers
docker compose ps

# View resource usage
docker stats
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx

# Last 100 lines
docker compose logs --tail=100 app
```

### Backup Database

```bash
# Navigate to deployment directory
cd /opt/cortexbuild-pro/deployment

# Run backup script
chmod +x backup.sh
./backup.sh

# Backups are stored in: ./backups/
```

### Restore Database

```bash
# Navigate to deployment directory
cd /opt/cortexbuild-pro/deployment

# Run restore script
chmod +x restore.sh
./restore.sh path/to/backup.sql
```

### Update Application

```bash
# Navigate to project directory
cd /opt/cortexbuild-pro

# Pull latest changes
git pull origin main

# Rebuild and restart
cd deployment
docker compose down
docker compose up -d --build

# Run migrations if needed
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart postgres
docker compose restart nginx
```

### Stop Services

```bash
# Stop all services (data persists)
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (WARNING: deletes data)
docker compose down -v
```

---

## 🔐 Security Best Practices

1. **Change default credentials** - Never use example passwords
2. **Keep system updated** - Run `apt update && apt upgrade` regularly
3. **Use strong passwords** - Generate with `openssl rand -hex 32`
4. **Enable firewall** - Only allow necessary ports
5. **Secure SSH** - Use key-based authentication, disable password login
6. **Monitor logs** - Regularly check application and system logs
7. **Backup regularly** - Automate database backups
8. **Limit API access** - Use environment-specific API keys
9. **Enable HTTPS** - Always use SSL/TLS in production
10. **Rotate secrets** - Periodically change NEXTAUTH_SECRET and passwords

---

## 📚 Additional Resources

- [API Setup Guide](../API_SETUP_GUIDE.md)
- [Configuration Checklist](../CONFIGURATION_CHECKLIST.md)
- [Deployment Summary](../DEPLOYMENT_SUMMARY.md)
- [Application README](../nextjs_space/README.md)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `docker compose logs -f`
2. Review troubleshooting section above
3. Run diagnostics: `docker compose exec app sh -c "cd /app && npx tsx scripts/system-diagnostics.ts"`
4. Check GitHub issues: https://github.com/adrianstanca1/cortexbuild-pro/issues
5. Review documentation in project root

---

## ✅ Deployment Checklist

- [ ] Server meets minimum requirements
- [ ] DNS records configured and propagated
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned to server
- [ ] Environment variables configured in `deployment/.env`
- [ ] All required API keys obtained and set
- [ ] Secure passwords generated for database and NextAuth
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Services started with `docker compose up -d`
- [ ] Database migrations run successfully
- [ ] SSL certificate obtained and configured
- [ ] Application accessible via HTTPS
- [ ] WebSocket connection working
- [ ] File uploads working (S3 configured)
- [ ] Test account created and working
- [ ] System diagnostics run successfully
- [ ] Backup system configured
- [ ] Monitoring in place

---

**🎉 Congratulations!** Your CortexBuild Pro deployment is complete!
