# CortexBuild Pro - Production Operations Runbook

**Version:** 1.0.0  
**Last Updated:** January 25, 2026  
**Audience:** DevOps Engineers, SREs, On-Call Personnel

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Deployment Procedures](#3-deployment-procedures)
4. [Monitoring & Alerts](#4-monitoring--alerts)
5. [Common Issues & Troubleshooting](#5-common-issues--troubleshooting)
6. [Incident Response](#6-incident-response)
7. [Backup & Recovery](#7-backup--recovery)
8. [Rollback Procedures](#8-rollback-procedures)
9. [Database Operations](#9-database-operations)
10. [Performance Tuning](#10-performance-tuning)
11. [Security Operations](#11-security-operations)
12. [On-Call Procedures](#12-on-call-procedures)

---

## 1. System Overview

### Application Stack

- **Frontend:** Next.js 16 (React 18.2)
- **Backend:** Node.js 20 with Next.js API routes
- **Database:** PostgreSQL 15
- **Storage:** AWS S3
- **Real-time:** Socket.IO
- **Container:** Docker with Docker Compose
- **Reverse Proxy:** Nginx

### Key Services

| Service | Purpose | Port | Health Check |
|---------|---------|------|--------------|
| **Next.js App** | Main application | 3000 | `/api/auth/providers` |
| **PostgreSQL** | Primary database | 5432 | `pg_isready` |
| **Nginx** | Reverse proxy, SSL termination | 80, 443 | HTTP 200 on `/` |

### Service Dependencies

```
┌─────────────┐
│   Nginx     │ (80/443)
└──────┬──────┘
       │
┌──────▼──────┐
│  Next.js    │ (3000)
│  + Socket.IO│
└──┬────┬─────┘
   │    │
   │    └─────────┐
   │              │
┌──▼──────┐  ┌───▼─────┐
│PostgreSQL│  │ AWS S3  │
│  (5432) │  │         │
└─────────┘  └─────────┘
```

---

## 2. Architecture

### Multi-Tenant Architecture

- **Organization-Level Isolation:** All data scoped by `organizationId`
- **Role-Based Access:** 5 roles with hierarchical permissions
- **Data Segregation:** Enforced at query level (Prisma middleware)

### High-Level Data Flow

```
User Request → Nginx → Next.js Middleware (Auth/RBAC)
    → API Route → Rate Limiter → CSRF Check
    → Business Logic → Prisma → PostgreSQL
    → Response → Client
```

---

## 3. Deployment Procedures

### Pre-Deployment Checklist

- [ ] Code reviewed and merged to `main` branch
- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Database migrations reviewed
- [ ] Environment variables updated
- [ ] Security scan passed (CodeQL, npm audit)
- [ ] Release notes prepared
- [ ] Rollback plan documented
- [ ] Stakeholders notified

### Standard Deployment (Docker Compose)

```bash
# 1. Backup database
cd /home/runner/work/cortexbuild-pro/cortexbuild-pro/deployment
./backup.sh

# 2. Pull latest code
git pull origin main

# 3. Build and deploy
docker-compose build --no-cache
docker-compose up -d

# 4. Run database migrations
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"

# 5. Verify deployment
curl https://cortexbuildpro.abacusai.app/api/auth/providers

# 6. Monitor logs
docker-compose logs -f --tail=100
```

### Zero-Downtime Deployment

```bash
# 1. Start new version alongside old
docker-compose up -d --scale app=2 --no-recreate

# 2. Wait for health checks to pass
for i in {1..30}; do
  curl -f http://localhost:3000/api/auth/providers && break || sleep 2
done

# 3. Update Nginx to route to new version
# (Manual Nginx reload or automated blue-green switch)

# 4. Gracefully stop old version
docker-compose stop app
docker-compose rm -f app
```

### Database Migration Deployment

```bash
# 1. Take database backup
./deployment/backup.sh

# 2. Apply migrations (dry run first)
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy --help"

# 3. Apply migrations
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"

# 4. Verify migration status
docker-compose exec app sh -c "cd /app && npx prisma migrate status"

# 5. If issues, rollback (see section 8)
```

---

## 4. Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Target | Alert Threshold | Escalation |
|--------|--------|-----------------|------------|
| **API Response Time (p95)** | < 500ms | > 2s | Page on-call |
| **Error Rate** | < 0.1% | > 1% | Page on-call |
| **Database Connections** | < 80% pool | > 90% | Email team |
| **Memory Usage** | < 70% | > 85% | Email team |
| **Disk Usage** | < 70% | > 80% | Page on-call |
| **SSL Certificate Expiry** | > 30 days | < 14 days | Email team |

### Health Check Endpoints

```bash
# Application health
curl https://cortexbuildpro.abacusai.app/api/auth/providers

# Database health
docker-compose exec postgres pg_isready -U cortexbuild

# Detailed system health
curl https://cortexbuildpro.abacusai.app/api/admin/system-health
```

### Log Locations

```bash
# Application logs
docker-compose logs -f app

# Nginx logs
docker-compose logs -f nginx

# PostgreSQL logs
docker-compose logs -f postgres

# System logs (host)
journalctl -u docker -f
```

---

## 5. Common Issues & Troubleshooting

### Issue: Application Won't Start

**Symptoms:**
- Container exits immediately
- "Address already in use" errors
- Connection refused on port 3000

**Diagnosis:**
```bash
# Check logs
docker-compose logs app

# Check port usage
sudo netstat -tlnp | grep 3000

# Check environment variables
docker-compose exec app env | grep DATABASE_URL
```

**Resolution:**
```bash
# Kill process on port 3000
sudo kill $(sudo lsof -t -i:3000)

# Restart containers
docker-compose restart app

# If environment issues, update .env and rebuild
docker-compose down
docker-compose up -d --build
```

---

### Issue: Database Connection Errors

**Symptoms:**
- "ECONNREFUSED" errors
- "Connection timeout" in logs
- Prisma errors

**Diagnosis:**
```bash
# Check database status
docker-compose ps postgres

# Test database connectivity
docker-compose exec postgres psql -U cortexbuild -c "SELECT 1"

# Check connection string
echo $DATABASE_URL
```

**Resolution:**
```bash
# Restart database
docker-compose restart postgres

# If persistent, check logs
docker-compose logs postgres

# Verify credentials
docker-compose exec postgres psql -U cortexbuild -d cortexbuild

# Rebuild Prisma client
docker-compose exec app sh -c "cd /app && npx prisma generate"
```

---

### Issue: High Memory Usage

**Symptoms:**
- Container OOM kills
- Slow response times
- Memory warnings in logs

**Diagnosis:**
```bash
# Check memory usage
docker stats

# Check Node.js heap
docker-compose exec app sh -c "node -e 'console.log(process.memoryUsage())'"
```

**Resolution:**
```bash
# Restart application
docker-compose restart app

# Increase memory limit in docker-compose.yml
# mem_limit: 2g

# Monitor for memory leaks
docker stats --no-stream
```

---

### Issue: Slow API Responses

**Symptoms:**
- Response times > 2s
- Timeout errors
- User complaints

**Diagnosis:**
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://cortexbuildpro.abacusai.app/api/projects

# curl-format.txt:
# time_total:  %{time_total}\n

# Check database query performance
docker-compose exec postgres psql -U cortexbuild -c "
SELECT pid, usename, query, query_start, state
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start;
"
```

**Resolution:**
```bash
# Add database indexes (see section 9)
# Restart application to clear connection pool
docker-compose restart app

# Scale horizontally (if needed)
docker-compose up -d --scale app=2
```

---

## 6. Incident Response

### Incident Severity Levels

| Level | Description | Response Time | Notification |
|-------|-------------|---------------|--------------|
| **P0 (Critical)** | Complete outage, data breach | 15 minutes | Page on-call + leadership |
| **P1 (High)** | Partial outage, degraded performance | 1 hour | Page on-call |
| **P2 (Medium)** | Non-critical feature broken | 4 hours | Email team |
| **P3 (Low)** | Minor issue, no user impact | 24 hours | Ticket |

### Incident Response Steps

1. **Acknowledge:**
   - Acknowledge alert in monitoring system
   - Post in incident channel (Slack/Teams)

2. **Assess:**
   - Determine severity level
   - Identify affected systems/users
   - Check recent changes

3. **Mitigate:**
   - Apply immediate fix (hotfix or rollback)
   - Communicate with stakeholders
   - Document actions taken

4. **Resolve:**
   - Verify fix in production
   - Close incident
   - Update status page

5. **Post-Mortem:**
   - Schedule within 48 hours
   - Document root cause
   - Create action items

### Incident Communication Template

```
**Incident:** [Brief description]
**Severity:** [P0/P1/P2/P3]
**Status:** [Investigating/Mitigating/Resolved]
**Impact:** [User-facing description]
**ETA:** [Estimated resolution time]
**Updates:** [Timestamp] - [Action taken]
```

---

## 7. Backup & Recovery

### Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| **Database (Full)** | Daily (2 AM UTC) | 30 days | S3 bucket |
| **Database (Incremental)** | Every 6 hours | 7 days | S3 bucket |
| **Application Config** | On change | Forever | Git repository |
| **User Files (S3)** | Continuous (S3 versioning) | 90 days | S3 versioning |

### Manual Backup

```bash
# Database backup
cd /home/runner/work/cortexbuild-pro/cortexbuild-pro/deployment
./backup.sh

# Verify backup
ls -lh backups/

# Upload to S3 (if not automatic)
aws s3 cp backups/backup-$(date +%Y%m%d).sql.gz s3://cortexbuild-backups/
```

### Restore from Backup

```bash
# 1. Download backup
aws s3 cp s3://cortexbuild-backups/backup-20260125.sql.gz ./

# 2. Stop application
docker-compose stop app

# 3. Restore database
gunzip backup-20260125.sql.gz
docker-compose exec -T postgres psql -U cortexbuild -d cortexbuild < backup-20260125.sql

# 4. Restart application
docker-compose start app

# 5. Verify
curl https://cortexbuildpro.abacusai.app/api/auth/providers
```

### Disaster Recovery Procedure

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 6 hours (last backup)

1. Spin up new infrastructure (if needed)
2. Restore latest database backup
3. Deploy application code
4. Update DNS records
5. Verify functionality
6. Communicate with users

---

## 8. Rollback Procedures

### Quick Rollback (Docker Tag)

```bash
# 1. Stop current deployment
docker-compose down

# 2. Checkout previous version
git checkout <previous-commit-sha>

# 3. Rebuild and deploy
docker-compose up -d --build

# 4. Verify
curl https://cortexbuildpro.abacusai.app/api/auth/providers
```

### Database Migration Rollback

```bash
# 1. Identify last migration
docker-compose exec app sh -c "cd /app && npx prisma migrate status"

# 2. Rollback migration (manual SQL)
docker-compose exec postgres psql -U cortexbuild -d cortexbuild

cortexbuild=# -- Run DOWN migration SQL manually

# 3. Update migration history
-- Mark migration as rolled back in _prisma_migrations table
```

**⚠️ Note:** Prisma doesn't support automatic down migrations. Always have manual SQL ready.

---

## 9. Database Operations

### Add Index for Performance

```sql
-- Connect to database
docker-compose exec postgres psql -U cortexbuild -d cortexbuild

-- Add index
CREATE INDEX CONCURRENTLY idx_tasks_project_status 
ON "Task" (project_id, status) 
WHERE deleted_at IS NULL;

-- Verify index usage
EXPLAIN ANALYZE SELECT * FROM "Task" WHERE project_id = 'xxx' AND status = 'ACTIVE';
```

### Vacuum and Analyze

```bash
# Run maintenance
docker-compose exec postgres psql -U cortexbuild -d cortexbuild -c "VACUUM ANALYZE;"

# Check table bloat
docker-compose exec postgres psql -U cortexbuild -d cortexbuild -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"
```

### Query Performance Analysis

```sql
-- Find slow queries
SELECT
  query,
  calls,
  total_time / calls AS avg_time_ms,
  total_time,
  rows
FROM pg_stat_statements
ORDER BY avg_time_ms DESC
LIMIT 10;
```

---

## 10. Performance Tuning

### Application-Level Optimizations

1. **Enable connection pooling:**
   - Already configured in Prisma (default 5 connections)
   - Increase if needed: `connection_limit=10` in DATABASE_URL

2. **Add caching:**
   ```typescript
   // Consider Redis for frequently accessed data
   // Not currently implemented
   ```

3. **Optimize database queries:**
   - Use `select` to fetch only needed fields
   - Use pagination for large result sets
   - Add database indexes

### Database Tuning (PostgreSQL)

```sql
-- Increase shared_buffers (25% of RAM)
ALTER SYSTEM SET shared_buffers = '512MB';

-- Increase work_mem for complex queries
ALTER SYSTEM SET work_mem = '16MB';

-- Enable parallel queries
ALTER SYSTEM SET max_parallel_workers_per_gather = 2;

-- Reload configuration
SELECT pg_reload_conf();
```

---

## 11. Security Operations

### Rotate Secrets

```bash
# 1. Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Update .env file
nano /home/runner/work/cortexbuild-pro/cortexbuild-pro/deployment/.env

# 3. Restart application
docker-compose restart app

# 4. Invalidate old sessions (if rotating NEXTAUTH_SECRET)
docker-compose exec postgres psql -U cortexbuild -c "TRUNCATE \"Session\";"
```

### Review Security Logs

```bash
# Check for failed login attempts
docker-compose logs app | grep "authentication failed"

# Check for rate limit violations
docker-compose logs app | grep "rate limit exceeded"

# Check for CSRF failures
docker-compose logs app | grep "CSRF validation failed"
```

### Apply Security Patches

```bash
# 1. Check for vulnerabilities
cd /home/runner/work/cortexbuild-pro/cortexbuild-pro/nextjs_space
npm audit

# 2. Fix vulnerabilities
npm audit fix

# 3. Test and deploy
npm test
npm run build
docker-compose up -d --build
```

---

## 12. On-Call Procedures

### On-Call Checklist

- [ ] Have access to production systems
- [ ] Have access to monitoring dashboards
- [ ] Have access to incident communication channel
- [ ] Have runbook bookmarked
- [ ] Have recent backup verified
- [ ] Escalation contacts saved

### Handoff Checklist

- [ ] Review recent incidents
- [ ] Review outstanding issues
- [ ] Review upcoming deployments
- [ ] Share any system quirks/concerns

### Escalation Matrix

| Issue Type | Primary Contact | Secondary Contact | Escalation |
|------------|----------------|-------------------|------------|
| **Application** | On-call engineer | Dev lead | CTO |
| **Database** | On-call engineer | DBA | Infrastructure lead |
| **Security** | On-call engineer | Security lead | CISO |
| **Infrastructure** | On-call engineer | DevOps lead | Infrastructure lead |

---

## Appendix

### Quick Reference Commands

```bash
# View all containers
docker-compose ps

# Restart everything
docker-compose restart

# View logs
docker-compose logs -f app

# Database backup
./deployment/backup.sh

# Database restore
./deployment/restore.sh <backup-file>

# Run migrations
docker-compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Health check
curl https://cortexbuildpro.abacusai.app/api/auth/providers
```

### Contact Information

- **On-Call Rotation:** [Link to PagerDuty/OpsGenie]
- **Incident Channel:** [Slack/Teams channel]
- **Status Page:** [Status page URL]
- **Documentation:** [Confluence/Notion URL]

---

**Last Reviewed:** 2026-01-25  
**Next Review:** 2026-04-25  
**Owner:** DevOps Team
