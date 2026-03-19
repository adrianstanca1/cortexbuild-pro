# 📋 CortexBuild Pro - Deployment Manifest

**Manifest ID:** CBP-DEPLOY-20260318-001  
**Generated:** 2026-03-18 08:17 UTC  
**Version:** 2.0.0  
**Target:** Production VPS

---

## 1. Infrastructure Requirements

### VPS Specifications
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Network | 100 Mbps | 1 Gbps |

### Required Software
- Docker 24.0+
- Docker Compose v2.20+
- Git
- OpenSSL
- UFW (firewall)

---

## 2. Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Port 80/443)                   │
│              Reverse Proxy + SSL Termination             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS APP (Port 3010)                     │
│           Construction Management Platform               │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │    MinIO     │
│   (Port 5432)│  │   (Port 6379)│  │   (Port 9000)│
│   Database   │  │   Cache      │  │   File Store │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 3. Container Specification

### Production Containers
| Name | Image | Port | Memory | CPU |
|------|-------|------|--------|-----|
| cortexbuild-db | postgres:15-alpine | 5432 | 1G | 1.0 |
| cortexbuild-redis | redis:7-alpine | 6379 | 256M | 0.5 |
| cortexbuild-app | cortexbuild-app:latest | 3010 | 2G | 2.0 |
| cortexbuild-nginx | nginx:alpine | 80,443 | 512M | 0.5 |
| cortexbuild-certbot | certbot/certbot | - | 128M | 0.1 |

### Monitoring Containers (Optional)
| Name | Image | Port | Memory | CPU |
|------|-------|------|--------|-----|
| cortexbuild-prometheus | prom/prometheus:v2.48.0 | 9090 | 512M | 0.5 |
| cortexbuild-grafana | grafana/grafana:10.2.3 | 3001 | 256M | 0.25 |

---

## 4. Network Configuration

### Ports Exposed
| Port | Service | Protocol | Purpose |
|------|---------|----------|---------|
| 22 | SSH | TCP | Remote access |
| 80 | Nginx | TCP | HTTP redirect |
| 443 | Nginx | TCP | HTTPS |
| 3010 | App | TCP | Direct access (internal) |

### Internal Network
- Network: `cortexbuild-network` (bridge)
- Subnet: `172.28.0.0/16`
- DNS: Docker internal DNS

---

## 5. Volume Specification

### Persistent Volumes
| Volume | Purpose | Size Estimate |
|--------|---------|---------------|
| postgres_data | Database storage | 5-20 GB |
| redis_data | Redis persistence | 100 MB |
| app_uploads | User uploaded files | 1-5 GB |
| certbot_certs | SSL certificates | 10 MB |

### Bind Mounts
| Host Path | Container Path | Purpose |
|-----------|----------------|---------|
| ./nginx.prod.conf | /etc/nginx/nginx.conf | Nginx config |
| .env.production | /app/.env.production | Environment |
| ./backups | /backups | Database backups |

---

## 6. Environment Variables

### Required
```yaml
POSTGRES_USER: cortexbuild
POSTGRES_PASSWORD: <secure-24-char>
POSTGRES_DB: cortexbuild
NEXTAUTH_SECRET: <secure-32-char>
NEXTAUTH_URL: https://your-domain.com
ENCRYPTION_KEY: <secure-hex-64-char>
```

### Optional
```yaml
AWS_ACCESS_KEY_ID: ""
AWS_SECRET_ACCESS_KEY: ""
AWS_BUCKET_NAME: ""
OLLAMA_URL: http://host.docker.internal:11434
SENDGRID_API_KEY: ""
GRAFANA_ADMIN_USER: admin
GRAFANA_ADMIN_PASSWORD: <secure>
```

---

## 7. Health Check Specification

### Application Health
- **Endpoint:** `GET /api/health`
- **Expected:** HTTP 200, JSON response
- **Interval:** 30s
- **Timeout:** 10s
- **Retries:** 3
- **Start Period:** 120s

### Database Health
- **Command:** `pg_isready -U cortexbuild`
- **Interval:** 10s
- **Timeout:** 5s
- **Retries:** 5

### Nginx Health
- **Command:** `nginx -t`
- **Interval:** 30s
- **Timeout:** 10s

---

## 8. Security Configuration

### Container Security
- Non-root user: `nextjs:nodejs` (UID 1001)
- Read-only root filesystem
- No privileged mode
- Resource limits enforced

### Network Security
- Rate limiting: 100 req/s (API), 100 req/s (general)
- Burst allowance: 200 requests
- SSL/TLS 1.3 enforced
- HSTS enabled

### Application Security
- NextAuth JWT encryption
- bcrypt password hashing
- CORS configured
- CSRF protection

---

## 9. Backup Strategy

### Database Backup
- **Frequency:** Daily (cron: 0 2 * * *)
- **Retention:** 30 days
- **Format:** gzip compressed SQL
- **Location:** `/var/www/cortexbuildpro/deployment/backups/`

### Backup Commands
```bash
# Manual backup
./backup.sh

# Restore
./restore.sh backups/backup_YYYYMMDD.sql.gz

# Verify backup
gunzip -c backups/backup_*.sql.gz | head -20
```

---

## 10. Monitoring Configuration

### Metrics Collected
- Application response time
- Database query time
- Memory usage per container
- CPU usage per container
- Request rate
- Error rate

### Alerting Rules
- Application down > 1 min
- Database connection lost
- Memory usage > 90%
- Disk usage > 85%
- Error rate > 5%

### Dashboards
- Application Overview
- Database Performance
- Resource Utilization
- Error Tracking

---

## 11. Deployment Commands

### Initial Deploy
```bash
cd /var/www/cortexbuildpro/deployment
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

### Update Deploy
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./deploy-to-vps.sh --force
```

### Rollback
```bash
# Stop current
docker-compose -f docker-compose.prod.yml down

# Start previous image
./deploy-to-vps.sh --rollback
```

---

## 12. SSL/TLS Configuration

### Certificate Authority: Let's Encrypt
- **Issuer:** R3 (Let's Encrypt)
- **Validity:** 90 days
- **Auto-renewal:** Enabled
- **Domains:** your-domain.com, www.your-domain.com

### Setup Command
```bash
./setup-ssl.sh your-domain.com admin@your-domain.com
```

### Certificate Renewal
```bash
# Manual renew
docker-compose run --rm certbot renew

# Auto (daemon)
# Runs every 12 hours in certbot container
```

---

## 13. Database Migration

### Migration Tool: Prisma
- **Schema:** prisma/schema.prisma
- **Migrations:** prisma/migrations/
- **Command:** `npx prisma migrate deploy`

### Migration Process
1. Container starts
2. Prisma client generated
3. Migration detected
4. `prisma migrate deploy` executed
5. Schema validated
6. Application starts

### Seed Data
```bash
./seed-db.sh
# Creates: Super Admin, Company Owner, Sample Projects
```

---

## 14. Performance Benchmarks

### Expected Performance
| Metric | Target | Acceptable |
|--------|--------|------------|
| First Byte | < 200ms | < 500ms |
| Page Load | < 2s | < 5s |
| API Response | < 100ms | < 300ms |
| DB Query | < 50ms | < 100ms |

### Load Testing
```bash
# Install ab
apt-get install apache2-utils

# Test health endpoint
ab -n 10000 -c 100 http://localhost:3010/api/health

# Test homepage
ab -n 5000 -c 50 http://localhost:3010/
```

---

## 15. Deployment Checklist

### Pre-Deployment
- [ ] VPS provisioned
- [ ] Docker installed
- [ ] DNS configured
- [ ] SSH keys deployed
- [ ] Firewall configured

### Deployment
- [ ] Code transferred
- [ ] Environment configured
- [ ] Images built
- [ ] Containers started
- [ ] Health checks passing

### Post-Deployment
- [ ] SSL configured
- [ ] Database seeded
- [ ] Monitoring enabled
- [ ] Backups scheduled
- [ ] Documentation updated

---

## 16. Contact & Support

### Primary Contact
- **Name:** Adrian Stanca
- **Email:** adrian.stanca1@gmail.com
- **Role:** DevOps Engineer

### Escalation
1. Check logs: `docker-compose logs -f`
2. Verify health: `./health-verify.sh`
3. Restart services: `docker-compose restart`
4. Rollback if needed: `./deploy-to-vps.sh --rollback`

---

**Manifest Version:** 1.0  
**Last Updated:** 2026-03-18  
**Next Review:** 2026-04-18
