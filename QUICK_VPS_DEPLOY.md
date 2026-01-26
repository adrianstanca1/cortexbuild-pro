# 🚀 CortexBuild Pro - Quick VPS Deployment Reference

**Quick Reference for Deploying to Your VPS**

---

## One-Command Deployment

```bash
# On your VPS, run:
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/vps-setup.sh | bash && \
cd /var/www && \
git clone https://github.com/adrianstanca1/cortexbuild-pro.git && \
cd cortexbuild-pro/deployment && \
./deploy-vps.sh
```

**That's it!** Your application will be running in 10-15 minutes.

---

## Step-by-Step Commands

### 1. Initial VPS Setup

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Run setup script
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deployment/vps-setup.sh | bash
```

This installs:
- Docker & Docker Compose
- Firewall configuration
- Security tools (Fail2Ban)
- System optimizations

### 2. Deploy Application

```bash
# Clone repository
cd /var/www
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# Run deployment
./deploy-vps.sh
```

This will:
- Create secure credentials automatically
- Build Docker images
- Start all services
- Run database migrations
- Configure everything

### 3. Access Application

```bash
# Get your server IP
curl ifconfig.me

# Open in browser:
http://YOUR_SERVER_IP:3000
```

### 4. Setup SSL (Optional)

```bash
# Point your domain to server IP first, then:
cd /var/www/cortexbuild-pro/deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com

# Update .env
nano .env
# Change NEXTAUTH_URL=https://yourdomain.com
# Change NEXT_PUBLIC_WEBSOCKET_URL=https://yourdomain.com

# Restart
docker compose restart app
```

---

## Essential Management Commands

```bash
# View logs
docker compose logs -f app

# Restart application
docker compose restart app

# Check status
docker compose ps

# Stop services
docker compose down

# Update application
git pull && docker compose up -d --build

# Backup database
./backup.sh

# Access database
docker compose exec postgres psql -U cortexbuild -d cortexbuild
```

---

## Troubleshooting

### Application not responding?

```bash
docker compose logs app
docker compose restart app
```

### Database connection issues?

```bash
docker compose logs postgres
docker compose restart postgres
```

### Port already in use?

```bash
netstat -tlnp | grep 3000
docker compose down && docker compose up -d
```

### Need to start over?

```bash
docker compose down -v
rm -rf /var/www/cortexbuild-pro
# Then run deployment again
```

---

## Security Checklist

- [ ] Strong passwords generated (automatic with deploy-vps.sh)
- [ ] Firewall enabled (automatic with vps-setup.sh)
- [ ] SSH key authentication (manual - recommended)
- [ ] SSL/HTTPS configured (./setup-ssl.sh)
- [ ] Regular backups scheduled (manual - recommended)
- [ ] Delete DEPLOYMENT_CREDENTIALS.txt after saving

---

## File Locations

- **Application:** `/var/www/cortexbuild-pro`
- **Deployment:** `/var/www/cortexbuild-pro/deployment`
- **Configuration:** `/var/www/cortexbuild-pro/deployment/.env`
- **Backups:** `/var/www/cortexbuild-pro/deployment/backups/`
- **Credentials:** `/var/www/cortexbuild-pro/deployment/DEPLOYMENT_CREDENTIALS.txt`

---

## System Requirements

**Minimum:**
- Ubuntu 20.04+ or Debian 10+
- 2GB RAM
- 2 CPU cores
- 20GB storage

**Recommended:**
- Ubuntu 22.04 LTS
- 4GB RAM
- 4 CPU cores
- 40GB SSD storage

---

## Support

**Full Documentation:** `/var/www/cortexbuild-pro/DEPLOY_TO_VPS.md`

**Common Issues:**
- Check logs: `docker compose logs -f`
- Check services: `docker compose ps`
- Restart: `docker compose restart`
- View detailed guide: `cat /var/www/cortexbuild-pro/DEPLOY_TO_VPS.md`

---

## Quick Tips

1. **First user becomes admin** - Sign up immediately after deployment
2. **Save credentials** - Check DEPLOYMENT_CREDENTIALS.txt file
3. **Use HTTPS in production** - Run setup-ssl.sh with your domain
4. **Backup regularly** - Run ./backup.sh or set up cron job
5. **Monitor logs** - Use `docker compose logs -f` to watch activity

---

**Need help?** See full documentation: `/var/www/cortexbuild-pro/DEPLOY_TO_VPS.md`

**Last Updated:** January 26, 2026
