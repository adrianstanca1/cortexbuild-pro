# CortexBuild Pro - Environment Configuration Guide

## Overview

This guide covers all environment variables required for production deployment of CortexBuild Pro on VPS.

---

## Quick Setup

```bash
# 1. Copy template
cd /var/www/cortexbuildpro/deployment
cp .env.production.template .env.production

# 2. Generate secrets
export POSTGRES_PASSWORD=$(openssl rand -base64 24)
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export ENCRYPTION_KEY=$(openssl rand -hex 32)

# 3. Edit configuration
nano .env.production

# 4. Set secure permissions
chmod 600 .env.production
```

---

## Required Environment Variables

### Database Configuration

| Variable | Required | Example | Generation |
|----------|----------|---------|------------|
| `POSTGRES_USER` | Yes | `cortexbuild` | Manual |
| `POSTGRES_PASSWORD` | Yes | *(24 char base64)* | `openssl rand -base64 24` |
| `POSTGRES_DB` | Yes | `cortexbuild` | Manual |

**Security Notes:**
- Password must be at least 16 characters
- Use unique password per environment
- Rotate every 90 days

---

### Authentication Configuration

| Variable | Required | Example | Generation |
|----------|----------|---------|------------|
| `NEXTAUTH_SECRET` | Yes | *(32 char base64)* | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `https://your-domain.com` | Manual |
| `ENCRYPTION_KEY` | Yes | *(64 char hex)* | `openssl rand -hex 32` |

**Security Notes:**
- NEXTAUTH_SECRET must be cryptographically random
- NEXTAUTH_URL must use HTTPS in production
- Never reuse secrets across environments

---

### AWS S3 Configuration (Required for File Uploads)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `AWS_ACCESS_KEY_ID` | Yes | `AKIA...` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | *(secret)* | IAM user secret |
| `AWS_BUCKET_NAME` | Yes | `cortexbuild-uploads` | S3 bucket name |
| `AWS_REGION` | No | `eu-west-2` | Default: eu-west-2 |
| `AWS_FOLDER_PREFIX` | No | `cortexbuild/` | Optional prefix |

**Setup Steps:**
1. Create IAM user with S3 permissions
2. Create S3 bucket
3. Configure bucket policy
4. Add credentials to .env.production

---

## Optional Environment Variables

### AI Features

| Variable | Default | Example | Notes |
|----------|---------|---------|-------|
| `AI_PROVIDER` | `ollama` | `ollama`, `gemini`, `abacus` | AI backend |
| `OLLAMA_URL` | `http://host.docker.internal:11434` | - | Local Ollama |
| `OLLAMA_MODEL` | `qwen2.5:7b` | `llama2`, `mistral` | Model to use |
| `GEMINI_API_KEY` | - | `AIza...` | Google AI Studio |
| `ABACUSAI_API_KEY` | - | - | AbacusAI API |

---

### OAuth Configuration

#### Google OAuth

| Variable | Example | Notes |
|----------|---------|-------|
| `GOOGLE_CLIENT_ID` | `123456...apps.googleusercontent.com` | From Google Cloud |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | From Google Cloud |

#### GitHub OAuth

| Variable | Example | Notes |
|----------|---------|-------|
| `GITHUB_CLIENT_ID` | `Iv1...` | From GitHub Settings |
| `GITHUB_CLIENT_SECRET` | `ghs_...` | From GitHub Settings |

---

### Email Configuration

#### SendGrid

| Variable | Example | Notes |
|----------|---------|-------|
| `SENDGRID_API_KEY` | `SG....` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | `noreply@your-domain.com` | Sender address |
| `SENDGRID_FROM_NAME` | `CortexBuild Pro` | Sender name |

#### Custom SMTP

| Variable | Example | Notes |
|----------|---------|-------|
| `SMTP_HOST` | `smtp.mailgun.org` | SMTP server |
| `SMTP_PORT` | `587` | TLS port |
| `SMTP_USER` | `user@domain.com` | SMTP username |
| `SMTP_PASSWORD` | `secret` | SMTP password |
| `EMAIL_FROM` | `noreply@domain.com` | Sender address |

---

### WebSocket Configuration

| Variable | Default | Example | Notes |
|----------|---------|---------|-------|
| `NEXT_PUBLIC_WEBSOCKET_URL` | - | `https://your-domain.com` | WebSocket endpoint |
| `WEBSOCKET_PORT` | `3000` | `3000` | WebSocket port |

---

### Domain & SSL

| Variable | Example | Notes |
|----------|---------|-------|
| `DOMAIN` | `your-domain.com` | For Let's Encrypt |
| `SSL_EMAIL` | `admin@your-domain.com` | Certificate contact |

---

### Monitoring (Optional)

| Variable | Default | Example | Notes |
|----------|---------|---------|-------|
| `GRAFANA_ADMIN_USER` | `admin` | `admin` | Grafana login |
| `GRAFANA_ADMIN_PASSWORD` | - | `secure-password` | Grafana password |
| `GRAFANA_ROOT_URL` | `http://localhost:3001` | `https://grafana.domain.com` | Grafana URL |
| `SLACK_WEBHOOK_URL` | - | `https://hooks.slack.com/...` | Alert notifications |

---

## Environment Variable Validation

### Pre-Deployment Check Script

```bash
#!/bin/bash
# Save as: scripts/validate-env.sh

set -e

ENV_FILE=".env.production"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

# Source environment
set -a
source "$ENV_FILE"
set +a

# Validate required variables
required=("POSTGRES_PASSWORD" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "ENCRYPTION_KEY")

for var in "${required[@]}"; do
    if [ -z "${!var:-}" ]; then
        echo "Error: $var is not set"
        exit 1
    fi
done

# Validate password length
if [ ${#POSTGRES_PASSWORD} -lt 16 ]; then
    echo "Warning: POSTGRES_PASSWORD should be at least 16 characters"
fi

# Validate NEXTAUTH_URL format
if [[ ! "$NEXTAUTH_URL" =~ ^https:// ]]; then
    echo "Warning: NEXTAUTH_URL should use HTTPS in production"
fi

echo "✓ Environment validation passed"
```

---

## Security Best Practices

### File Permissions

```bash
# Set secure permissions
chmod 600 .env.production
chown root:root .env.production
```

### Secret Rotation

```bash
# Rotate database password
NEW_PASS=$(openssl rand -base64 24)
# Update .env.production
# Update database: ALTER USER cortexbuild WITH PASSWORD '$NEW_PASS';
# Restart: docker-compose restart app db

# Rotate NEXTAUTH_SECRET
NEW_SECRET=$(openssl rand -base64 32)
# Update .env.production
# Restart: docker-compose restart app
# Note: Users will be logged out
```

### Never Commit Secrets

```bash
# Add to .gitignore
echo ".env.production" >> .gitignore
echo ".env" >> .gitignore

# Check for accidental commits
git grep -l "POSTGRES_PASSWORD\|NEXTAUTH_SECRET" || true
```

---

## Environment-Specific Configurations

### Development (.env.development)

```env
POSTGRES_PASSWORD=dev_password
NEXTAUTH_SECRET=dev_secret_change_in_production
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### Staging (.env.staging)

```env
POSTGRES_PASSWORD=staging_password_here
NEXTAUTH_SECRET=staging_secret_here
NEXTAUTH_URL=https://staging.cortexbuildpro.com
NODE_ENV=production
```

### Production (.env.production)

```env
POSTGRES_PASSWORD=<strong-random-password>
NEXTAUTH_SECRET=<strong-random-secret>
NEXTAUTH_URL=https://www.cortexbuildpro.com
NODE_ENV=production
```

---

## Troubleshooting

### Environment Not Loading

```bash
# Check file exists
ls -la .env.production

# Check permissions
chmod 600 .env.production

# Check format (no spaces around =)
grep -E '^[A-Z_]+=' .env.production
```

### Application Can't Connect to Database

1. Verify POSTGRES_PASSWORD matches in both db and app sections
2. Check DATABASE_URL format
3. Ensure db container is healthy
4. Review network configuration

### Auth Not Working

1. Verify NEXTAUTH_SECRET is base64
2. Check NEXTAUTH_URL matches domain
3. Restart app container
4. Clear browser cookies

---

## Quick Reference Commands

```bash
# Generate secure passwords
openssl rand -base64 24    # Database password
openssl rand -base64 32    # NextAuth secret
openssl rand -hex 32       # Encryption key

# View current environment
docker-compose exec app env | grep -E 'POSTGRES|NEXTAUTH|ENCRYPTION'

# Validate .env file
cat .env.production | grep -v '^#' | grep -v '^$' | sort

# Test environment loading
set -a && source .env.production && set +a && echo "Loaded OK"
```

---

## File Locations

| File | Purpose |
|------|---------|
| `.env.production.template` | Template with placeholders |
| `.env.production` | Active production config |
| `docker-compose.prod.yml` | References .env.production |
| `deployment/README.md` | Usage documentation |

---

*Last Updated: 2026-03-18*
*Version: 1.0*
