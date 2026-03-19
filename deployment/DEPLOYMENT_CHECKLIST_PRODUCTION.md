# 🚀 CortexBuild Pro - Production Deployment Checklist

## Pre-Deployment Verification

### Infrastructure Requirements
- [ ] VPS with Ubuntu 22.04+ LTS
- [ ] Minimum 4GB RAM (8GB recommended)
- [ ] Minimum 2 CPU cores (4 recommended)
- [ ] 40GB+ SSD storage
- [ ] Static IP address configured
- [ ] Domain DNS records pointing to VPS IP

### Software Prerequisites
- [ ] Docker 24.0+ installed
- [ ] Docker Compose v2.20+ installed
- [ ] Git installed
- [ ] OpenSSL available
- [ ] Firewall configured (UFW)
- [ ] SSH key-based authentication enabled

### Security Checklist
- [ ] SSH root login disabled
- [ ] Firewall ports: 22, 80, 443 open only
- [ ] Docker daemon secured
- [ ] Non-root Docker user created
- [ ] Fail2ban installed (optional)

---

## Deployment Steps

### Step 1: Environment Configuration
- [ ] SSH to VPS: `ssh root@<VPS_IP>`
- [ ] Navigate to deployment directory
- [ ] Copy environment template: `cp .env.production.template .env.production`
- [ ] Generate POSTGRES_PASSWORD: `openssl rand -base64 24`
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Generate ENCRYPTION_KEY: `openssl rand -hex 32`
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Configure AWS S3 credentials (if using)
- [ ] Set file permissions: `chmod 600 .env.production`

### Step 2: SSL Certificate Setup
- [ ] Domain DNS configured (A record → VPS IP)
- [ ] Run SSL setup: `./setup-ssl.sh your-domain.com`
- [ ] Verify certificate created
- [ ] Test HTTPS redirect

### Step 3: Deploy Application
- [ ] Run deployment: `./deploy-to-vps.sh`
- [ ] Wait for build completion (~3-5 minutes)
- [ ] Verify all containers started
- [ ] Check health endpoint: `curl http://localhost:3010/api/health`

### Step 4: Database Setup
- [ ] Run database migrations (auto-done by deploy script)
- [ ] Seed initial data: `./seed-db.sh`
- [ ] Verify admin account created
- [ ] Test database connectivity

### Step 5: Verification
- [ ] Application responds on port 3010
- [ ] Nginx serves on port 80/443
- [ ] Health check returns 200
- [ ] Database container healthy
- [ ] No error logs in application
- [ ] No error logs in nginx

---

## Post-Deployment Tasks

### Monitoring Setup
- [ ] Review monitoring stack (optional): `docker-compose -f docker-compose.monitoring.yml up -d`
- [ ] Access Grafana: `http://VPS_IP:3001`
- [ ] Configure alerting rules
- [ ] Set up external monitoring (UptimeRobot/Pingdom)

### Backup Configuration
- [ ] Test backup script: `./backup.sh`
- [ ] Verify backup file created
- [ ] Set up automated cron job for daily backups
- [ ] Configure offsite backup (S3 optional)

### Performance Tuning
- [ ] Review resource limits in docker-compose.prod.yml
- [ ] Adjust PostgreSQL shared_buffers if needed
- [ ] Configure Nginx worker_processes
- [ ] Enable log rotation

### Documentation
- [ ] Record deployment date/time
- [ ] Document environment variable values (securely)
- [ ] Create runbook for common operations
- [ ] Set up on-call rotation (if team)

---

## Health Check Verification

Run: `./health-verify.sh`

- [ ] app_http: pass
- [ ] db_container: pass
- [ ] app_container: pass
- [ ] nginx_container: pass
- [ ] health_response: pass
- [ ] db_connectivity: pass

---

## Rollback Procedure (If Needed)

### Quick Rollback
- [ ] Stop application: `docker-compose -f docker-compose.prod.yml stop app`
- [ ] Identify previous image: `docker images | grep cortexbuild`
- [ ] Update image tag in compose file
- [ ] Restart: `docker-compose -f docker-compose.prod.yml up -d app`
- [ ] Verify health

### Full Rollback with Database
- [ ] Create safety backup of current state
- [ ] Run: `./rollback.sh --last`
- [ ] Or restore from backup: `./restore.sh backups/backup_YYYYMMDD.sql.gz`
- [ ] Verify application healthy

---

## Production URL / Endpoints

| Service | URL | Port |
|---------|-----|------|
| Application | http://localhost:3010 | 3010 |
| Nginx HTTP | http://VPS_IP | 80 |
| Nginx HTTPS | https://your-domain.com | 443 |
| Health Check | /api/health | - |
| Grafana (optional) | http://VPS_IP:3001 | 3001 |
| Prometheus (optional) | http://VPS_IP:9090 | 9090 |

---

## Default Credentials (After Seed)

| Email | Role | Default Password |
|-------|------|------------------|
| adrian.stanca1@gmail.com | Super Admin | Check seed.ts |
| adrian@ascladdingltd.co.uk | Company Owner | Check seed.ts |

**⚠️ Change default passwords immediately!**

---

## Useful Commands

```bash
# View status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f db

# Restart services
docker-compose -f docker-compose.prod.yml restart app
docker-compose -f docker-compose.prod.yml restart nginx

# Stop all
docker-compose -f docker-compose.prod.yml down

# Run migrations manually
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Database backup
./backup.sh

# Database restore
./restore.sh backups/backup_YYYYMMDD.sql.gz

# Health check
curl http://localhost:3010/api/health

# Resource usage
docker stats
```

---

## Troubleshooting

### Application Won't Start
1. Check logs: `docker-compose -f docker-compose.prod.yml logs app`
2. Verify environment variables
3. Check database connectivity
4. Review memory limits

### Database Connection Issues
1. Verify POSTGRES_PASSWORD matches
2. Check DATABASE_URL format
3. Wait for database health check
4. Review PostgreSQL logs

### SSL Certificate Issues
1. Verify DNS propagated
2. Check certbot logs
3. Ensure port 80 accessible
4. Renew: `docker-compose run --rm certbot renew`

### High Resource Usage
1. Check docker stats
2. Review application logs for errors
3. Adjust resource limits
4. Consider scaling VPS

---

## Deployment Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| DevOps Engineer | | | |
| Project Manager | | | |
| QA Lead | | | |

**Deployment Status:** ☐ Complete ☐ Rolled Back ☐ In Progress

**Notes:**

---

*Last Updated: 2026-03-18*
*Version: 1.0*
