# CortexBuild Pro - Public Launch Guide

Complete guide to deploy CortexBuild Pro to production with Docker Manager (Portainer) on VPS.

## 🚀 Quick Start - One Command Public Launch

The fastest way to deploy CortexBuild Pro to your VPS for public access:

```bash
# On your VPS server, navigate to the deployment directory
cd /root/cortexbuild-pro/deployment

# Run the master public launch script
sudo ./public-launch-master.sh -y

# Or with custom domain and SSL
sudo ./public-launch-master.sh --domain cortexbuildpro.com --email admin@cortexbuildpro.com --with-ssl -y
```

---

## 📋 Pre-Launch Checklist

### Server Requirements

- [ ] **VPS with 2GB+ RAM** (4GB recommended for production)
- [ ] **Ubuntu 20.04+ or Debian 11+**
- [ ] **Root SSH access**
- [ ] **Ports 80, 443, 3000, 9000 open** in firewall

### DNS Configuration

- [ ] **A record** pointing `cortexbuildpro.com` → `VPS_IP`
- [ ] **A record** pointing `www.cortexbuildpro.com` → `VPS_IP`
- [ ] **DNS propagation verified** (use `nslookup cortexbuildpro.com`)

### Repository Setup

- [ ] Repository cloned to `/root/cortexbuild-pro` on VPS
- [ ] Latest code pulled (`git pull origin main`)
- [ ] `.env` file configured with production values

---

## 🎯 Deployment Methods

### Method 1: Public Launch Master Script (Recommended)

The `public-launch-master.sh` script handles everything automatically:

```bash
# Full deployment with Docker Manager and SSL
sudo ./public-launch-master.sh \
    --domain cortexbuildpro.com \
    --email admin@cortexbuildpro.com \
    --with-ssl \
    -y
```

#### Available Options:

| Option | Description |
|--------|-------------|
| `--domain DOMAIN` | Set your public domain |
| `--email EMAIL` | Email for SSL certificates |
| `--vps-ip IP` | VPS IP address |
| `--skip-build` | Skip Docker image build |
| `--with-portainer` | Install Portainer (Docker Manager) |
| `--no-portainer` | Skip Portainer installation |
| `--with-ssl` | Configure SSL with Let's Encrypt |
| `--seed-db` | Seed database with sample data |
| `-y, --yes` | Skip confirmation prompts |

### Method 2: Docker Manager (Portainer) Web Interface

1. **Access Portainer**: `http://YOUR_VPS_IP:9000`
2. **Create admin account** on first visit
3. **Go to Stacks** → **Add Stack**
4. **Name**: `cortexbuild-pro`
5. **Build method**: Web Editor
6. **Paste** contents of `docker-stack.yml`
7. **Add environment variables** from `portainer-stack-env.txt`
8. **Click "Deploy the stack"**

### Method 3: Docker Compose (Manual)

```bash
cd /root/cortexbuild-pro/deployment

# Configure environment
cp .env.example .env
nano .env  # Edit with your production values

# Build and deploy
docker compose build --no-cache
docker compose up -d

# Run migrations
docker compose exec app npx prisma migrate deploy
```

---

## 🔧 Step-by-Step Deployment

### Step 1: Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Clone/Update Repository

```bash
# First time setup
git clone https://github.com/adrianstanca1/cortexbuild-pro.git /root/cortexbuild-pro

# Or update existing
cd /root/cortexbuild-pro
git pull origin main
```

### Step 3: Configure Environment

```bash
cd /root/cortexbuild-pro/deployment

# Create .env from template
cp .env.production .env

# Generate secure secrets
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Edit .env with your values
nano .env
```

### Step 4: Run Public Launch

```bash
# Execute the master deployment script
sudo ./public-launch-master.sh --domain cortexbuildpro.com --with-ssl -y
```

### Step 5: Verify Deployment

```bash
# Check container status
docker compose ps

# View application logs
docker compose logs -f app

# Test endpoints
curl http://localhost:3000/api/auth/providers
```

---

## 🐳 Docker Manager (Portainer) Setup

### Access Portainer

After deployment, Portainer is available at:

- **HTTP**: `http://YOUR_VPS_IP:9000`
- **HTTPS**: `https://YOUR_VPS_IP:9443`

### First-Time Setup

1. Create admin account with strong password
2. Select "Local" environment
3. Connect to Docker socket

### Managing Stacks

**View Stacks:**
- Dashboard → Stacks

**Update Application:**
- Stacks → cortexbuild-pro → Editor → Update

**View Logs:**
- Containers → cortexbuild-app → Logs

**Restart Services:**
- Containers → Select container → Restart

---

## 🔒 SSL Certificate Setup

### Automatic (via script)

```bash
sudo ./public-launch-master.sh --domain cortexbuildpro.com --email admin@cortexbuildpro.com --with-ssl
```

### Manual Setup

```bash
# Install certbot
apt-get update && apt-get install -y certbot

# Obtain certificate
certbot certonly --standalone -d cortexbuildpro.com -d www.cortexbuildpro.com --email admin@cortexbuildpro.com --agree-tos

# Restart services to use SSL
docker compose restart nginx
```

### Renew Certificates

```bash
# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
```

---

## 📊 Post-Deployment Tasks

### Health Check

```bash
cd /root/cortexbuild-pro/deployment
./health-check.sh
```

### Database Backup

```bash
# Create backup
./backup.sh

# Restore backup
./restore.sh /path/to/backup.sql
```

### Update Application

```bash
cd /root/cortexbuild-pro

# Pull latest code
git pull origin main

# Rebuild and deploy
cd deployment
docker compose build --no-cache app
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

---

## 🛠 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Check container status
docker inspect cortexbuild-app

# Restart container
docker compose restart app
```

### Database Issues

```bash
# Check database logs
docker compose logs db

# Test connection
docker compose exec db pg_isready -U cortexbuild

# Reset database (CAUTION: deletes data)
docker compose down -v
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

### SSL Issues

```bash
# Check certificate status
certbot certificates

# Check nginx config
docker compose exec nginx nginx -t

# View nginx logs
docker compose logs nginx
```

### Portainer Access Issues

```bash
# Check if Portainer is running
docker ps | grep portainer

# Restart Portainer
docker restart portainer

# View Portainer logs
docker logs portainer
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `public-launch-master.sh` | Master deployment script |
| `docker-compose.yml` | Docker Compose configuration |
| `docker-stack.yml` | Docker Stack/Portainer configuration |
| `Dockerfile` | Application build instructions |
| `.env` | Environment variables (production) |
| `.env.production` | Environment template |
| `portainer-stack-env.txt` | Portainer environment template |
| `nginx.conf` | Nginx reverse proxy config |
| `health-check.sh` | Health check script |
| `backup.sh` | Database backup script |
| `restore.sh` | Database restore script |

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to git
2. **Use strong passwords** (32+ characters)
3. **Enable firewall** (UFW):
   ```bash
   ufw allow 22/tcp  # SSH
   ufw allow 80/tcp  # HTTP
   ufw allow 443/tcp # HTTPS
   ufw enable
   ```
4. **Restrict Portainer access** to VPN/whitelist in production
5. **Enable 2FA** for Portainer admin
6. **Regular backups** (automated via cron)
7. **Keep secrets in environment variables**

---

## 📞 Support

### Useful Commands Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f app

# Restart application
docker compose restart app

# Check database connection
docker compose exec db psql -U cortexbuild -c "SELECT 1;"

# Run database migrations
docker compose exec app npx prisma migrate deploy

# Seed database
docker compose exec app npx prisma db seed

# Access database shell
docker compose exec db psql -U cortexbuild

# Check disk usage
docker system df

# Clean unused resources
docker system prune -af --volumes
```

### Documentation Links

- **Main README**: `/README.md`
- **Deployment Guide**: `/PRODUCTION_DEPLOYMENT.md`
- **Docker Manager Guide**: `/deployment/README-DOCKER-MANAGER.md`
- **VPS Configuration**: `/VPS_CONNECTION_CONFIG.md`
- **API Setup**: `/API_SETUP_GUIDE.md`

---

## ✅ Launch Checklist

### Before Launch

- [ ] VPS server provisioned with sufficient resources
- [ ] DNS records configured and propagated
- [ ] Repository cloned on VPS
- [ ] Environment variables configured
- [ ] Database password generated securely
- [ ] NEXTAUTH_SECRET generated
- [ ] Encryption key generated

### During Launch

- [ ] Docker image built successfully
- [ ] All containers started
- [ ] Database migrations completed
- [ ] Health checks passing
- [ ] Portainer accessible (if enabled)
- [ ] SSL certificate installed (if enabled)

### After Launch

- [ ] Application accessible via public URL
- [ ] All features tested and working
- [ ] Backup system configured
- [ ] Monitoring enabled
- [ ] Credentials saved securely
- [ ] Documentation updated

---

**Last Updated**: 2026-02-06  
**Version**: 1.0.0
