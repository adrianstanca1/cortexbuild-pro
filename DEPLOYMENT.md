# CortexBuild Pro - Deployment Guide

> **Version:** 2.0.0  
> **Last Updated:** 2026-03-14  
> **Applies to:** VPS/Docker deployments via GitHub Actions CI/CD

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [VPS Deployment Process](#vps-deployment-process)
5. [Manual Deployment](#manual-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Database Management](#database-management)

---

## Overview

CortexBuild Pro uses a containerized architecture deployed via Docker Compose on a VPS. The deployment pipeline is fully automated through GitHub Actions.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS (Ubuntu)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Nginx      │  │  Next.js     │  │   PostgreSQL     │  │
│  │  (Port 80)   │  │  (Port 3000) │  │   (Port 5432)    │  │
│  │  SSL/Proxy   │  │  App Container│  │   DB Container   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                                        │
│         └─────────────────┘                                        │
│              Docker Compose                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  GitHub Container │
                    │  Registry (GHCR)  │
                    └──────────────────┘
```

### Deployment Methods

| Method | Use Case | Trigger |
|--------|----------|---------|
| **GitHub Actions (Auto)** | Production deployments | Push to `Cortexbuildpro` branch |
| **GitHub Actions (Manual)** | Hotfixes, specific branches | Workflow dispatch |
| **Manual VPS** | Emergency, debugging | SSH to VPS |

---

## Prerequisites

### VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04/24.04 LTS |
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 4 GB | 8+ GB |
| **Storage** | 40 GB SSD | 100+ GB SSD |
| **Network** | 1 Gbps | 1+ Gbps |

### Required Software

- Docker 24.0+
- Docker Compose v2.20+
- Git 2.40+
- OpenSSL (for secret generation)

### Domain & DNS

- Domain name registered (e.g., `cortexbuildpro.com`)
- DNS A records pointing to VPS IP:
  - `cortexbuildpro.com` → `<VPS_IP>`
  - `www.cortexbuildpro.com` → `<VPS_IP>`

### GitHub Secrets

Configure these in your repository settings (Settings → Secrets and variables → Actions):

| Secret | Description | Example |
|--------|-------------|---------|
| `VPS_HOST` | VPS IP address or hostname | `72.62.132.43` |
| `VPS_USER` | SSH username | `root` |
| `VPS_SSH_KEY` | Private SSH key (PEM format) | `-----BEGIN...` |
| `VPS_PASSWORD` | SSH password (if not using key) | `••••••••` |
| `GITHUB_TOKEN` | Auto-provided | *(auto)* |

---

## Environment Variables

### Required Variables

| Variable | Description | Generation |
|----------|-------------|------------|
| `POSTGRES_USER` | Database username | `cortexbuild` (default) |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 24` |
| `POSTGRES_DB` | Database name | `cortexbuild` (default) |
| `NEXTAUTH_SECRET` | NextAuth.js secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | `https://www.cortexbuildpro.com` |
| `ENCRYPTION_KEY` | Data encryption key | `openssl rand -hex 32` |

### Optional Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | File uploads |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | File uploads |
| `AWS_BUCKET_NAME` | S3 bucket name | File uploads |
| `AWS_REGION` | AWS region | File uploads (default: `eu-west-2`) |
| `GEMINI_API_KEY` | Google Gemini API | Cloud AI features |
| `ABACUSAI_API_KEY` | AbacusAI API | Cloud AI features |
| `AI_PROVIDER` | AI provider selection | `abacus`, `gemini`, or `ollama` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Google login |
| `SENDGRID_API_KEY` | SendGrid API | Email notifications |
| `DOMAIN` | Domain for SSL | Let's Encrypt SSL |
| `SSL_EMAIL` | SSL cert email | Let's Encrypt notifications |

### Environment File Location

Production environment file is auto-generated at:
```
/var/www/cortexbuildpro/deployment/.env
```

**Security:** Ensure file permissions are `600` (owner read/write only):
```bash
chmod 600 /var/www/cortexbuildpro/deployment/.env
```

---

## VPS Deployment Process

### Step 1: Trigger Deployment

#### Automatic Deployment
Push to the `Cortexbuildpro` branch:
```bash
git checkout Cortexbuildpro
git merge feature/your-feature
git push origin Cortexbuildpro
```

#### Manual Deployment
1. Go to GitHub → Actions → "Deploy to VPS"
2. Click "Run workflow"
3. Select branch (default: `Cortexbuildpro`)
4. Check "Set up SSL" (for first deploy)
5. Click "Run workflow"

### Step 2: CI/CD Pipeline Stages

The deployment runs through these stages:

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: Pre-deployment Checks                              │
│  ├── Checkout code                                            │
│  ├── Install dependencies                                     │
│  ├── Run lint                                                 │
│  └── Run tests                                                │
├─────────────────────────────────────────────────────────────┤
│  Stage 2: Build & Push Image                                   │
│  ├── Set up Docker Buildx                                     │
│  ├── Login to GHCR                                            │
│  ├── Build Docker image                                       │
│  └── Push to GitHub Container Registry                        │
├─────────────────────────────────────────────────────────────┤
│  Stage 3: Deploy to VPS                                        │
│  ├── SSH to VPS                                               │
│  ├── Pull latest code                                         │
│  ├── Configure environment                                    │
│  ├── Pull Docker image                                        │
│  ├── Start database                                           │
│  ├── Start application                                        │
│  ├── Run migrations                                           │
│  └── Verify deployment                                        │
├─────────────────────────────────────────────────────────────┤
│  Stage 4: SSL Setup (optional)                                │
│  ├── Obtain Let's Encrypt certificate                         │
│  └── Configure HTTPS                                          │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Monitor Deployment

Track progress in GitHub Actions:
1. Go to repository → Actions tab
2. Click on the running workflow
3. View real-time logs for each job

Expected deployment time: **5-10 minutes**

---

## Manual Deployment

Use manual deployment for emergency fixes or when CI/CD is unavailable.

### Prerequisites

```bash
# SSH to VPS
ssh root@<VPS_HOST>

# Verify Docker
docker --version
docker compose version
```

### Deployment Steps

```bash
# 1. Navigate to deployment directory
cd /var/www/cortexbuildpro/deployment

# 2. Pull latest code
git pull origin Cortexbuildpro

# 3. Pull latest Docker image
docker compose -f docker-compose.vps.yml pull app

# 4. Stop current application
docker compose -f docker-compose.vps.yml down app

# 5. Start database (if not running)
docker compose -f docker-compose.vps.yml up -d db
sleep 15

# 6. Start application
docker compose -f docker-compose.vps.yml up -d app

# 7. Run database migrations
docker compose -f docker-compose.vps.yml exec -T app sh -c "cd /app && npx prisma migrate deploy"

# 8. Verify deployment
docker compose -f docker-compose.vps.yml ps
curl -sf http://localhost:3010/api/health && echo "✅ App is healthy"
```

---

## Post-Deployment Verification

### Health Checks

```bash
# Check application health
curl -sf http://localhost:3010/api/health

# Check via nginx (if SSL configured)
curl -sf https://www.cortexbuildpro.com/api/health

# Check container status
docker compose -f docker-compose.vps.yml ps

# Check logs
docker compose -f docker-compose.vps.yml logs --tail=100 app
```

### Expected Responses

**Health Endpoint:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-14T15:30:00.000Z",
  "version": "2.0.0"
}
```

**Container Status:**
```
NAME                STATUS          PORTS
cortexbuild-app     Up 2 minutes   0.0.0.0:3010->3000/tcp
cortexbuild-db      Up 5 minutes   5432/tcp
cortexbuild-nginx   Up 2 minutes   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## SSL/TLS Configuration

### Automatic SSL (Let's Encrypt)

SSL is configured automatically during deployment when `setup_ssl=true`.

### Manual SSL Setup

```bash
# SSH to VPS
ssh root@<VPS_HOST>
cd /var/www/cortexbuildpro/deployment

# Ensure nginx is running (HTTP)
docker compose -f docker-compose.vps.yml up -d nginx

# Obtain certificate
docker compose -f docker-compose.vps.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@cortexbuildpro.com \
  --agree-tos \
  --no-eff-email \
  -d cortexbuildpro.com \
  -d www.cortexbuildpro.com

# Restart nginx with SSL
docker compose -f docker-compose.vps.yml restart nginx
```

### SSL Renewal

SSL certificates auto-renew via the certbot container. Verify renewal:
```bash
docker compose -f docker-compose.vps.yml logs certbot
```

### SSL Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Certificate fails | DNS not propagated | Wait 5-10 min, retry |
| Rate limit | Too many requests | Wait 1 hour |
| Domain mismatch | Wrong domain in request | Check DOMAIN env var |

---

## Database Management

### Migrations

**Run migrations manually:**
```bash
cd /var/www/cortexbuildpro/deployment
docker compose -f docker-compose.vps.yml exec -T app sh -c "cd /app && npx prisma migrate deploy"
```

**Check migration status:**
```bash
docker compose -f docker-compose.vps.yml exec -T app sh -c "cd /app && npx prisma migrate status"
```

### Database Backup

**Automated backups** run daily at 2 AM via cron.

**Manual backup:**
```bash
cd /var/www/cortexbuildpro/deployment
./backup.sh
```

**Backup location:**
```
/var/www/cortexbuildpro/deployment/backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

### Database Restore

```bash
cd /var/www/cortexbuildpro/deployment
./restore.sh backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

### Database Console Access

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.vps.yml exec db psql -U cortexbuild -d cortexbuild

# Common commands
\dt                    # List tables
\d table_name          # Describe table
\q                     # Quit
```

---

## Security Checklist

- [ ] Environment file has `600` permissions
- [ ] SSH key-based authentication enabled
- [ ] Firewall configured (UFW/iptables)
- [ ] Only ports 22, 80, 443 open
- [ ] Database not exposed to internet
- [ ] Secrets rotated regularly
- [ ] Backups encrypted and stored offsite
- [ ] Container images scanned for vulnerabilities

---

## Related Documentation

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and fixes
- [OPS_RUNBOOK.md](./OPS_RUNBOOK.md) - Operational procedures
- [deployment/README.md](./deployment/README.md) - Deployment scripts reference

---

**Need help?** Contact: support@cortexbuildpro.com