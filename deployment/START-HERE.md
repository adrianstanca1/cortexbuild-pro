# 🚀 DEPLOYMENT INSTRUCTIONS - START HERE

## Quick Start - Deploy to VPS in 5 Minutes

You have **TWO options** to deploy:

---

## ✅ OPTION 1: Automated Deployment (Recommended)

### Step 1: Connect to Your VPS

Open your terminal and connect:

```bash
ssh root@72.62.132.43
# When prompted, enter password: Cumparavinde1@
```

### Step 2: Run One-Command Deployment

Once connected to the VPS, run this single command:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/vps-full-deploy.sh)
```

**OR** if that doesn't work, use this:

```bash
# Download script
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/vps-full-deploy.sh -o /tmp/deploy.sh

# Make executable
chmod +x /tmp/deploy.sh

# Run it
sudo bash /tmp/deploy.sh
```

### What This Does:
1. ✅ Installs Docker & Docker Compose
2. ✅ Installs Git
3. ✅ Clones your repository
4. ✅ Configures environment variables
5. ✅ Builds Docker image (fresh, no cache)
6. ✅ Starts all services
7. ✅ Runs database migrations
8. ✅ Seeds database (optional)
9. ✅ Configures firewall
10. ✅ Runs health checks

**Time:** 10-15 minutes

---

## ✅ OPTION 2: Manual Step-by-Step

If you prefer manual control, follow these steps:

### 1. Connect to VPS
```bash
ssh root@72.62.132.43
# Password: Cumparavinde1@
```

### 2. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Start Docker
systemctl enable docker
systemctl start docker

# Install Docker Compose plugin
apt-get update
apt-get install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

### 3. Install Git & Clone Repository
```bash
# Install Git
apt-get install -y git

# Clone repository
cd /root
git clone https://github.com/adrianstanca1/cortexbuild-pro.git

# Navigate to project
cd cortexbuild-pro
```

### 4. Configure Environment
```bash
# Copy production environment file
cp deployment/.env.production .env

# Set proper permissions
chmod 600 .env

# Verify configuration
cat .env
```

### 5. Build Docker Image
```bash
cd deployment

# Build image (this takes 5-10 minutes)
docker build --no-cache -t cortexbuild-app:latest -f Dockerfile ..

# Tag with timestamp for backup
docker tag cortexbuild-app:latest cortexbuild-app:$(date +%Y%m%d_%H%M%S)

# Verify
docker images | grep cortexbuild
```

### 6. Deploy Services
```bash
# Start all services
docker compose up -d

# Wait for database
sleep 30

# Check status
docker compose ps
```

### 7. Run Database Setup
```bash
# Run migrations
docker compose exec app npx prisma migrate deploy

# Seed database (optional - creates admin user and sample data)
docker compose exec app npx prisma db seed
```

### 8. Configure Firewall
```bash
# Install UFW
apt-get install -y ufw

# Allow required ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Enable firewall
ufw enable

# Check status
ufw status
```

### 9. Verify Deployment
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f app

# Test application
curl -I http://localhost:3000/
```

---

## 🌐 Access Your Application

After deployment completes:

1. **Via IP Address:** http://72.62.132.43:3000
2. **Via Domain:** http://cortexbuildpro.com:3000 (after DNS configuration)
3. **With SSL:** https://cortexbuildpro.com (after SSL setup)

---

## 🔑 Important Information

### Database Credentials
- **User:** cortexbuild
- **Password:** CortexSecure2026 (⚠️ Change this in production!)
- **Database:** cortexbuild
- **Host:** localhost (from VPS) or db (from Docker network)
- **Port:** 5433 (external) or 5432 (internal)

### API Keys (Already Configured)
- **AbacusAI API Key:** aab7e27d61c14a81a2bcf4d395478e4c ✅

### Application Settings
- **Domain:** cortexbuildpro.com
- **Port:** 3000
- **Environment:** Production

---

## 🔒 Security Recommendations

**Before going live, you should:**

1. **Change Database Password:**
   ```bash
   cd /root/cortexbuild-pro
   nano .env
   # Update POSTGRES_PASSWORD and DATABASE_URL with new password
   # Save and exit (Ctrl+X, Y, Enter)
   
   # Restart services
   cd deployment
   docker compose down
   docker compose up -d
   ```

2. **Generate New Secrets:**
   ```bash
   # Generate new NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate new ENCRYPTION_KEY
   openssl rand -hex 32
   
   # Update .env with these new values
   nano /root/cortexbuild-pro/.env
   ```

3. **Set Up SSL:**
   ```bash
   cd /root/cortexbuild-pro/deployment
   bash setup-ssl.sh
   ```

---

## 📊 Useful Commands

```bash
# View application logs
cd /root/cortexbuild-pro/deployment
docker compose logs -f app

# Restart application
docker compose restart app

# Check service status
docker compose ps

# Access database
docker compose exec db psql -U cortexbuild -d cortexbuild

# Run health check
bash health-check.sh

# Create backup
bash backup.sh

# Update application
cd /root/cortexbuild-pro
git pull origin main
cd deployment
docker compose up -d --build
```

---

## 🆘 Troubleshooting

### Application not accessible?
```bash
# Check if services are running
docker compose ps

# Check application logs
docker compose logs app

# Check if port is open
netstat -tulpn | grep 3000

# Restart application
docker compose restart app
```

### Database connection error?
```bash
# Check database status
docker compose logs db

# Test database connection
docker compose exec db pg_isready -U cortexbuild

# Restart database
docker compose restart db
```

### Port already in use?
```bash
# Find what's using port 3000
lsof -i :3000

# Or
netstat -tulpn | grep 3000

# Stop the conflicting service or change port in docker-compose.yml
```

---

## 📚 Complete Documentation

For detailed information, see:

- **[VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)** - Complete deployment guide
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick reference card
- **[README-DOCKER-MANAGER.md](README-DOCKER-MANAGER.md)** - Docker Manager/Portainer setup
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[../README.md](../README.md)** - Main project documentation

---

## ✅ Deployment Checklist

After deployment, verify:

- [ ] Connected to VPS successfully
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned to /root/cortexbuild-pro
- [ ] .env file configured
- [ ] Docker image built successfully
- [ ] All services running (docker compose ps)
- [ ] Database healthy and accessible
- [ ] Migrations completed
- [ ] Application accessible at http://72.62.132.43:3000
- [ ] Logs show no critical errors
- [ ] Firewall configured
- [ ] Admin can log in

---

## 🎉 Success!

Once deployment is complete, your CortexBuild Pro application will be:

✅ **Running** at http://72.62.132.43:3000  
✅ **Production-ready** with real API keys  
✅ **Database configured** and migrated  
✅ **Secure** with firewall protection  
✅ **Backed up** (once you set up backup schedule)

---

## 🚀 Next Steps After Deployment

1. **Test the application** - Visit http://72.62.132.43:3000 and verify it works
2. **Log in as admin** - Use credentials from seed script or create new admin
3. **Configure DNS** - Point cortexbuildpro.com to 72.62.132.43
4. **Set up SSL** - Run `bash setup-ssl.sh` for HTTPS
5. **Schedule backups** - Set up automated daily backups
6. **Change default passwords** - Update all default credentials
7. **Monitor logs** - Keep an eye on logs for the first few days

---

**Need Help?**

If you encounter any issues:
1. Check the logs: `docker compose logs -f app`
2. Review the troubleshooting section above
3. See the full documentation in VPS-DEPLOYMENT-GUIDE.md
4. Check container status: `docker compose ps`

---

**Deployment Date:** 2026-02-04  
**Version:** 2.2.0  
**Server:** 72.62.132.43  
**Status:** ✅ Ready to Deploy

**Happy Deploying! 🚀**
