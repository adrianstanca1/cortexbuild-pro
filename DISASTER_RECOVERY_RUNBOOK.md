# 🚨 CortexBuild Pro - Disaster Recovery Runbook

**Last Updated:** January 29, 2026  
**Document Version:** 1.0.0  
**Audience:** DevOps Engineers, SREs, System Administrators

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Emergency Contacts](#emergency-contacts)
3. [Backup Strategy](#backup-strategy)
4. [Recovery Procedures](#recovery-procedures)
5. [Failure Scenarios](#failure-scenarios)
6. [Testing & Validation](#testing--validation)
7. [Post-Recovery](#post-recovery)

---

## Overview

### Recovery Time Objective (RTO)
- **Critical Services:** 4 hours
- **Full System:** 24 hours

### Recovery Point Objective (RPO)
- **Database:** 1 hour (hourly backups in production)
- **Files:** 24 hours (daily backups)

### Backup Locations
- **Primary:** Local VPS (`$HOME/backups/`)
- **Secondary:** AWS S3 (if configured)
- **Retention:** 7 daily, 4 weekly, 6 monthly

---

## Emergency Contacts

### Primary Contacts
```
Platform Owner: adrian.stanca1@gmail.com
DevOps Lead: [Configure]
Database Admin: [Configure]
Security Team: [Configure]
```

### Service Providers
```
VPS Provider: [Your provider]
DNS Provider: [Your provider]
AWS Support: [If using S3]
Monitoring: [If configured]
```

### Escalation Path
1. **Tier 1:** DevOps Engineer (Initial response)
2. **Tier 2:** Platform Owner (Critical issues)
3. **Tier 3:** Vendor Support (Infrastructure failures)

---

## Backup Strategy

### Automated Backups

**Daily Database Backups:**
```bash
# Cron schedule: Daily at 2 AM
0 2 * * * /home/cortexbuild-prod/htdocs/cortexbuild-pro/deployment/enterprise-backup.sh

# Manually trigger:
./deployment/enterprise-backup.sh
```

**Hourly Production Backups:**
```bash
# Cron schedule: Every hour
0 * * * * /home/cortexbuild-prod/backups/hourly-backup.sh

# Script content:
#!/bin/bash
HOUR=$(date +%H)
BACKUP_DIR="$HOME/backups/hourly"
mkdir -p "$BACKUP_DIR"

pg_dump $DATABASE_URL --clean --if-exists | \
  gzip > "$BACKUP_DIR/prod_hour_${HOUR}.sql.gz"
```

**File Backups (if storing files locally):**
```bash
# Daily at 3 AM
0 3 * * * tar -czf $HOME/backups/files_$(date +%Y%m%d).tar.gz \
  /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space/public/uploads
```

### Backup Verification

**Test Restore Monthly:**
```bash
# First Monday of each month
0 3 1-7 * 1 /home/cortexbuild-prod/scripts/test-restore.sh
```

**Backup Integrity Check:**
```bash
#!/bin/bash
# Verify all recent backups are valid

find $HOME/backups -name "*.sql.gz" -mtime -7 | while read backup; do
    if gzip -t "$backup" 2>/dev/null; then
        echo "✅ $backup - OK"
    else
        echo "❌ $backup - CORRUPTED"
        # Send alert
    fi
done
```

---

## Recovery Procedures

### Scenario 1: Database Corruption

**Symptoms:**
- Application shows database errors
- Cannot connect to database
- Data inconsistencies

**Recovery Steps:**

1. **Assess Damage:**
```bash
# Check database status
psql $DATABASE_URL -c "SELECT 1;"

# Check for corruption
psql $DATABASE_URL -c "VACUUM FULL ANALYZE VERBOSE;"
```

2. **Stop Application:**
```bash
pm2 stop cortexbuild-prod
```

3. **Restore from Latest Backup:**
```bash
cd /home/cortexbuild-prod/htdocs/cortexbuild-pro/deployment

# List available backups
./enterprise-restore.sh

# Restore specific backup
./enterprise-restore.sh /home/cortexbuild-prod/backups/daily/production_cortexbuild_20260129_020000.sql.gz
```

4. **Verify Restoration:**
```bash
# Check table count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Check recent data
psql $DATABASE_URL -c "SELECT * FROM users ORDER BY createdAt DESC LIMIT 5;"
```

5. **Start Application:**
```bash
pm2 start cortexbuild-prod
pm2 logs cortexbuild-prod --lines 50
```

6. **Verify Application:**
```bash
curl -I http://localhost:3000/api/auth/providers
```

**Expected Duration:** 30-60 minutes  
**Data Loss:** Up to 1 hour (hourly backups)

---

### Scenario 2: Complete Server Failure

**Symptoms:**
- Server unresponsive
- Cannot SSH
- Services down

**Recovery Steps:**

1. **Provision New VPS:**
   - Same or better specifications
   - Note new IP address
   - Ensure SSH access

2. **Update DNS:**
```bash
# Update A records to new IP
# Wait for propagation (15-60 minutes)
dig yourdomain.com +short
```

3. **Install CloudPanel:**
```bash
ssh root@NEW_VPS_IP

# Install CloudPanel
curl -fsSL https://installer.cloudpanel.io/ce/v2/install.sh | sudo bash
```

4. **Restore Application:**
```bash
# Create site user
# Clone repository
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/nextjs_space

# Restore environment variables (from secure backup)
# Copy .env file

# Install dependencies
npm install --legacy-peer-deps --production
npx prisma generate
```

5. **Restore Database:**
```bash
# Download backup from S3 (if configured)
aws s3 cp s3://your-backup-bucket/latest.sql.gz ./backup.sql.gz

# Or restore from local backup (if accessible)

# Restore
./deployment/enterprise-restore.sh backup.sql.gz
```

6. **Deploy Application:**
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

7. **Configure SSL:**
```bash
# Via CloudPanel UI or:
cd /home/cortexbuild-prod/htdocs/cortexbuild-pro/deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

**Expected Duration:** 4-8 hours  
**Data Loss:** Up to 24 hours (depending on last offsite backup)

---

### Scenario 3: Application Crash Loop

**Symptoms:**
- PM2 shows constant restarts
- Application exits immediately
- Error logs show critical failures

**Recovery Steps:**

1. **Check Logs:**
```bash
pm2 logs cortexbuild-prod --lines 100 --err
```

2. **Identify Issue:**
   - Database connection failures
   - Missing environment variables
   - Dependency conflicts
   - Memory issues

3. **Quick Fixes:**

**Database Connection:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# If fails, check if PostgreSQL is running
sudo systemctl status postgresql
sudo systemctl start postgresql
```

**Environment Variables:**
```bash
# Verify all required vars
cd nextjs_space
./scripts/security-audit.sh
```

**Memory Issues:**
```bash
# Check available memory
free -h

# Increase PM2 memory limit
pm2 stop cortexbuild-prod
# Edit ecosystem.config.js
# Set max_memory_restart: '2G'
pm2 start ecosystem.config.js
```

4. **Rollback to Previous Version:**
```bash
cd /home/cortexbuild-prod/htdocs/cortexbuild-pro

# View recent commits
git log --oneline -n 10

# Rollback
git checkout <previous-working-commit>
cd nextjs_space
npm install --legacy-peer-deps --production
npm run build
pm2 reload cortexbuild-prod
```

**Expected Duration:** 15-60 minutes  
**Data Loss:** None

---

### Scenario 4: SSL Certificate Expired

**Symptoms:**
- Browser shows security warning
- HTTPS not working
- Certificate expired error

**Recovery Steps:**

1. **Check Certificate Status:**
```bash
sudo certbot certificates

# Check expiry
sudo openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -noout -dates
```

2. **Renew Certificate:**
```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

3. **Verify:**
```bash
curl -I https://yourdomain.com
```

4. **Prevent Recurrence:**
```bash
# Verify renewal cron job
sudo crontab -l | grep certbot

# Should have:
# 0 0,12 * * * certbot renew --quiet
```

**Expected Duration:** 5-15 minutes  
**Data Loss:** None

---

### Scenario 5: Data Breach or Security Incident

**Immediate Actions:**

1. **Isolate System:**
```bash
# Block all traffic except emergency access
sudo ufw deny from any to any

# Allow specific admin IP only
sudo ufw allow from ADMIN_IP to any port 22
```

2. **Stop Services:**
```bash
pm2 stop all
sudo systemctl stop nginx
```

3. **Preserve Evidence:**
```bash
# Create forensic snapshot
sudo mkdir -p /root/incident-$(date +%Y%m%d-%H%M)
sudo cp -r /var/log/* /root/incident-*/logs/
sudo cp -r /home/cortexbuild-prod/htdocs/cortexbuild-pro/nextjs_space/logs/* /root/incident-*/app-logs/
```

4. **Notify Stakeholders:**
   - Contact security team
   - Notify affected users (if required)
   - Document incident timeline

5. **Investigation & Recovery:**
   - Review access logs
   - Check for unauthorized changes
   - Rotate all credentials
   - Apply security patches
   - Restore from clean backup if compromised

**See SECURITY_COMPLIANCE.md for full incident response procedures**

---

### Scenario 6: Disk Space Exhaustion

**Symptoms:**
- "No space left on device" errors
- Application cannot write logs
- Database cannot write data

**Recovery Steps:**

1. **Check Disk Usage:**
```bash
df -h
du -sh /home/cortexbuild-prod/* | sort -h

# Find large files
find /home/cortexbuild-prod -type f -size +100M
```

2. **Clear Space:**
```bash
# Clean old logs
find /home/cortexbuild-prod -name "*.log" -mtime +30 -delete

# Clean npm cache
npm cache clean --force

# Clean old backups (keep important ones!)
cd $HOME/backups/daily
ls -t *.sql.gz | tail -n +8 | xargs rm --

# Clean old PM2 logs
pm2 flush
```

3. **Rotate Logs:**
```bash
# Force log rotation
sudo logrotate -f /etc/logrotate.conf
```

4. **Restart Services:**
```bash
pm2 restart cortexbuild-prod
```

**Expected Duration:** 10-30 minutes  
**Data Loss:** None

---

## Testing & Validation

### Monthly DR Test Checklist

**First Monday of Each Month:**

- [ ] Download latest production backup
- [ ] Restore to staging environment
- [ ] Verify data integrity
- [ ] Test application functionality
- [ ] Document any issues found
- [ ] Update runbook if needed

### Backup Validation Script

```bash
#!/bin/bash
# /home/cortexbuild-prod/scripts/validate-backups.sh

DATE=$(date +%Y%m%d)
LOG="/tmp/backup-validation-$DATE.log"

echo "Backup Validation - $(date)" > $LOG

# Check daily backups exist
DAILY_BACKUP=$(find $HOME/backups/daily -name "*.sql.gz" -mtime -1 | head -1)
if [ -n "$DAILY_BACKUP" ]; then
    echo "✅ Daily backup found: $DAILY_BACKUP" >> $LOG
    
    # Verify integrity
    if gzip -t "$DAILY_BACKUP" 2>/dev/null; then
        echo "✅ Backup integrity OK" >> $LOG
    else
        echo "❌ Backup corrupted!" >> $LOG
        # Send alert
    fi
else
    echo "❌ No daily backup found!" >> $LOG
    # Send alert
fi

# Check S3 backups (if configured)
if command -v aws &> /dev/null && [ -n "$BACKUP_BUCKET_NAME" ]; then
    S3_COUNT=$(aws s3 ls s3://$BACKUP_BUCKET_NAME/cortexbuild/production/database/ | wc -l)
    echo "ℹ️  S3 backups: $S3_COUNT files" >> $LOG
fi

cat $LOG
```

---

## Post-Recovery

### Verification Checklist

After any recovery procedure:

- [ ] All services running (check `pm2 list`)
- [ ] Database accessible and responding
- [ ] Application responding to health checks
- [ ] SSL certificates valid
- [ ] Logs being written correctly
- [ ] Backups resumed
- [ ] Monitoring alerts cleared
- [ ] DNS resolving correctly
- [ ] Users can log in
- [ ] Core features functional

### Communication

**Internal:**
- Update team on recovery status
- Document timeline and actions taken
- Schedule post-mortem meeting

**External (if required):**
- Notify users of service restoration
- Provide incident summary
- Outline preventive measures

### Post-Mortem Template

```markdown
## Incident Post-Mortem

**Date:** YYYY-MM-DD  
**Duration:** X hours  
**Impact:** [Description]

### Timeline
- HH:MM - Incident detected
- HH:MM - Response initiated
- HH:MM - Root cause identified
- HH:MM - Recovery started
- HH:MM - Service restored

### Root Cause
[Detailed explanation]

### Resolution
[What was done to fix it]

### Lessons Learned
1. [Lesson 1]
2. [Lesson 2]

### Action Items
- [ ] Action 1 - Owner: [Name] - Due: [Date]
- [ ] Action 2 - Owner: [Name] - Due: [Date]

### Prevention
[How to prevent recurrence]
```

---

## Quick Reference Commands

### Backup
```bash
# Manual backup
./deployment/enterprise-backup.sh

# List backups
ls -lh $HOME/backups/daily/
```

### Restore
```bash
# Interactive restore
./deployment/enterprise-restore.sh

# Specific backup
./deployment/enterprise-restore.sh /path/to/backup.sql.gz
```

### Application
```bash
# Status
pm2 list
pm2 info cortexbuild-prod

# Logs
pm2 logs cortexbuild-prod

# Restart
pm2 restart cortexbuild-prod

# Reload (zero-downtime)
pm2 reload cortexbuild-prod
```

### Database
```bash
# Connect
psql $DATABASE_URL

# Status
sudo systemctl status postgresql

# Restart
sudo systemctl restart postgresql
```

### Nginx
```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx
```

### System
```bash
# Disk space
df -h

# Memory
free -h

# Processes
htop

# Logs
journalctl -xe
tail -f /var/log/nginx/error.log
```

---

## Document Maintenance

**Review Schedule:** Quarterly  
**Next Review:** [Date]  
**Owner:** DevOps Team

**Change Log:**
- 2026-01-29: Initial version created
- [Future changes]

---

**IMPORTANT:** Test this runbook regularly. An untested disaster recovery plan is not a disaster recovery plan.

---

**Last Updated:** January 29, 2026  
**Document Version:** 1.0.0
