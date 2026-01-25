# Deploy CortexBuild Pro via Hestia Control Panel

## Server Information
- **Control Panel URL**: https://72.62.132.43:8443/login
- **Panel Username**: Admin
- **SSH Username**: root
- **Password**: Cumparavinde1@
- **Server Hostname**: srv1262179.hstgr.cloud
- **Server IP**: 72.62.132.43

## Deployment Method: Via Control Panel

Since direct SSH may have connectivity issues, you can deploy through the Hestia Control Panel web interface.

### Step 1: Access Control Panel

1. Open browser and navigate to: **https://72.62.132.43:8443/login**
2. Accept the SSL certificate warning (it's self-signed)
3. Login with:
   - Username: `Admin`
   - Password: `Cumparavinde1@`

### Step 2: Open Web SSH Terminal

1. In Hestia Control Panel, look for "SSH" or "Terminal" option in the menu
2. Or use the "File Manager" to access the server

### Step 3: Run Deployment Command

In the web terminal, run:

```bash
# One-command deployment
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/copilot/merge-and-commit-recent-changes/deployment/deploy-from-github.sh | bash
```

Or download and run manually:

```bash
# Download script
cd /root
wget https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/copilot/merge-and-commit-recent-changes/deployment/deploy-from-github.sh

# Make executable
chmod +x deploy-from-github.sh

# Run deployment
./deploy-from-github.sh
```

### Step 4: Monitor Progress

The script will:
1. Install Docker and dependencies (3-5 minutes)
2. Configure firewall
3. Clone repository from GitHub
4. Build Docker images (5-10 minutes)
5. Start all services
6. Display access credentials

**Total time:** ~10-15 minutes

### Step 5: Access Application

After deployment completes:
- Application URL: **http://72.62.132.43:3000**
- Or: **http://srv1262179.hstgr.cloud:3000**

---

## Alternative: Using Hestia File Manager

If web terminal is not available:

### Step 1: Use File Manager
1. Login to Hestia Control Panel
2. Go to "File Manager"
3. Navigate to `/root` or `/var/www`

### Step 2: Upload Deployment Script
1. Download this script to your local computer:
   https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/copilot/merge-and-commit-recent-changes/deployment/deploy-from-github.sh
2. Upload it via File Manager to `/root/`

### Step 3: Set Permissions and Execute
1. Right-click the script → Properties
2. Make it executable (chmod +x)
3. Use "Open Terminal Here" or run via cron job

---

## Alternative: SSH from Your Local Computer

If you have SSH access from your computer:

```bash
# From your local terminal
ssh root@72.62.132.43
# Or
ssh root@srv1262179.hstgr.cloud

# Then run:
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/copilot/merge-and-commit-recent-changes/deployment/deploy-from-github.sh | bash
```

---

## Using Hestia Web Interface for Docker

Hestia Control Panel may have Docker management features:

1. Check if Docker is already installed:
   - Go to System → Server Information
   - Look for Docker status

2. If not installed, use terminal to install:
   ```bash
   apt-get update
   apt-get install -y docker.io docker-compose
   ```

3. Enable Docker:
   ```bash
   systemctl enable docker
   systemctl start docker
   ```

---

## Port Configuration in Hestia

After deployment, ensure these ports are open:

1. In Hestia Control Panel, go to **Server → Firewall** (if available)
2. Ensure these ports are open:
   - Port 22 (SSH) - Already open
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3000 (Application)

Or via command line:
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw status
```

---

## Expected Results

After successful deployment:

### 1. Services Running
```bash
docker ps
```
Should show 4 containers:
- cortexbuild-db (PostgreSQL)
- cortexbuild-app (Next.js)
- cortexbuild-nginx (Nginx)
- cortexbuild-certbot (Certbot)

### 2. Application Accessible
- **http://72.62.132.43:3000**
- **http://srv1262179.hstgr.cloud:3000**

### 3. Credentials Saved
- Location: `/var/www/cortexbuild-pro/DEPLOYMENT_CREDENTIALS.txt`
- Contains: Database password, NextAuth secret, server IP

---

## Troubleshooting

### Can't Access Control Panel
- Check if server is running
- Verify URL: https://72.62.132.43:8443
- Try alternative port: https://72.62.132.43:8083
- Clear browser cache

### Docker Not Installing
```bash
# Alternative Docker installation
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Application Won't Start
```bash
# Check logs
cd /var/www/cortexbuild-pro/deployment
docker-compose logs -f

# Check disk space
df -h

# Check memory
free -m
```

### Port 3000 Blocked
```bash
# Check firewall
ufw status

# Open port
ufw allow 3000/tcp
```

---

## Quick Deployment Steps Summary

1. ✅ Login to https://72.62.132.43:8443/login
2. ✅ Open web terminal or SSH
3. ✅ Run: `curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/copilot/merge-and-commit-recent-changes/deployment/deploy-from-github.sh | bash`
4. ✅ Wait 10-15 minutes
5. ✅ Access: http://72.62.132.43:3000
6. ✅ Create admin account
7. ✅ Start using CortexBuild Pro

---

## Post-Deployment via Hestia

### Set Up Domain (Optional)

1. In Hestia CP, go to **Web**
2. Click **Add Web Domain**
3. Enter your domain: `cortexbuildpro.com`
4. Point DNS A record to: `72.62.132.43`
5. Configure reverse proxy to port 3000

### SSL Certificate

1. In domain settings, enable **SSL Support**
2. Select **Let's Encrypt**
3. Or manually via terminal:
```bash
cd /var/www/cortexbuild-pro/deployment
./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com
```

### Backups

1. In Hestia CP, go to **Backups**
2. Enable automated backups
3. Or use manual script:
```bash
cd /var/www/cortexbuild-pro/deployment
./backup.sh
```

---

## Support

- **Hestia Documentation**: https://docs.hestiacp.com/
- **CortexBuild Docs**: See `START_HERE.md`
- **Logs Location**: `/var/www/cortexbuild-pro/deployment/`
- **Check Status**: `docker ps` and `docker-compose ps`

---

## Summary

With Hestia Control Panel, deployment is even easier:
1. Use web interface to access server
2. Run deployment script via web terminal
3. Manage application via Hestia and Docker commands
4. Configure domains and SSL through Hestia

**The deployment process remains the same - just accessed through a different interface!**
