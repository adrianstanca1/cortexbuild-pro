# CortexBuild Pro - VPS Deployment Quick Reference

> 📖 **For complete deployment instructions, see [DEPLOY_TO_VPS.md](../DEPLOY_TO_VPS.md)** - NEW Simplified Guide!
> 🔧 **For VPS and connection configuration, see [VPS_CONNECTION_CONFIG.md](../VPS_CONNECTION_CONFIG.md)**
> 📋 **For command reference, see [VPS_QUICK_REFERENCE.md](../VPS_QUICK_REFERENCE.md)** - NEW One-Page Reference!

This directory contains Docker configuration and scripts for deploying CortexBuild Pro on a VPS.

---

## 🚀 Quick Deploy (Easiest Method)

### Option 1: One-Command Deploy (Recommended) 🆕

Run this single command on your fresh VPS:

```bash
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/main/deploy-to-vps.sh | bash
```

This automated script handles **everything**:
- ✅ Installs Docker & Docker Compose
- ✅ Configures firewall (UFW) and security (Fail2Ban)
- ✅ Clones repository
- ✅ Generates secure credentials
- ✅ Builds and deploys all services
- ✅ Runs database migrations
- ✅ Verifies deployment
- ✅ Provides next steps

⏱️ **Time:** 10-15 minutes
📋 **Requirements:** Ubuntu 20.04+ or Debian 10+, 2GB+ RAM, root/sudo access

### Option 2: Manual Step-by-Step
```bash
# 1. Clone and navigate
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment

# 2. Run VPS setup (one-time)
sudo bash vps-setup.sh

# 3. Configure environment
cp .env.example .env
nano .env

# 4. Validate configuration
bash validate-config.sh

# 5. Deploy application
bash deploy-from-github.sh
```

For detailed instructions, troubleshooting, and production best practices, see:
- **[PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md)** - Complete deployment guide
- **[VPS_CONNECTION_CONFIG.md](../VPS_CONNECTION_CONFIG.md)** - VPS, database, and WebSocket configuration

---

## 📁 Files in This Directory

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Container orchestration with optimized PostgreSQL and WebSocket support |
| `Dockerfile` | Application container build instructions |
| `nginx.conf` | Reverse proxy with WebSocket-specific configuration |
| `.env.example` | Environment variables template |
| `deploy-from-github.sh` | Automated deployment from GitHub |
| `vps-setup.sh` | **Enhanced** VPS initial setup with security hardening |
| `setup-ssl.sh` | SSL certificate setup (Let's Encrypt) |
| `quick-start.sh` | **New** One-command automated deployment |
| `validate-config.sh` | **New** Configuration validation script |
| `backup.sh` | Database backup utility |
| `restore.sh` | Database restore utility |
| `seed-db.sh` | Initialize database with sample data |

---

## 🛠️ Common Commands

### View Logs
```bash
docker-compose logs -f          # All services
docker-compose logs -f app      # App only
```

### Restart Services
```bash
docker-compose restart app      # Restart application
docker-compose restart nginx    # Restart nginx
```

### Database Operations
```bash
docker-compose exec app npx prisma migrate deploy    # Run migrations
docker-compose exec app npx prisma studio            # Database GUI
./backup.sh                                           # Backup database
```

### Health Check
```bash
# Run system diagnostics
docker-compose exec app npx tsx scripts/health-check.ts
```

---

## 📦 Scripts Directory

The `scripts/` subdirectory contains utility scripts for:
- Database seeding and management
- System diagnostics and health checks
- Data integrity checks
- Backup and maintenance tasks

See [scripts/README.md](scripts/README.md) for details.

---

## 🔧 Configuration

### Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | ✅ Yes | Database password (auto-generated in quick-start) |
| `NEXTAUTH_SECRET` | ✅ Yes | Auth encryption key (32+ chars, auto-generated) |
| `NEXTAUTH_URL` | ✅ Yes | Full URL (https://your-domain.com) |
| `DOMAIN` | ✅ Yes | Domain without protocol |
| `NEXT_PUBLIC_WEBSOCKET_URL` | ✅ Yes | WebSocket URL (same as NEXTAUTH_URL) |

### Optional Services

| Service | Variables | Purpose |
|---------|-----------|---------|
| AWS S3 | `AWS_*` | File storage |
| Google OAuth | `GOOGLE_*` | OAuth authentication |
| SendGrid | `SENDGRID_*` | Email notifications |
| AbacusAI | `ABACUS_*` | AI features |

### WebSocket Configuration

The application uses Socket.IO for real-time features:
- **Path**: `/api/socketio`
- **Transports**: WebSocket (preferred) and polling (fallback)
- **Security**: JWT authentication with NextAuth tokens
- **Connection pooling**: Optimized for production workloads

See [../VPS_CONNECTION_CONFIG.md](../VPS_CONNECTION_CONFIG.md) for detailed WebSocket and connection configuration.

---

## 🌐 DNS Setup

Point your domain's A records to your VPS IP:

```
A    @      YOUR_VPS_IP
A    www    YOUR_VPS_IP
```

Wait for DNS propagation (5-30 minutes), then run SSL setup:
```bash
./setup-ssl.sh your-domain.com admin@your-domain.com
```

---

## 🔒 Security Checklist

- [x] Docker and Docker Compose installed
- [ ] Strong database password set in `.env`
- [ ] NEXTAUTH_SECRET generated (32+ random characters)
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Fail2ban enabled for SSH protection
- [ ] System limits optimized for production
- [ ] SSL certificate installed
- [ ] Default admin password changed after first login
- [ ] Regular backups scheduled
- [ ] WebSocket connections encrypted (WSS)

**Run validation before deployment:**
```bash
bash validate-config.sh
```

---

## 📊 Monitoring & Maintenance

### Check Application Health
```bash
curl https://your-domain.com/api/health
```

### View Resource Usage
```bash
docker stats                    # Container resource usage
docker system df               # Disk usage
```

### Regular Maintenance
```bash
# Weekly: Check logs for errors
docker-compose logs --tail=100

# Monthly: Update Docker images
docker-compose pull
docker-compose up -d

# Monthly: Clean unused Docker resources
docker system prune -a
```

---

## ⚠️ Troubleshooting

### Quick Diagnostics
```bash
# Check all containers are running
docker-compose ps

# View recent logs
docker-compose logs --tail=50

# Verify environment variables
docker-compose config

# Test database connection
docker-compose exec app npx prisma db push
```

For detailed troubleshooting, see [../RUNBOOK.md](../RUNBOOK.md).

---

## 📚 Additional Resources

- **[VPS_CONNECTION_CONFIG.md](../VPS_CONNECTION_CONFIG.md)** - ⭐ VPS, database, and WebSocket configuration
- **[PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md)** - Complete deployment guide
- **[RUNBOOK.md](../RUNBOOK.md)** - Operations and troubleshooting
- **[API_SETUP_GUIDE.md](../API_SETUP_GUIDE.md)** - Configure external services
- **[CONFIGURATION_CHECKLIST.md](../CONFIGURATION_CHECKLIST.md)** - Verify setup
- **[SECURITY_COMPLIANCE.md](../SECURITY_COMPLIANCE.md)** - Security best practices
- **[BACKEND_FRONTEND_CONNECTIVITY.md](../BACKEND_FRONTEND_CONNECTIVITY.md)** - Architecture overview

---

## 🆘 Getting Help

1. **Validate configuration**: `bash validate-config.sh`
2. **Check logs**: `docker-compose logs -f`
3. **Run diagnostics**: `docker-compose exec app npx tsx scripts/system-diagnostics.ts`
4. **Verify configuration**: Review `.env` file
5. **Test WebSocket**: `curl https://your-domain.com/api/websocket-health`
6. **Consult documentation**: See resources above

### Common Issues

**WebSocket connection fails:**
- Verify `NEXT_PUBLIC_WEBSOCKET_URL` matches your domain
- Check Nginx logs: `docker-compose logs nginx`
- Test endpoint: `curl https://your-domain.com/api/websocket-health`

**Database connection errors:**
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL logs: `docker-compose logs postgres`
- Test connection: `docker-compose exec postgres psql -U cortexbuild`

**SSL certificate issues:**
- Ensure DNS is propagated: `dig your-domain.com`
- Check certificate: `openssl s_client -connect your-domain.com:443`
- Renew if needed: `docker-compose run --rm certbot renew`

---

**Last Updated:** January 26, 2026
**Version:** 2.0.0 - Enhanced with WebSocket and connection optimization
