# 🔧 CortexBuild Pro - Deployment Troubleshooting Guide

**Last Updated:** January 26, 2026

This guide provides solutions to common errors and issues encountered during VPS deployment.

---

## 📋 Quick Diagnosis Commands

Run these commands to quickly diagnose issues:

```bash
# Check all container status
docker compose ps

# View all logs
docker compose logs --tail=50

# Check application health
curl http://localhost:3000/api/auth/providers

# Test database connection
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT 1;"

# Check environment variables
docker compose exec app printenv | grep -E "DATABASE_URL|NEXTAUTH|AWS|WEBSOCKET"
```

---

## 🗄️ Database Errors

### Error: "Can't reach database server"

**Symptoms:**
- Application fails to start
- Error: `Can't reach database server at postgres:5432`

**Solutions:**

```bash
# 1. Check if PostgreSQL container is running
docker compose ps postgres

# 2. If not running, start it
docker compose up -d postgres

# 3. Check PostgreSQL logs
docker compose logs postgres

# 4. Verify DATABASE_URL format
# Should be: postgresql://user:password@postgres:5432/dbname?schema=public
docker compose exec app printenv DATABASE_URL

# 5. Test database connection
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT version();"

# 6. Wait for database to be healthy
docker compose ps postgres
# Should show "healthy" status

# 7. Restart application
docker compose restart app
```

### Error: "Password authentication failed"

**Symptoms:**
- Database connection rejected
- Error in logs: `password authentication failed for user`

**Solutions:**

```bash
# 1. Verify POSTGRES_PASSWORD matches in DATABASE_URL
# Edit deployment/.env
nano deployment/.env

# Ensure POSTGRES_PASSWORD and DATABASE_URL password match
# Example:
# POSTGRES_PASSWORD=mypassword123
# DATABASE_URL="postgresql://cortexbuild:mypassword123@postgres:5432/cortexbuild?schema=public"

# 2. If you changed the password, recreate database
docker compose down -v  # WARNING: This deletes data
docker compose up -d

# 3. Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

### Error: "Database 'cortexbuild' does not exist"

**Solutions:**

```bash
# 1. Create database manually
docker compose exec postgres psql -U cortexbuild -d postgres -c "CREATE DATABASE cortexbuild;"

# 2. Or restart with clean slate
docker compose down -v
docker compose up -d postgres

# 3. Wait for database to be ready
sleep 10

# 4. Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"
```

---

## 🌐 Application Startup Errors

### Error: "Module not found" or "Cannot find module"

**Symptoms:**
- Application crashes on startup
- Error: `Cannot find module '@prisma/client'`

**Solutions:**

```bash
# 1. Rebuild application with fresh dependencies
docker compose down
docker compose up -d --build

# 2. Generate Prisma client inside container
docker compose exec app sh -c "cd /app && npx prisma generate"

# 3. Restart application
docker compose restart app
```

### Error: "NEXTAUTH_SECRET not set"

**Symptoms:**
- Application won't start
- Error about missing NEXTAUTH_SECRET

**Solutions:**

```bash
# 1. Generate a secure secret
openssl rand -base64 32

# 2. Add to deployment/.env
echo "NEXTAUTH_SECRET=<generated_secret>" >> deployment/.env

# 3. Restart services
docker compose down
docker compose up -d
```

### Error: "Port 3000 already in use"

**Symptoms:**
- Application container fails to start
- Error: `bind: address already in use`

**Solutions:**

```bash
# 1. Find process using port 3000
netstat -tlnp | grep :3000
# or
lsof -i :3000

# 2. Kill the process (replace PID with actual process ID)
kill -9 <PID>

# 3. Or change the port in docker-compose.yml
# Edit deployment/docker-compose.yml
# Change "3000:3000" to "3001:3000" under app service

# 4. Restart services
docker compose down
docker compose up -d
```

---

## 🔌 WebSocket Connection Errors

### Error: "WebSocket connection failed"

**Symptoms:**
- Real-time features don't work
- Browser console shows WebSocket errors
- Socket.IO connection timeout

**Solutions:**

```bash
# 1. Verify WebSocket URL is correct
docker compose exec app printenv NEXT_PUBLIC_WEBSOCKET_URL
# Should match your domain: https://www.cortexbuildpro.com

# 2. Check if using correct protocol
# Development: ws:// or http://
# Production: wss:// or https://

# 3. Verify Nginx WebSocket configuration
docker compose exec nginx cat /etc/nginx/nginx.conf | grep -A5 "Upgrade"

# 4. Restart Nginx
docker compose restart nginx

# 5. Check firewall allows WebSocket connections
ufw status

# 6. Test WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:3000/api/socketio
```

### Error: "Socket.IO connection timeout"

**Solutions:**

```bash
# 1. Check application logs
docker compose logs app | grep -i socket

# 2. Verify Socket.IO server is running
docker compose logs app | grep -i "Socket.IO"

# 3. Restart application
docker compose restart app

# 4. Check if behind multiple proxies
# May need to adjust Socket.IO configuration in production-server.js
```

---

## 🔒 SSL/HTTPS Errors

### Error: "SSL certificate not found"

**Symptoms:**
- HTTPS doesn't work
- Nginx shows certificate errors

**Solutions:**

```bash
# 1. Check if certificates exist
docker compose exec nginx ls -la /etc/letsencrypt/live/

# 2. Run Certbot to obtain certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@cortexbuildpro.com \
  --agree-tos \
  --no-eff-email \
  -d cortexbuildpro.com \
  -d www.cortexbuildpro.com

# 3. Restart Nginx
docker compose restart nginx

# 4. Verify certificate
curl -vI https://www.cortexbuildpro.com 2>&1 | grep -i certificate
```

### Error: "Too many certificates already issued"

**Symptoms:**
- Certbot fails with rate limit error
- Let's Encrypt rate limit reached

**Solutions:**

```bash
# 1. Use staging environment for testing
docker compose run --rm certbot certonly \
  --staging \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@cortexbuildpro.com \
  --agree-tos \
  --no-eff-email \
  -d cortexbuildpro.com \
  -d www.cortexbuildpro.com

# 2. Wait for rate limit to reset (typically 1 week)

# 3. Use DNS challenge instead (if available)

# 4. Consider using a different CA temporarily
```

---

## ☁️ AWS S3 / File Upload Errors

### Error: "Failed to upload file to S3"

**Symptoms:**
- File uploads fail
- Error: "Access Denied" or "Invalid credentials"

**Solutions:**

```bash
# 1. Verify AWS credentials are set
docker compose exec app printenv | grep AWS

# 2. Check AWS credentials format
# Should have:
# AWS_REGION=us-west-2
# AWS_BUCKET_NAME=your-bucket-name
# AWS_FOLDER_PREFIX=cortexbuild/

# 3. Test AWS connection
docker compose exec app sh -c "cd /app && npx tsx scripts/test-api-connections.ts"

# 4. Verify S3 bucket exists and has correct permissions
# - Bucket should exist in specified region
# - IAM user should have s3:PutObject, s3:GetObject permissions
# - Bucket CORS should allow your domain

# 5. Check S3 bucket CORS configuration
# Should include your domain in AllowedOrigins
```

### S3 CORS Configuration

Add this CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "https://www.cortexbuildpro.com",
            "http://localhost:3000"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

---

## 🔐 Authentication Errors

### Error: "Invalid credentials" during login

**Solutions:**

```bash
# 1. Check if user exists in database
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c \
  "SELECT id, email, name FROM \"User\" LIMIT 5;"

# 2. Reset user password if needed
# Use the application's admin panel or create new account

# 3. Verify NEXTAUTH_URL matches your domain
docker compose exec app printenv NEXTAUTH_URL

# 4. Clear browser cookies and try again
```

### Error: "Session verification failed"

**Solutions:**

```bash
# 1. Verify NEXTAUTH_SECRET is set and consistent
docker compose exec app printenv NEXTAUTH_SECRET

# 2. If you changed NEXTAUTH_SECRET, restart app
docker compose restart app

# 3. Clear browser cookies and sessions

# 4. Check system time is synchronized
date
# Should match actual time
```

---

## 🏗️ Build Errors

### Error: "Build failed" during Docker build

**Symptoms:**
- `docker compose up -d` fails during build
- TypeScript compilation errors

**Solutions:**

```bash
# 1. Check build logs
docker compose build app 2>&1 | tee build.log

# 2. Clear Docker build cache
docker compose build --no-cache app

# 3. Check available disk space
df -h

# 4. Remove old images to free space
docker system prune -a

# 5. Try building locally first
cd /opt/cortexbuild-pro/nextjs_space
npm install --legacy-peer-deps
npm run build
```

### Error: "Out of memory" during build

**Solutions:**

```bash
# 1. Check available memory
free -h

# 2. Add swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. Build with memory limit
docker compose build --memory 2g app

# 4. Consider upgrading VPS if issue persists
```

---

## 📊 Performance Issues

### Issue: Application is slow

**Solutions:**

```bash
# 1. Check resource usage
docker stats

# 2. Check database performance
docker compose exec postgres psql -U cortexbuild -d cortexbuild -c \
  "SELECT count(*) FROM pg_stat_activity;"

# 3. Review application logs for slow queries
docker compose logs app | grep -i "slow"

# 4. Consider upgrading VPS resources

# 5. Enable database connection pooling (already configured)

# 6. Check for network latency
ping YOUR_SERVER_IP
```

### Issue: High memory usage

**Solutions:**

```bash
# 1. Restart services to clear memory
docker compose restart

# 2. Check for memory leaks in logs
docker compose logs app | grep -i "memory\|heap"

# 3. Adjust Node.js memory limits if needed
# Add to docker-compose.yml under app service:
# environment:
#   - NODE_OPTIONS=--max-old-space-size=2048

# 4. Monitor memory over time
watch -n 5 'docker stats --no-stream'
```

---

## 🔍 Debugging Commands

### View detailed logs

```bash
# All services with timestamps
docker compose logs -f --timestamps

# Specific service
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app

# Follow logs in real-time
docker compose logs -f app | grep -i error
```

### Execute commands in containers

```bash
# Shell access to app container
docker compose exec app sh

# Run Prisma commands
docker compose exec app sh -c "cd /app && npx prisma studio"

# Check environment variables
docker compose exec app printenv

# Test database connection
docker compose exec app sh -c "cd /app && npx tsx scripts/health-check.ts"
```

### Network diagnostics

```bash
# Test internal connectivity
docker compose exec app ping postgres

# Test external connectivity
docker compose exec app ping 8.8.8.8

# Check DNS resolution
docker compose exec app nslookup www.cortexbuildpro.com
```

---

## 🆘 Emergency Recovery

### Complete System Reset (WARNING: Deletes all data)

```bash
# 1. Stop all services
docker compose down

# 2. Remove all volumes (DELETES DATABASE DATA)
docker compose down -v

# 3. Remove all containers and images
docker system prune -a

# 4. Start fresh
cd /opt/cortexbuild-pro/deployment
docker compose up -d --build

# 5. Run migrations
docker compose exec app sh -c "cd /app && npx prisma migrate deploy"

# 6. Seed database
docker compose exec app sh -c "cd /app && npx prisma db seed"
```

### Restore from Backup

```bash
# 1. Stop application
docker compose stop app

# 2. Restore database
cd /opt/cortexbuild-pro/deployment
./restore.sh backups/backup-YYYY-MM-DD.sql

# 3. Start application
docker compose start app
```

---

## 📞 Getting Help

If you're still experiencing issues:

1. **Check logs:** `docker compose logs -f`
2. **Run diagnostics:** `docker compose exec app sh -c "cd /app && npx tsx scripts/system-diagnostics.ts"`
3. **Review documentation:** Check all `.md` files in project root
4. **Search issues:** https://github.com/adrianstanca1/cortexbuild-pro/issues
5. **Create issue:** Include logs, error messages, and steps to reproduce

---

## 📚 Related Documentation

- [VPS Deployment Guide](VPS_DEPLOYMENT_GUIDE.md)
- [API Setup Guide](API_SETUP_GUIDE.md)
- [Configuration Checklist](CONFIGURATION_CHECKLIST.md)
- [Deployment Summary](DEPLOYMENT_SUMMARY.md)

---

**Remember:** Always backup your database before making major changes!
