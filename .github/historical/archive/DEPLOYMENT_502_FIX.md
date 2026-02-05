# 502 Error Fix - Deployment Configuration Updates

**Date:** January 27, 2026  
**Status:** ✅ Complete

## Overview

This document describes the changes made to fix 502 Bad Gateway errors in the production deployment.

## Root Cause

The nginx reverse proxy was configured without explicit timeout settings for general application routes. When the Next.js application took longer than the default timeout to respond (typically 60 seconds), nginx would return a 502 Bad Gateway error.

Additionally, the application healthcheck and startup configuration could be improved to handle longer startup times more gracefully.

## Changes Made

### 1. Nginx Configuration (`deployment/nginx.conf`)

#### Added Proxy Timeouts for General Routes
```nginx
# Timeout settings to prevent 502 errors
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

**Why:** These settings ensure that nginx waits up to 60 seconds for:
- `proxy_connect_timeout`: Establishing a connection to the backend
- `proxy_send_timeout`: Sending a request to the backend
- `proxy_read_timeout`: Reading a response from the backend

#### Added Proxy Buffer Settings
```nginx
# Buffer settings to prevent 502 errors
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

**Why:** These settings prevent buffer overflow issues that can cause 502 errors when the application sends large responses.

### 2. Docker Compose Configuration (`deployment/docker-compose.yml`)

#### Improved Application Healthcheck
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/auth/providers"]
  interval: 30s
  timeout: 15s        # Increased from 10s
  retries: 5          # Increased from 3
  start_period: 90s   # Increased from 60s
```

**Why:**
- `timeout: 15s` - Allows more time for the healthcheck endpoint to respond
- `retries: 5` - More attempts before marking the container as unhealthy
- `start_period: 90s` - Longer grace period for initial startup and migrations

### 3. Production Server (`nextjs_space/production-server.js`)

#### Added Error Handling for App Preparation
```javascript
app.prepare().then(() => {
    // ... server setup
}).catch((err) => {
    console.error('[FATAL] Failed to prepare Next.js application:', err);
    process.exit(1);
});
```

**Why:** Provides explicit error logging if the Next.js application fails to initialize, making debugging easier.

## Impact

### Before
- 502 errors when application took longer to respond
- Silent failures on startup
- Insufficient time for healthchecks during deployment

### After
- ✅ Proper timeout handling (60 seconds)
- ✅ Better error visibility
- ✅ More robust healthcheck configuration
- ✅ Graceful handling of startup delays

## Testing Recommendations

### Local Testing
```bash
cd deployment
docker-compose up --build
```

Wait for services to start (90 seconds), then test:
```bash
# Check service health
docker-compose ps

# Test application
curl -I https://yourdomain.com

# Check logs for errors
docker-compose logs app | grep -i error
```

### Production Deployment
```bash
cd deployment

# Pull latest changes
git pull

# Rebuild and restart services
docker-compose down
docker-compose up -d --build

# Monitor logs
docker-compose logs -f app nginx
```

## Troubleshooting

### If 502 Errors Persist

1. **Check application logs:**
   ```bash
   docker-compose logs app
   ```

2. **Verify application is running:**
   ```bash
   docker-compose exec app wget -O- http://localhost:3000/api/auth/providers
   ```

3. **Check nginx logs:**
   ```bash
   docker-compose logs nginx
   ```

4. **Verify database connection:**
   ```bash
   docker-compose exec app printenv DATABASE_URL
   docker-compose exec postgres psql -U cortexbuild -d cortexbuild -c "SELECT 1;"
   ```

5. **Increase timeouts if needed:**
   Edit `deployment/nginx.conf` and increase timeout values:
   ```nginx
   proxy_connect_timeout 120s;
   proxy_send_timeout 120s;
   proxy_read_timeout 120s;
   ```

## Related Documentation

- **Nginx Configuration:** `deployment/nginx.conf`
- **Docker Compose:** `deployment/docker-compose.yml`
- **Troubleshooting Guide:** `TROUBLESHOOTING.md`
- **Production Deployment:** `PRODUCTION_DEPLOYMENT.md`
- **VPS Setup:** `VPS_DEPLOYMENT_GUIDE.md`

## Future Improvements

- [ ] Add request caching to reduce backend load
- [ ] Implement rate limiting to prevent overload
- [ ] Add monitoring and alerting for 502 errors
- [ ] Consider using a CDN for static assets
- [ ] Implement graceful shutdown handling

## Notes

- WebSocket routes already had proper timeout configuration (7 days) and were not affected
- SSL/HTTPS configuration remains unchanged
- Database connection pooling remains at 10 connections with 20s timeout
