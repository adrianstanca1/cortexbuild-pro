# CortexBuild Pro - Operations Runbook

> **Version:** 2.0.0  
> **Last Updated:** 2026-03-14  
> **Audience:** DevOps Engineers, System Administrators

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Backup Procedures](#backup-procedures)
4. [Rollback Procedure](#rollback-procedure)
5. [Scaling Operations](#scaling-operations)
6. [Security Operations](#security-operations)
7. [Maintenance Windows](#maintenance-windows)
8. [Incident Response](#incident-response)

---

## Daily Operations

### Morning Health Check (Daily, 09:00 UTC)

```bash
#!/bin/bash
# save as: /root/health-check.sh

VPS_HOST="<YOUR_VPS_IP>"
WEBHOOK_URL="<OPTIONAL_SLACK_WEBHOOK>"

cd /var/www/cortexbuildpro/deployment

echo "=== Daily Health Check ==="
echo "Date: $(date)"

# Check containers
CONTAINERS=$(docker compose -f docker-compose.vps.yml ps -q | wc -l)
if [ "$CONTAINERS" -lt 3 ]; then
  echo "❌ WARNING: Only $CONTAINERS containers running"
fi

# Health check
if curl -sf http://localhost:3010/api/health > /dev/null; then
  echo "✅ Application healthy"
else
  echo "❌ Application unhealthy"
fi

# Disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  echo "⚠️ WARNING: Disk usage at ${DISK_USAGE}%"
fi

# Memory
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEM_USAGE" -gt 90 ]; then
  echo "⚠️ WARNING: Memory usage at ${MEM_USAGE}%"
fi

echo "=== Check Complete ==="
```

**Automate with cron:**
```bash
crontab -e
# Add:
0 9 * * * /root/health-check.sh >> /var/log/cortexbuild-health.log 2>&1
```

---

### Log Rotation Check (Weekly)

```bash
# Check log sizes
docker system df -v

# Prune old logs (keeps last 7 days)
docker system prune --volumes --filter "until=168h" -f

# Rotate application logs
docker compose -f docker-compose.vps.yml logs --tail=1000 app > /var/log/cortexbuild/app-$(date +%Y%m%d).log
```

---

## Monitoring & Alerting

### Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /api/health` | Basic health | `{"status":"healthy"}` |
| `GET /api/health/detailed` | Detailed status | System metrics |
| `GET /api/health/db` | Database connectivity | DB latency |

### Setting Up Uptime Monitoring

**Using UptimeRobot (Free tier):**
1. Sign up at https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://www.cortexbuildpro.com/api/health`
   - Interval: 5 minutes
   - Alert contacts: Email, SMS, Slack

**Using Pingdom:**
```bash
# Add check for:
# - https://www.cortexbuildpro.com/api/health
# - Response time < 2s
# - SSL certificate validity
```

### Custom Monitoring Script

```bash
#!/bin/bash
# /root/monitor.sh

URL="https://www.cortexbuildpro.com/api/health"
WEBHOOK="<SLACK_WEBHOOK_URL>"
LOG_FILE="/var/log/cortexbuild/monitor.log"

RESPONSE=$(curl -sf -w "\n%{http_code}" "$URL" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  MESSAGE="🚨 CortexBuild ALERT: Health check failed (HTTP $HTTP_CODE)"
  echo "$(date): $MESSAGE" >> "$LOG_FILE"
  
  # Send Slack notification
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"$MESSAGE\"}" \
    "$WEBHOOK" 2>/dev/null
fi
```

**Cron setup:**
```bash
*/5 * * * * /root/monitor.sh
```

---

### Resource Monitoring

**Install and configure Netdata:**
```bash
# Install
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access at: http://<VPS_IP>:19999
# Configure alerts in /etc/netdata/health.d/
```

**Key metrics to monitor:**
- CPU usage > 80% for 5 minutes
- Memory usage > 90%
- Disk usage > 85%
- Network errors
- Docker container restarts

---

## Backup Procedures

### Automated Daily Backups

**Backup script location:** `/var/www/cortexbuildpro/deployment/backup.sh`

**What gets backed up:**
- PostgreSQL database (full dump)
- Environment configuration (sanitized)
- User uploaded files (if local storage)

**Cron schedule:**
```bash
# Daily at 2:00 AM
0 2 * * * /var/www/cortexbuildpro/deployment/backup.sh >> /var/log/cortexbuild/backup.log 2>&1
```

### Manual Backup

```bash
cd /var/www/cortexbuildpro/deployment

# Run backup
./backup.sh

# Verify backup created
ls -lh backups/

# Expected output:
# backup_20260314_020015.sql.gz (size varies)
```

### Backup Verification

**Monthly verification procedure:**

```bash
# 1. Create test restore environment
cd /tmp
mkdir backup-test && cd backup-test

# 2. Copy latest backup
cp /var/www/cortexbuildpro/deployment/backups/$(ls -t /var/www/cortexbuildpro/deployment/backups/ | head -1) .

# 3. Test restore
# (See restore procedure below)

# 4. Verify data integrity
# Run basic queries to verify

# 5. Cleanup
cd ..
rm -rf backup-test
```

### Offsite Backup

**Sync to S3 (optional):**
```bash
# Install AWS CLI
apt-get install -y awscli

# Configure
aws configure

# Sync backups
aws s3 sync /var/www/cortexbuildpro/deployment/backups/ s3://cortexbuild-backups/production/

# Add to cron (weekly)
0 3 * * 0 aws s3 sync /var/www/cortexbuildpro/deployment/backups/ s3://cortexbuild-backups/production/
```

---

## Rollback Procedure

### Quick Rollback (Last Known Good)

```bash
# SSH to VPS
ssh root@<VPS_HOST>
cd /var/www/cortexbuildpro/deployment

# 1. Identify previous image
docker images | grep cortexbuild-pro | head -5

# 2. Update docker-compose to use previous image
# Edit docker-compose.vps.yml, change image tag

# 3. Stop current app
docker compose -f docker-compose.vps.yml stop app

# 4. Start with previous image
docker compose -f docker-compose.vps.yml up -d app

# 5. Verify
curl -sf http://localhost:3010/api/health && echo "✅ Rollback successful"
```

### Full Rollback with Database

**⚠️ WARNING: This will restore database to backup state**

```bash
cd /var/www/cortexbuildpro/deployment

# 1. Stop application
docker compose -f docker-compose.vps.yml stop app

# 2. Create safety backup of current state
./backup.sh
mv backups/backup_*.sql.gz backups/pre-rollback-$(date +%Y%m%d_%H%M%S).sql.gz

# 3. Restore database to previous backup
# Replace BACKUP_FILE with actual backup
BACKUP_FILE="backups/backup_20260313_020015.sql.gz"
./restore.sh "$BACKUP_FILE"

# 4. Rollback application code
git log --oneline -10  # Find commit to rollback to
git checkout <PREVIOUS_COMMIT>

# 5. Rebuild and restart
docker compose -f docker-compose.vps.yml up -d --build app

# 6. Verify
curl -sf http://localhost:3010/api/health
```

### Database-Only Rollback

```bash
# If only database needs rollback (app is fine)
cd /var/www/cortexbuildpro/deployment

# Stop app
docker compose -f docker-compose.vps.yml stop app

# Restore database
./restore.sh backups/backup_YYYYMMDD_HHMMSS.sql.gz

# Restart app
docker compose -f docker-compose.vps.yml start app
```

### Rollback Checklist

- [ ] Application stopped
- [ ] Pre-rollback backup created
- [ ] Database restored (if needed)
- [ ] Application code rolled back
- [ ] Services restarted
- [ ] Health checks passing
- [ ] SSL certificates valid
- [ ] Monitoring alerts cleared

---

## Scaling Operations

### Vertical Scaling (Upgrade VPS)

1. **Backup current state:**
   ```bash
   cd /var/www/cortexbuildpro/deployment
   ./backup.sh
   ```

2. **Create server snapshot** (if provider supports it)

3. **Upgrade VPS** through provider dashboard

4. **Verify services:**
   ```bash
   docker compose -f docker-compose.vps.yml ps
   curl http://localhost:3010/api/health
   ```

### Horizontal Scaling (Multi-instance)

**Architecture:**
```
┌─────────────────┐
│   Load Balancer │
│   (Nginx/HAProxy)│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│ App 1 │ │ App 2 │
│:3000  │ │:3001  │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         ▼
    ┌─────────┐
    │   DB    │
    │PostgreSQL│
    └─────────┘
```

**Implementation:**

1. **Update docker-compose.vps.yml:**
   ```yaml
   services:
     app:
       deploy:
         replicas: 2
       ports:
         - "3010-3011:3000"  # Port range
   ```

2. **Add load balancer:**
   ```nginx
   upstream app_cluster {
       least_conn;
       server app:3000;
       server app:3001;
   }
   ```

3. **Session management:**
   - Use Redis for session storage
   - Or enable sticky sessions in load balancer

---

## Security Operations

### Security Patch Procedure

**Monthly security updates:**

```bash
# 1. Check for updates
apt-get update
apt list --upgradable | grep -E "(docker|nginx|openssl|postgresql)"

# 2. Create backup
./backup.sh

# 3. Apply updates
apt-get upgrade -y docker.io docker-compose-plugin

# 4. Restart services
docker compose -f docker-compose.vps.yml restart

# 5. Verify
curl http://localhost:3010/api/health
docker --version
```

### Secret Rotation

**Rotate database password:**

```bash
cd /var/www/cortexbuildpro/deployment

# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 24 | tr -d "/+=")

# 2. Backup
docker compose -f docker-compose.vps.yml exec db pg_dumpall -U cortexbuild > /tmp/pre-rotation.sql

# 3. Change password
docker compose -f docker-compose.vps.yml exec db psql -U cortexbuild -c "ALTER USER cortexbuild WITH PASSWORD '$NEW_PASSWORD';"

# 4. Update .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$NEW_PASSWORD/" .env

# 5. Restart app
docker compose -f docker-compose.vps.yml restart app

# 6. Verify
curl http://localhost:3010/api/health
```

**Rotate NextAuth secret:**

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update .env
sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEW_SECRET/" .env

# 3. Restart app
docker compose -f docker-compose.vps.yml restart app

# Note: Users will be logged out
```

### Security Audit

**Monthly checklist:**

- [ ] Review Docker image vulnerabilities (`docker scan` or Trivy)
- [ ] Check for exposed ports: `netstat -tlnp`
- [ ] Verify firewall rules: `ufw status verbose`
- [ ] Review SSH access logs: `cat /var/log/auth.log | grep Failed`
- [ ] Check for unauthorized containers: `docker ps -a`
- [ ] Verify backup encryption
- [ ] Review GitHub Actions secrets

---

## Maintenance Windows

### Scheduled Maintenance Procedure

**Pre-maintenance (T-30 min):**
```bash
# 1. Announce maintenance
# Post to status page, notify users

# 2. Enable maintenance mode (if supported)
# Create maintenance page

# 3. Final backup
./backup.sh
```

**During maintenance:**
```bash
# 1. Stop application
docker compose -f docker-compose.vps.yml stop app

# 2. Perform maintenance tasks
# - Database migrations
# - Configuration updates
# - Security patches

# 3. Start application
docker compose -f docker-compose.vps.yml start app

# 4. Verify
curl http://localhost:3010/api/health
```

**Post-maintenance:**
```bash
# 1. Run full health check
./health-check.sh

# 2. Monitor for 30 minutes
watch -n 5 'curl -sf http://localhost:3010/api/health && echo OK'

# 3. Update status page
# Mark maintenance complete
```

### Zero-Downtime Deployment

**Blue-Green deployment:**

```bash
# 1. Start new version on different port
docker compose -f docker-compose.vps.yml -p green up -d app

# 2. Verify green deployment
curl http://localhost:3011/api/health

# 3. Switch nginx to green
# Update nginx upstream

# 4. Stop blue (old) deployment
docker compose -f docker-compose.vps.yml -p blue stop app

# 5. If issues, switch back to blue
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1 - Critical** | Complete outage | 15 min | Site down, data loss |
| **P2 - High** | Major feature broken | 1 hour | Login fails, payments down |
| **P3 - Medium** | Partial degradation | 4 hours | Slow performance, intermittent errors |
| **P4 - Low** | Minor issues | 24 hours | Cosmetic issues, non-urgent bugs |

### Incident Response Playbook

#### P1 - Complete Outage

```
1. DETECT (0-5 min)
   - Alert fires
   - Verify: curl http://localhost:3010/api/health
   - Check: docker compose -f docker-compose.vps.yml ps

2. RESPOND (5-15 min)
   - Join incident bridge (Slack/Zoom)
   - Assign Incident Commander
   - Create incident channel: #incident-YYYY-MM-DD

3. MITIGATE (15-30 min)
   - Attempt quick fixes:
     * Restart: docker compose restart
     * Check logs: docker compose logs
   - If no quick fix, execute rollback

4. RESOLVE (30+ min)
   - Verify service restored
   - Monitor for 30 minutes
   - Post incident summary

5. POST-INCIDENT (24-48 hours)
   - Schedule post-mortem
   - Document lessons learned
   - Implement preventive measures
```

#### Communication Template

**Initial Alert:**
```
🚨 INCIDENT ALERT 🚨
Severity: P1 - Critical
Status: Investigating
Impact: Complete service outage
Started: 2026-03-14 15:30 UTC
Channel: #incident-2026-03-14

We are investigating reports of service unavailability.
Updates every 15 minutes.
```

**Status Update:**
```
📊 INCIDENT UPDATE
Time: 15:45 UTC
Status: Identified
Summary: Database connection pool exhausted
Action: Restarting database and application
ETA: 10 minutes
```

**Resolution:**
```
✅ INCIDENT RESOLVED
Time: 16:00 UTC
Duration: 30 minutes
Root Cause: Database connection leak
Resolution: Restarted services, applied connection limit fix

Post-mortem scheduled: 2026-03-15 10:00 UTC
```

### Emergency Contacts

| Role | Contact | Method |
|------|---------|--------|
| Primary On-Call | +1-XXX-XXX-XXXX | Phone/SMS |
| Secondary | +1-XXX-XXX-XXXX | Phone/SMS |
| DevOps Team | devops@cortexbuildpro.com | Email |
| Infrastructure | infrastructure@cortexbuildpro.com | Email |

---

## Runbook Maintenance

**Quarterly review:**
- [ ] Update all version numbers
- [ ] Verify all commands still work
- [ ] Update contact information
- [ ] Review and update escalation procedures
- [ ] Test backup/restore procedures
- [ ] Update monitoring thresholds

**Document changes:**
```bash
# Update version header
git add OPS_RUNBOOK.md
git commit -m "docs: Update runbook v2.0.1 - Q1 2026 review"
git push origin Cortexbuildpro
```

---

**Questions or suggestions?** Open an issue or contact devops@cortexbuildpro.com