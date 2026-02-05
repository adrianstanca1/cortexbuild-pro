# CortexBuild Pro - CloudPanel Deployment Guide

## 🚀 Quick Start (30 Minutes)

### Prerequisites
- Fresh Ubuntu 22.04 VPS (minimum 2GB RAM, 20GB SSD)
- Domain name pointing to your VPS IP
- Root SSH access

---

## Step 1: Install CloudPanel

```bash
# SSH into your VPS as root
ssh root@your-vps-ip

# Install CloudPanel (takes ~5 minutes)
curl -fsSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash
```

After installation:
- Access CloudPanel at: `https://your-vps-ip:8443`
- Create your admin account

---

## Step 2: Create Node.js Site in CloudPanel

1. **Login to CloudPanel** → Sites → Add Site
2. **Select**: "Create a Node.js Site"
3. **Configure**:
   - Domain: `cortexbuild.yourdomain.com`
   - Node.js Version: `20`
   - App Port: `3000`
4. **Click Create**

---

## Step 3: Create PostgreSQL Database

1. **In CloudPanel**: Databases → Add Database
2. **Configure**:
   - Database Name: `cortexbuild`
   - Username: `cortexbuild`
   - Password: (save this - you'll need it)
3. **Click Create**

---

## Step 4: Clone & Deploy CortexBuild Pro

```bash
# SSH into the site user
clpctl site:shell cortexbuild.yourdomain.com

# Navigate to htdocs
cd ~/htdocs/cortexbuild.yourdomain.com

# Remove default files
rm -rf *

# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git .

# Go to NextJS directory
cd nextjs_space

# Create environment file
cp ../deployment/.env.example .env

# Edit .env with your settings
nano .env
```

### Configure .env file:

```env
# Database (use your CloudPanel database credentials)
DATABASE_URL="postgresql://cortexbuild:YOUR_DB_PASSWORD@localhost:5432/cortexbuild?schema=public"

# NextAuth (generate a secret)
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://cortexbuild.yourdomain.com"
```

### Run Deployment Script:

```bash
# Make script executable
chmod +x ../deployment/cloudpanel-deploy.sh

# Run deployment
../deployment/cloudpanel-deploy.sh
```

---

## Step 5: Configure CloudPanel Settings

1. **In CloudPanel** → Sites → Your Site → Node.js Settings
2. **Set**:
   - Start Command: `yarn start`
   - Node.js Version: `20`
   - Port: `3000`
3. **Environment Variables** → Add:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
4. **Click Save & Restart**

---

## Step 6: Enable SSL

1. **In CloudPanel** → Sites → Your Site → SSL/TLS
2. **Click**: "New Let's Encrypt Certificate"
3. **Wait** for certificate installation
4. **Force HTTPS**: Enable "Force HTTPS redirect"

---

## ✅ Done!

Your CortexBuild Pro is now live at:
- **URL**: `https://cortexbuild.yourdomain.com`

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | adrian.stanca1@gmail.com | Cumparavinde1 |
| Company Owner | adrian@ascladdingltd.co.uk | Cumparavinde1 |
| Demo Admin | admin@cortexbuild.com | johndoe123 |

---

## 🔧 Troubleshooting

### App Not Starting?

```bash
# Check logs
clpctl site:logs cortexbuild.yourdomain.com

# Restart app
clpctl site:restart cortexbuild.yourdomain.com

# Manual start for debugging
cd ~/htdocs/cortexbuild.yourdomain.com/nextjs_space
yarn start
```

### Database Connection Issues?

```bash
# Test database connection
psql -h localhost -U cortexbuild -d cortexbuild -c "SELECT 1;"

# Check .env DATABASE_URL format
cat .env | grep DATABASE_URL
```

### Build Failures?

```bash
# Increase memory for build
export NODE_OPTIONS="--max-old-space-size=4096"
yarn build

# Clear cache and rebuild
rm -rf .next node_modules
yarn install
yarn build
```

---

## 📦 Updating CortexBuild Pro

```bash
# SSH into site
clpctl site:shell cortexbuild.yourdomain.com
cd ~/htdocs/cortexbuild.yourdomain.com/nextjs_space

# Pull latest changes
git pull origin main

# Reinstall dependencies
yarn install

# Run migrations
yarn prisma migrate deploy

# Rebuild
yarn build

# Restart app
clpctl site:restart cortexbuild.yourdomain.com
```

---

## 🔒 Security Recommendations

1. **Change default passwords** immediately after first login
2. **Enable 2FA** in CloudPanel for admin access
3. **Regular backups**: CloudPanel → Backups → Enable automatic backups
4. **Keep Node.js updated** to latest LTS version
5. **Monitor logs** for suspicious activity

---

## 📞 Support

- **Abacus Hosted Version**: https://cortexbuildpro.abacusai.app
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check the `/docs` folder for API references
