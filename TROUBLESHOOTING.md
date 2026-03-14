# CortexBuild Pro - Troubleshooting Guide

> **Version:** 2.0.0  
> **Last Updated:** 2026-03-14  
> **Scope:** VPS/Docker deployments

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Deployment Failures](#deployment-failures)
3. [Application Issues](#application-issues)
4. [Database Issues](#database-issues)
5. [SSL/TLS Issues](#ssltls-issues)
6. [Performance Issues](#performance-issues)
7. [CI/CD Issues](#cicd-issues)
8. [Emergency Procedures](#emergency-procedures)

---

## Quick Diagnostics

### Health Check Commands

Run these first to assess system state:

```bash
# SSH to VPS
ssh root@<VPS_HOST>

cd /var/www/cortexbuildpro/deployment

# 1. Check container status
docker compose -f docker-compose.vps.yml ps

# 2. Check application health
curl -sf http://localhost:3010/api/health && echo "✅ App OK" || echo "❌ App Down"

# 3. Check resource usage
docker stats --no-stream

# 4. Check recent logs
docker compose -f docker-compose.vps.yml logs --tail=50 app

# 5. Check disk space
df -h

# 6. Check memory
free -h
```

### Diagnostic Script

Save as `diagnose.sh`:
```bash
#!/bin/bash
echo "=== CortexBuild Pro Diagnostics ==="
echo ""
echo "--- Container Status ---"
docker compose -f docker-compose.vps.yml ps
echo ""
echo "--- Health Check ---"
curl -sf http://localhost:3010/api/health || echo "Health check FAILED"
echo ""
echo "--- Resource Usage ---"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""
echo "--- Disk Space ---"
df -h | grep -E "(Filesystem|/dev/)"
echo ""
echo "--- Memory ---"
free -h
echo ""
echo "--- Recent Errors ---"
docker compose -f docker-compose.vps.yml logs --tail=20 app 2>&1 | grep -i error || echo "No errors found"
```

---

## Deployment Failures

### Issue: GitHub Actions Deployment Fails

**Symptoms:**
- Workflow shows red X
- Deployment step fails
- SSH connection errors

**Diagnostic Steps:**

1. **Check GitHub Secrets:**
   ```
   Settings → Secrets and variables → Actions
   ```
   Verify: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

2. **Test SSH manually:**
   ```bash
   ssh -i ~/.ssh/your_key root@<VPS_HOST>
   ```

3. **Check VPS firewall:**
   ```bash
   ufw status
   # Should show: 22/tcp ALLOW
   ```

**Solutions:**

| Error | Solution |
|-------|----------|
| `Permission denied (publickey)` | Add SSH key to VPS `~/.ssh/authorized_keys` |
| `Connection timed out` | Check VPS is running, firewall allows SSH |
| `Host key verification failed` | Remove old host key: `ssh-keygen -R <VPS_HOST>` |

---

### Issue: Docker Image Pull Fails

**Symptoms:**
```
Error response from daemon: pull access denied
```

**Solutions:**

1. **Verify GHCR authentication:**
   ```bash
   # On VPS
docker login ghcr.io -u <GITHUB_USERNAME> -p <GITHUB_TOKEN>
   ```

2. **Check image exists:**
   ```bash
   # Visit: https://github.com/<USER>/<REPO>/packages
   ```

3. **Pull manually:**
   ```bash
   docker pull ghcr.io/<USER>/cortexbuild-pro:cortexbuildpro-<SHA>
   ```

---

### Issue: Container Won't Start

**Symptoms:**
- Container status `Restarting` or `Exited`
- Health check fails

**Diagnostic:**
```bash
# Check logs
docker compose -f docker-compose.vps.yml logs app

# Check exit code
docker compose -f docker-compose.vps.yml ps
```

**Common Causes & Fixes:**

| Cause | Error Pattern | Fix |
|-------|---------------|-----|
| Port conflict | `bind: address already in use` | Change port in docker-compose.vps.yml |
| Missing env vars | `Error: DATABASE_URL is required` | Check .env file exists and is readable |
| Database not ready | `Can't reach database server` | Start db first: `docker compose up -d db` |
| Memory limit | `out of memory` | Increase VPS RAM or add swap |

---

## Application Issues

### Issue: 502 Bad Gateway

**Symptoms:**
- Nginx shows 502 error
- Application unreachable

**Diagnostic:**
```bash
# Check if app is running
curl http://localhost:3010/api/health

# Check nginx logs
docker compose -f docker-compose.vps.yml logs nginx
```

**Solutions:**

1. **App not running:**
   ```bash
   docker compose -f docker-compose.vps.yml up -d app
   ```

2. **Wrong upstream port:**
   - Verify `proxy_pass http://app:3000;` in nginx.conf

3. **App crashed:**
   ```bash
   # Check logs
docker compose -f docker-compose.vps.yml logs --tail=100 app
   
   # Restart
   docker compose -f docker-compose.vps.yml restart app
   ```

---

### Issue: Application Returns 500 Errors

**Diagnostic:**
```bash
# Check application logs
docker compose -f docker-compose.vps.yml logs --tail=100 app | grep -i error

# Check for Prisma errors
docker compose -f docker-compose.vps.yml logs app | grep -i prisma
```

**Common Causes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `DATABASE_URL` invalid | Wrong connection string | Update .env with correct DATABASE_URL |
| `NEXTAUTH_SECRET` missing | Auth misconfiguration | Generate and set NEXTAUTH_SECRET |
| `Table not found` | Migrations not run | Run: `npx prisma migrate deploy` |
| `Out of memory` | Heap limit reached | Increase Node memory: `--max-old-space-size=4096` |

---

### Issue: Static Assets Not Loading (404)

**Symptoms:**
- CSS/JS files return 404
- Page renders without styles

**Solutions:**

1. **Check nginx configuration:**
   ```bash
   docker compose -f docker-compose.vps.yml exec nginx nginx -t
   ```

2. **Verify build output:**
   ```bash
   docker compose -f docker-compose.vps.yml exec app ls -la .next/static
   ```

3. **Rebuild application:**
   ```bash
   # Trigger new deployment or rebuild locally
   docker compose -f docker-compose.vps.yml up -d --build app
   ```

---

## Database Issues

### Issue: Database Connection Failed

**Symptoms:**
```
Error: P1001: Can't reach database server
```

**Diagnostic:**
```bash
# Check if database is running
docker compose -f docker-compose.vps.yml ps db

# Test connection from app container
docker compose -f docker-compose.vps.yml exec app sh -c "nc -zv db 5432"

# Check database logs
docker compose -f docker-compose.vps.yml logs db
```

**Solutions:**

1. **Start database:**
   ```bash
   docker compose -f docker-compose.vps.yml up -d db
   sleep 15
   ```

2. **Verify credentials:**
   ```bash
   # Check .env matches docker-compose
   cat .env | grep POSTGRES
   ```

3. **Reset database (WARNING: Data loss):**
   ```bash
   docker compose -f docker-compose.vps.yml down db
   docker volume rm cortexbuildpro_postgres_data
   docker compose -f docker-compose.vps.yml up -d db
   ```

---

### Issue: Migration Failures

**Symptoms:**
```
Error: P3002: Migration already applied
```

**Solutions:**

1. **Check migration status:**
   ```bash
   docker compose -f docker-compose.vps.yml exec -T app sh -c "cd /app && npx prisma migrate status"
   ```

2. **Reset migrations (if stuck):**
   ```bash
   # WARNING: Only if you understand the implications
   docker compose -f docker-compose.vps.yml exec -T app sh -c "cd /app && npx prisma migrate resolve --rolled-back <MIGRATION_NAME>"
   ```

3. **Force deploy:**
   ```bash
   docker compose -f docker-compose.vps.yml exec -T app sh -c "cd /app && npx prisma migrate deploy --force"
   ```

---

### Issue: Database Performance Issues

**Symptoms:**
- Slow queries
- High CPU usage on db container

**Diagnostic:**
```bash
# Connect to database
docker compose -f docker-compose.vps.yml exec db psql -U cortexbuild -d cortexbuild

# Check active queries
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname='public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solutions:**

1. **Add indexes:**
   ```sql
   CREATE INDEX CONCURRENTLY idx_<table>_<column> ON <table>(<column>);
   ```

2. **Vacuum database:**
   ```bash
   docker compose -f docker-compose.vps.yml exec db psql -U cortexbuild -c "VACUUM ANALYZE;"
   ```

3. **Increase resources:**
   - Add more RAM to VPS
   - Increase shared_buffers in PostgreSQL config

---

## SSL/TLS Issues

### Issue: Certificate Not Generated

**Symptoms:**
- HTTPS not working
- Certbot errors in logs

**Diagnostic:**
```bash
# Check certbot logs
docker compose -f docker-compose.vps.yml logs certbot

# Verify DNS
dig +short cortexbuildpro.com
dig +short www.cortexbuildpro.com
```

**Solutions:**

| Error | Solution |
|-------|----------|
| `Connection refused` | Ensure port 80 is open: `ufw allow 80/tcp` |
| `DNS problem: NXDOMAIN` | Verify DNS A records point to VPS IP |
| `Too many failed authorizations` | Wait 1 hour (rate limit) |
| `urn:ietf:params:acme:error:rateLimited` | Wait 1 week or use staging server |

---

### Issue: Certificate Expired

**Symptoms:**
- Browser shows certificate expired warning
- Site inaccessible via HTTPS

**Solutions:**

1. **Manual renewal:**
   ```bash
   docker compose -f docker-compose.vps.yml run --rm certbot renew
   docker compose -f docker-compose.vps.yml restart nginx
   ```

2. **Check auto-renewal:**
   ```bash
   # Verify certbot container is running
   docker compose -f docker-compose.vps.yml ps certbot
   
   # Check renewal logs
   docker compose -f docker-compose.vps.yml logs certbot | tail -20
   ```

---

### Issue: Mixed Content Warnings

**Symptoms:**
- Browser console shows mixed content errors
- Some resources loaded over HTTP

**Solutions:**

1. **Update NEXTAUTH_URL:**
   ```bash
   # Ensure HTTPS in .env
   NEXTAUTH_URL=https://www.cortexbuildpro.com
   ```

2. **Force HTTPS in nginx:**
   ```nginx
   # Add to nginx-ssl.conf
   add_header Content-Security-Policy "upgrade-insecure-requests" always;
   ```

---

## Performance Issues

### Issue: High CPU Usage

**Diagnostic:**
```bash
# Top processes
top

# Docker stats
docker stats --no-stream

# App logs for busy loops
docker compose -f docker-compose.vps.yml logs app | grep -i "timeout\|error"
```

**Solutions:**

1. **Identify culprit:**
   ```bash
   # Check which container uses CPU
   docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}"
   ```

2. **Scale resources:**
   - Upgrade VPS to more CPU cores
   - Add swap space: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`

3. **Optimize application:**
   - Enable Next.js caching
   - Add database indexes
   - Use connection pooling

---

### Issue: High Memory Usage

**Diagnostic:**
```bash
# Memory usage
free -h

# Container memory
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"

# OOM events
dmesg | grep -i "out of memory"
```

**Solutions:**

1. **Add swap:**
   ```bash
   fallocate -l 4G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

2. **Restart containers:**
   ```bash
   docker compose -f docker-compose.vps.yml restart
   ```

3. **Increase VPS RAM** (recommended for production)

---

### Issue: Slow Response Times

**Diagnostic:**
```bash
# Time requests
time curl -sf http://localhost:3010/api/health

# Check database query times
docker compose -f docker-compose.vps.yml exec db psql -U cortexbuild -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Solutions:**

1. **Enable query logging:**
   ```sql
   ALTER SYSTEM SET log_min_duration_statement = '1000';
   SELECT pg_reload_conf();
   ```

2. **Add caching layer:**
   - Enable Next.js ISR
   - Add Redis for session caching

3. **Database optimization:**
   - Add missing indexes
   - Vacuum and analyze tables

---

## CI/CD Issues

### Issue: GitHub Actions Workflow Not Triggering

**Diagnostic:**
- Check `.github/workflows/deploy-vps.yml` exists
- Verify branch name matches trigger conditions

**Solutions:**

1. **Check workflow file:**
   ```bash
   cat .github/workflows/deploy-vps.yml | grep "branches:"
   ```

2. **Verify branch names:**
   - Auto-deploy: `Cortexbuildpro`, `master-integrated`
   - Manual: Any branch via workflow_dispatch

3. **Check Actions settings:**
   - Settings → Actions → General → Allow all actions

---

### Issue: Docker Build Fails in CI

**Symptoms:**
- Build step fails with npm/yarn errors
- Out of disk space in GitHub Actions

**Solutions:**

1. **Clear cache:**
   - Go to Actions → Caches → Delete relevant caches

2. **Check Dockerfile:**
   ```bash
   # Verify build locally
   docker build -f deployment/Dockerfile -t test-build .
   ```

3. **Increase timeout:**
   - Default is 360 minutes, increase if needed in workflow

---

## Emergency Procedures

### Complete Outage Recovery

**Step-by-step recovery:**

```bash
# 1. SSH to VPS
ssh root@<VPS_HOST>

# 2. Check system status
cd /var/www/cortexbuildpro/deployment
docker compose -f docker-compose.vps.yml ps

# 3. If all containers down, start them
docker compose -f docker-compose.vps.yml up -d

# 4. If still failing, check logs
docker compose -f docker-compose.vps.yml logs --tail=100

# 5. Nuclear option: full restart
docker compose -f docker-compose.vps.yml down
docker compose -f docker-compose.vps.yml up -d

# 6. Verify
curl -sf http://localhost:3010/api/health
```

### Rollback to Previous Version

See [OPS_RUNBOOK.md](./OPS_RUNBOOK.md#rollback-procedure) for detailed rollback steps.

### Contact Escalation

| Severity | Contact | Response Time |
|----------|---------|---------------|
| Critical (complete outage) | DevOps team + On-call | 15 minutes |
| High (major feature broken) | DevOps team | 1 hour |
| Medium (partial degradation) | GitHub Issues | 4 hours |
| Low (minor issues) | GitHub Issues | 24 hours |

---

## Log Locations

| Component | Log Command |
|-----------|-------------|
| Application | `docker compose -f docker-compose.vps.yml logs app` |
| Database | `docker compose -f docker-compose.vps.yml logs db` |
| Nginx | `docker compose -f docker-compose.vps.yml logs nginx` |
| Certbot | `docker compose -f docker-compose.vps.yml logs certbot` |
| System | `journalctl -u docker.service` |

---

**Still stuck?** Create an issue at: https://github.com/adrianstanca1/cortexbuild-pro/issues