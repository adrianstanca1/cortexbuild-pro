# 502 Bad Gateway Error - Fix and Testing Guide

## Problem Summary
The application was experiencing 502 Bad Gateway errors due to the Node.js server not properly binding to the network interface that nginx could access.

## Root Causes Identified and Fixed

### 1. Missing Hostname Binding in production-server.js
**Issue**: The server was not explicitly binding to `0.0.0.0`, potentially binding to localhost only.

**Fix**: Updated `production-server.js` to:
- Read `HOSTNAME` environment variable (defaults to `0.0.0.0`)
- Use hostname in `httpServer.listen()` call to bind to all network interfaces

### 2. Insufficient Nginx Buffer Sizes
**Issue**: Small proxy buffers (4k) could cause 502 errors when handling large responses.

**Fix**: Increased buffer sizes in `nginx.conf`:
- `proxy_buffer_size`: 4k → 16k
- `proxy_buffers`: 8 4k → 8 16k
- `proxy_busy_buffers_size`: 8k → 32k

### 3. Service Startup Race Condition
**Issue**: Nginx could start before the app container was fully healthy and ready to accept connections.

**Fix**: Updated `docker-compose.yml` to make nginx wait for app health check:
```yaml
depends_on:
  app:
    condition: service_healthy
```

## Testing the Fix

### Prerequisites
1. Ensure you have Docker and Docker Compose installed
2. Copy `.env.example` to `.env` and configure:
   ```bash
   cd deployment
   cp .env.example .env
   nano .env  # Fill in required values
   ```

### Required Environment Variables
At minimum, you need:
- `POSTGRES_PASSWORD`: Secure database password
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your domain (e.g., https://your-domain.com)
- `NEXT_PUBLIC_WEBSOCKET_URL`: Same as NEXTAUTH_URL

### Step-by-Step Deployment Test

1. **Build and Start Services**
   ```bash
   cd deployment
   docker-compose up --build -d
   ```

2. **Monitor Logs**
   ```bash
   # Watch all logs
   docker-compose logs -f

   # Watch only app logs
   docker-compose logs -f app

   # Watch only nginx logs
   docker-compose logs -f nginx
   ```

3. **Verify Services are Running**
   ```bash
   docker-compose ps
   ```
   
   All services should show "healthy" or "Up" status.

4. **Check App Container Health**
   ```bash
   # Check if app is listening on correct interface
   docker exec cortexbuild-app sh -c "wget -qO- http://localhost:3000/api/auth/providers"
   ```
   
   Should return JSON with authentication providers.

5. **Check Nginx Can Reach App**
   ```bash
   # From nginx container, verify upstream is reachable
   docker exec cortexbuild-nginx sh -c "wget -qO- http://app:3000/api/auth/providers"
   ```
   
   Should return the same JSON response.

6. **Test External Access**
   ```bash
   # If testing locally without SSL
   curl http://localhost/api/auth/providers
   
   # If testing with domain and SSL
   curl https://your-domain.com/api/auth/providers
   ```

### Expected Startup Logs

**App Container (cortexbuild-app):**
```
Starting Production Entrypoint Automation...
Server will listen on 0.0.0.0:3000
Environment: NODE_ENV=production
Synchronizing database schema (Prisma)...
Synchronizing static assets to shared volume...
Static assets synced.
Launching Integrated Production Server...
> Production environment live on http://0.0.0.0:3000
> Server ready to accept connections from nginx reverse proxy
[REALTIME] Secure Socket.IO initialized directly
```

**Nginx Container:**
- Should start AFTER app is healthy
- No error messages about upstream being unavailable

### Troubleshooting

#### Still Getting 502 Errors?

1. **Check App Container Logs**
   ```bash
   docker-compose logs app | tail -50
   ```
   Look for:
   - Database connection errors
   - Missing environment variables
   - Application startup errors

2. **Check Nginx Logs**
   ```bash
   docker-compose logs nginx | tail -50
   ```
   Look for:
   - "connect() failed" messages
   - "upstream timed out" messages
   - SSL certificate errors

3. **Verify Network Connectivity**
   ```bash
   # List networks and locate the cortexbuild network
   docker network ls | grep cortexbuild-network
   
   # Inspect the network (the prefix depends on the docker-compose project name, e.g. "deployment_cortexbuild-network")
   docker network inspect deployment_cortexbuild-network
   
   # Verify app container can be reached
   docker exec cortexbuild-nginx ping -c 3 app
   ```

4. **Check Container Health**
   ```bash
   # Check app health status
   docker inspect cortexbuild-app | grep -A 10 Health
   ```

5. **Verify Environment Variables**
   ```bash
   # Check if HOSTNAME is set correctly
   docker exec cortexbuild-app env | grep -E "HOSTNAME|PORT|NODE_ENV"
   ```

#### Database Connection Issues

```bash
# Test database connectivity from app container
docker exec cortexbuild-app sh -c "npx prisma db pull"
```

#### SSL Certificate Issues

If using Let's Encrypt and getting SSL errors:
```bash
# Run setup-ssl.sh script
cd deployment
./setup-ssl.sh your-domain.com admin@your-domain.com
```

### Clean Restart

If you need to start fresh:

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes database data!)
docker-compose down -v

# Rebuild and start
docker-compose up --build -d
```

### Production Deployment Checklist

Before deploying to production:

- [ ] All environment variables are properly configured in `.env`
- [ ] `NEXTAUTH_SECRET` is a strong, randomly generated value
- [ ] `NEXTAUTH_URL` matches your production domain
- [ ] SSL certificates are configured (Let's Encrypt)
- [ ] Database has proper backups configured
- [ ] Firewall rules allow ports 80 and 443
- [ ] Domain DNS points to server IP address
- [ ] AWS S3 credentials are configured (if using file uploads)
- [ ] Email service is configured (SendGrid or AbacusAI)

## What Changed?

### Files Modified:

1. **nextjs_space/production-server.js**
   - Added `hostname` constant from environment
   - Modified `httpServer.listen()` to bind to hostname
   - Enhanced logging messages

2. **nextjs_space/entrypoint.sh**
   - Added logging to show hostname and port on startup

3. **deployment/nginx.conf**
   - Increased proxy buffer sizes for better reliability

4. **deployment/docker-compose.yml**
   - Changed nginx depends_on to wait for app health check

## Additional Resources

- **Build Status**: See `BUILD_STATUS.md` for build configuration
- **API Setup**: See `API_SETUP_GUIDE.md` for API documentation
- **Performance**: See `PERFORMANCE_OPTIMIZATIONS.md` for optimization tips

## Support

If you continue to experience issues:

1. Check the logs as described above
2. Verify all environment variables are set
3. Ensure the database is accessible
4. Check that no firewall is blocking container communication
5. Review the nginx error logs for specific error messages

The key fix is ensuring the Node.js server binds to `0.0.0.0` so nginx can proxy requests to it across the Docker network.
