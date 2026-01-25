# CortexBuild Pro - VPS Deployment Instructions

## VPS Details
- **IP Address**: 72.62.132.43
- **Username**: root
- **Password**: Cumparavinde1@

## Pre-Deployment Checklist

### 1. VPS Requirements
- Ubuntu 20.04+ or Debian 11+
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ disk space
- SSH access enabled (port 22)
- Internet connectivity

### 2. Domain Configuration (Optional but Recommended)
- Point your domain A record to: 72.62.132.43
- Recommended domain: cortexbuildpro.com or www.cortexbuildpro.com

## Deployment Methods

### Method 1: Automated Script Deployment (Recommended)

This method uses a script to automate the entire deployment process.

#### Prerequisites on Your Local Machine
```bash
# Install sshpass (if not already installed)
# Ubuntu/Debian:
sudo apt-get install sshpass

# macOS:
brew install hudochenkov/sshpass/sshpass

# Or use this script without sshpass (manual password entry)
```

#### Run Deployment Script
```bash
cd deployment
chmod +x vps-deploy-complete.sh
./vps-deploy-complete.sh
```

The script will:
1. Connect to the VPS
2. Install Docker, Docker Compose, and dependencies
3. Configure firewall
4. Transfer application files
5. Generate secure credentials
6. Build and start all services
7. Run database migrations

### Method 2: Manual Deployment (Step-by-Step)

If the automated script doesn't work or you prefer manual control:

#### Step 1: Connect to VPS
```bash
ssh root@72.62.132.43
# Password: Cumparavinde1@
```

#### Step 2: Install Dependencies
```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install other tools
apt-get install -y git ufw openssl
```

#### Step 3: Configure Firewall
```bash
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable
ufw status
```

#### Step 4: Clone or Transfer Application
```bash
# Create deployment directory
mkdir -p /var/www/cortexbuild-pro
cd /var/www/cortexbuild-pro

# Option A: Clone from Git (if repository is accessible)
# git clone https://github.com/adrianstanca1/cortexbuild-pro.git .

# Option B: Transfer via SCP from your local machine
# Run this from your LOCAL machine:
cd /home/runner/work/cortexbuild-pro/cortexbuild-pro
tar -czf cortexbuild-deploy.tar.gz nextjs_space deployment README.md DEPLOYMENT_GUIDE.md
scp cortexbuild-deploy.tar.gz root@72.62.132.43:/var/www/cortexbuild-pro/

# Then on VPS:
cd /var/www/cortexbuild-pro
tar -xzf cortexbuild-deploy.tar.gz
rm cortexbuild-deploy.tar.gz
```

#### Step 5: Configure Environment
```bash
cd /var/www/cortexbuild-pro/deployment

# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env file
cat > .env << EOF
# Database Configuration
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=cortexbuild
DATABASE_URL=postgresql://cortexbuild:$POSTGRES_PASSWORD@postgres:5432/cortexbuild?schema=public

# NextAuth Configuration
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://72.62.132.43:3000

# Domain Configuration
DOMAIN=cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com

# Real-time Communication
NEXT_PUBLIC_WEBSOCKET_URL=http://72.62.132.43:3000
WEBSOCKET_PORT=3000

# AWS S3 (Configure these if you have AWS credentials)
AWS_PROFILE=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=
AWS_FOLDER_PREFIX=

# AbacusAI API (Configure these if you have API access)
ABACUSAI_API_KEY=
WEB_APP_ID=

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SendGrid (Optional)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com
SENDGRID_FROM_NAME=CortexBuild Pro
EOF

# Save these credentials securely!
echo "================================"
echo "SAVE THESE CREDENTIALS:"
echo "================================"
echo "Database Password: $POSTGRES_PASSWORD"
echo "NextAuth Secret: $NEXTAUTH_SECRET"
echo "================================"
```

#### Step 6: Build and Start Services
```bash
cd /var/www/cortexbuild-pro/deployment

# Build Docker images
docker-compose -f docker-compose.yml build

# Start all services
docker-compose -f docker-compose.yml up -d

# Wait for database to be ready
sleep 15

# Run database migrations
docker-compose -f docker-compose.yml exec app sh -c "cd /app && npx prisma migrate deploy"

# Check services status
docker-compose -f docker-compose.yml ps
```

#### Step 7: Verify Deployment
```bash
# Check if application is responding
curl http://localhost:3000/api/auth/providers

# View logs
docker-compose -f docker-compose.yml logs -f app

# Check container health
docker ps
```

### Method 3: Quick Transfer and Deploy Script

Save this as `quick-deploy.sh` on your LOCAL machine:

```bash
#!/bin/bash
set -e

VPS_HOST="72.62.132.43"
VPS_USER="root"
PROJECT_ROOT="/home/runner/work/cortexbuild-pro/cortexbuild-pro"

echo "Creating deployment package..."
cd "$PROJECT_ROOT"
tar --exclude='node_modules' --exclude='.next' --exclude='.env' \
    -czf /tmp/cortexbuild-deploy.tar.gz \
    nextjs_space deployment README.md DEPLOYMENT_GUIDE.md

echo "Transferring to VPS..."
scp /tmp/cortexbuild-deploy.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

echo "Deploying on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

# Install dependencies
apt-get update
apt-get install -y docker.io docker-compose git ufw openssl

# Configure firewall
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp

# Extract application
mkdir -p /var/www/cortexbuild-pro
cd /var/www/cortexbuild-pro
tar -xzf /tmp/cortexbuild-deploy.tar.gz

# Configure environment
cd deployment
POSTGRES_PASSWORD=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > .env << EOF
POSTGRES_USER=cortexbuild
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=cortexbuild
DATABASE_URL=postgresql://cortexbuild:$POSTGRES_PASSWORD@postgres:5432/cortexbuild?schema=public
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://72.62.132.43:3000
DOMAIN=cortexbuildpro.com
SSL_EMAIL=admin@cortexbuildpro.com
NEXT_PUBLIC_WEBSOCKET_URL=http://72.62.132.43:3000
WEBSOCKET_PORT=3000
AWS_PROFILE=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=
AWS_FOLDER_PREFIX=
ABACUSAI_API_KEY=
WEB_APP_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com
SENDGRID_FROM_NAME=CortexBuild Pro
EOF

echo "Credentials:"
echo "Database Password: $POSTGRES_PASSWORD"
echo "NextAuth Secret: $NEXTAUTH_SECRET"

# Build and start
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
sleep 20
docker-compose -f docker-compose.yml exec -T app sh -c "cd /app && npx prisma migrate deploy" || true

# Status
docker-compose -f docker-compose.yml ps

echo "Deployment complete!"
echo "Access: http://72.62.132.43:3000"
ENDSSH

echo "Deployment finished!"
```

## Post-Deployment Configuration

### 1. Access the Application
Navigate to: http://72.62.132.43:3000

### 2. Create Admin User
1. Click "Sign Up"
2. Create the first user account (will be admin)
3. Log in with credentials

### 3. Configure SSL (Production Only)
```bash
ssh root@72.62.132.43
cd /var/www/cortexbuild-pro/deployment

# Ensure domain is pointing to your VPS first!
./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com

# Update environment to use HTTPS
nano .env
# Change NEXTAUTH_URL to https://cortexbuildpro.com
# Change NEXT_PUBLIC_WEBSOCKET_URL to https://cortexbuildpro.com

# Restart services
docker-compose restart
```

### 4. Configure External Services

#### AWS S3 (File Storage)
1. Create S3 bucket in AWS Console
2. Create IAM user with S3 access
3. Update .env with credentials:
```bash
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name
AWS_FOLDER_PREFIX=cortexbuild/
```

#### AbacusAI API (AI Features)
1. Get API key from AbacusAI
2. Update .env:
```bash
ABACUSAI_API_KEY=your-api-key
WEB_APP_ID=your-app-id
```

#### SendGrid (Email)
1. Sign up at SendGrid
2. Create API key
3. Update .env:
```bash
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com
```

After updating .env, restart services:
```bash
docker-compose -f docker-compose.yml restart
```

## Monitoring and Maintenance

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

### Backup Database
```bash
./backup.sh
```

### Update Application
```bash
# On VPS
cd /var/www/cortexbuild-pro
git pull  # or transfer new files
cd deployment
./deploy.sh
```

## Troubleshooting

### Application Not Responding
```bash
# Check container status
docker ps

# Check logs
docker-compose logs app

# Restart application
docker-compose restart app
```

### Database Connection Issues
```bash
# Check database status
docker-compose logs postgres

# Access database
docker-compose exec postgres psql -U cortexbuild -d cortexbuild

# Restart database
docker-compose restart postgres
```

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000
netstat -tulpn | grep 3000

# Kill process or change port in docker-compose.yml
```

### Reset Everything
```bash
cd /var/www/cortexbuild-pro/deployment
docker-compose down -v  # This removes volumes!
docker-compose up -d
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review DEPLOYMENT_GUIDE.md
- Check BUILD_STATUS.md for build information
- Verify environment variables in .env

## Security Reminders

1. Change default passwords immediately
2. Keep system updated: `apt-get update && apt-get upgrade`
3. Configure SSL certificates for production
4. Set up automated backups
5. Monitor logs regularly
6. Use strong passwords for database and NextAuth secret
7. Restrict SSH access (use key-based auth, disable password auth)
8. Keep Docker images updated
