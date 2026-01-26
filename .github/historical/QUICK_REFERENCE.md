# 🚀 CortexBuild Pro - Quick Reference Guide

## Production URLs
- **Primary**: https://www.cortexbuildpro.com
- **Alternate**: https://cortexbuildpro.com

## Quick Deploy Command

```bash
# On your production server
cd /var/www
git clone https://github.com/adrianstanca1/cortexbuild-pro.git
cd cortexbuild-pro/deployment
./deploy-production.sh
```

## Essential Commands

### Service Management
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart application
docker compose restart app

# View logs
docker compose logs -f app

# Check status
docker compose ps
```

### Database Operations
```bash
# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# Backup database
./backup.sh

# Restore database
./restore.sh backups/backup-file.sql

# Access database
docker compose exec postgres psql -U cortexbuild -d cortexbuild
```

### SSL/HTTPS
```bash
# Setup SSL
./setup-ssl.sh cortexbuildpro.com admin@cortexbuildpro.com

# Renew certificate manually
docker compose run --rm certbot renew

# Check certificate expiration
echo | openssl s_client -servername www.cortexbuildpro.com \
  -connect www.cortexbuildpro.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### Monitoring
```bash
# View application logs
docker compose logs -f app

# View database logs
docker compose logs -f postgres

# View nginx logs
docker compose logs -f nginx

# Check resource usage
docker stats

# System health check
curl https://www.cortexbuildpro.com/api/auth/providers
```

### Updates
```bash
# Pull latest code
cd /var/www/cortexbuild-pro
git pull origin main

# Rebuild and restart
cd deployment
docker compose down
docker compose build --no-cache
docker compose up -d

# Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

## Environment Configuration

### Required Variables
```env
POSTGRES_PASSWORD=your_secure_password
NEXTAUTH_SECRET=your_secure_secret
NEXTAUTH_URL=https://www.cortexbuildpro.com
```

### Optional Services
```env
# AWS S3 (for file uploads)
AWS_REGION=us-west-2
AWS_BUCKET_NAME=your-bucket
AWS_FOLDER_PREFIX=cortexbuild/

# SendGrid (for emails)
SENDGRID_API_KEY=SG.your_key
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com

# Google OAuth (for social login)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
```

## Troubleshooting

### Application won't start
```bash
# Check logs
docker compose logs app

# Check environment
docker compose exec app printenv | grep -E 'DATABASE_URL|NEXTAUTH'

# Restart services
docker compose restart
```

### Database issues
```bash
# Check database health
docker compose exec postgres pg_isready -U cortexbuild

# View database logs
docker compose logs postgres

# Connect to database
docker compose exec postgres psql -U cortexbuild -d cortexbuild
```

### SSL certificate issues
```bash
# Check DNS propagation
dig cortexbuildpro.com +short
dig www.cortexbuildpro.com +short

# Manually obtain certificate
docker compose run --rm certbot certonly \
  --standalone \
  --email admin@cortexbuildpro.com \
  --agree-tos \
  -d cortexbuildpro.com \
  -d www.cortexbuildpro.com

# Restart nginx
docker compose restart nginx
```

### Out of disk space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old backups (keep last 7)
cd /var/www/cortexbuild-pro/deployment/backups
ls -t | tail -n +8 | xargs rm -f
```

## Security Checklist

- [ ] Firewall enabled (ports 22, 80, 443 only)
- [ ] Strong database password set
- [ ] SSL certificates configured
- [ ] Regular backups scheduled
- [ ] Environment variables secured
- [ ] Root SSH login disabled
- [ ] Regular system updates applied

## Key Features

### Core Modules
- ✅ Projects Management
- ✅ Tasks (List, Kanban, Gantt)
- ✅ RFIs (Request for Information)
- ✅ Submittals
- ✅ Time Tracking
- ✅ Budget Management
- ✅ Safety Management
- ✅ Daily Reports
- ✅ Document Management
- ✅ Team Management

### Advanced Features
- ✅ Real-time Collaboration
- ✅ Admin Console
- ✅ API Management
- ✅ Audit Logging
- ✅ Health Monitoring

## Architecture

### Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Node.js 20, PostgreSQL 15, Prisma ORM
- **Infrastructure**: Docker, Nginx, Let's Encrypt
- **Real-time**: Socket.IO with JWT auth

### Ports
- **3000**: Next.js application
- **5432**: PostgreSQL database
- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS

## Documentation

- **Complete Guide**: [DEPLOY_TO_CORTEXBUILDPRO.md](DEPLOY_TO_CORTEXBUILDPRO.md)
- **Main README**: [README.md](README.md)
- **API Setup**: [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)
- **Production Deployment**: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **Security**: [SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Review documentation in project root
3. Check service status: `docker compose ps`
4. Verify configuration: `./verify-config.sh`

---

**Last Updated**: January 26, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
