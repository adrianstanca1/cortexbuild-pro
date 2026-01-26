# VPS Connection Configuration Guide

This document provides comprehensive guidance for configuring connections in CortexBuild Pro on a VPS environment.

## Table of Contents
1. [Database Connections](#database-connections)
2. [WebSocket Connections](#websocket-connections)
3. [Nginx Reverse Proxy](#nginx-reverse-proxy)
4. [Network Configuration](#network-configuration)
5. [Connection Monitoring](#connection-monitoring)
6. [Troubleshooting](#troubleshooting)

---

## Database Connections

### PostgreSQL Configuration

#### Connection Pooling
The application uses Prisma with built-in connection pooling. Configuration is in the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&connection_limit=10&pool_timeout=20"
```

**Connection Pool Parameters:**
- `connection_limit`: Maximum number of connections (default: 10)
- `pool_timeout`: Connection timeout in seconds (default: 20)

#### Recommended Settings by VPS Size

**Small VPS (2GB RAM, 2 CPUs):**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

**Medium VPS (4GB RAM, 4 CPUs):**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30"
```

**Large VPS (8GB+ RAM, 8+ CPUs):**
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=50&pool_timeout=30"
```

#### PostgreSQL Server Configuration

For optimal performance, configure PostgreSQL in `/var/lib/docker/volumes/deployment_postgres_data/_data/postgresql.conf` or through Docker environment variables:

```yaml
# In docker-compose.yml, add to postgres service:
command:
  - "postgres"
  - "-c"
  - "max_connections=100"
  - "-c"
  - "shared_buffers=256MB"
  - "-c"
  - "effective_cache_size=1GB"
  - "-c"
  - "maintenance_work_mem=64MB"
  - "-c"
  - "checkpoint_completion_target=0.9"
  - "-c"
  - "wal_buffers=16MB"
  - "-c"
  - "default_statistics_target=100"
```

---

## WebSocket Connections

### Socket.IO Configuration

#### Server Configuration
Location: `nextjs_space/production-server.js`

```javascript
const io = new Server(httpServer, {
  path: '/api/socketio',
  addTrailingSlash: false,
  cors: {
    origin: process.env.NEXTAUTH_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,      // 60 seconds
  pingInterval: 25000,     // 25 seconds
  maxHttpBufferSize: 1e6,  // 1 MB
  allowUpgrades: true
});
```

**Key Parameters:**
- `path`: Socket.IO endpoint path
- `pingTimeout`: Time to wait for pong before closing connection
- `pingInterval`: How often to send ping packets
- `transports`: Connection methods (WebSocket preferred, polling fallback)

#### Client Configuration
Location: `nextjs_space/lib/websocket-client.ts`

```typescript
const socket = io(socketUrl, {
  path: '/api/socketio',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 5000,
  timeout: 20000
});
```

#### Environment Variables

```env
# In deployment/.env
NEXT_PUBLIC_WEBSOCKET_URL=https://www.cortexbuildpro.com
WEBSOCKET_PORT=3000
```

### Connection Lifecycle

1. **Client Connection**
   ```typescript
   websocketClient.connect(token, userId)
   ```

2. **Authentication**
   ```typescript
   socket.emit('authenticate', { token, userId })
   ```

3. **Join Project Room**
   ```typescript
   socket.emit('join-project', { projectId })
   ```

4. **Receive Updates**
   ```typescript
   socket.on('task-updated', (data) => {
     // Handle update
   })
   ```

5. **Disconnect**
   ```typescript
   socket.disconnect()
   ```

### WebSocket Security

All WebSocket connections are:
1. **Authenticated**: JWT token validation via NextAuth
2. **Authorized**: Project membership verification
3. **Encrypted**: HTTPS/WSS in production
4. **Rate-limited**: Through Nginx configuration

---

## Nginx Reverse Proxy

### WebSocket Support

The Nginx configuration includes special handling for WebSocket connections:

```nginx
# Map for WebSocket upgrade
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# WebSocket-specific location
location /api/socketio/ {
    proxy_pass http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    
    # Long timeouts for persistent connections
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
    
    # Disable buffering
    proxy_buffering off;
    proxy_cache off;
}
```

### SSL/TLS Configuration

WebSocket connections are upgraded to WSS (WebSocket Secure) through SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name cortexbuildpro.com www.cortexbuildpro.com;
    
    ssl_certificate /etc/letsencrypt/live/cortexbuildpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cortexbuildpro.com/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
}
```

---

## Network Configuration

### Firewall Rules (UFW)

```bash
# Allow SSH (port 22)
sudo ufw allow 22/tcp

# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443)
sudo ufw allow 443/tcp

# Allow application port for development (optional)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

### Port Configuration

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| PostgreSQL | 5432 | N/A (internal only) | TCP |
| Application | 3000 | N/A (via Nginx) | TCP |
| Nginx HTTP | 80 | 80 | TCP |
| Nginx HTTPS | 443 | 443 | TCP/WSS |

### Docker Network

Services communicate through the `cortexbuild-network` bridge network:

```yaml
networks:
  cortexbuild-network:
    driver: bridge
```

**Service DNS Resolution:**
- `postgres:5432` - Database
- `app:3000` - Application
- `nginx:80/443` - Reverse proxy

---

## Connection Monitoring

### Health Check Endpoints

#### Application Health
```bash
curl https://www.cortexbuildpro.com/api/auth/providers
```

Expected response: JSON with authentication providers

#### WebSocket Health
```bash
# Test WebSocket connection
wscat -c wss://www.cortexbuildpro.com/api/socketio/
```

#### Database Health
```bash
docker compose exec postgres pg_isready -U cortexbuild
```

Expected output: `postgres:5432 - accepting connections`

### Docker Health Checks

Health checks are defined in `docker-compose.yml`:

```yaml
# Application health check
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/auth/providers"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s

# Database health check
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U cortexbuild"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Monitoring Commands

```bash
# View all container health status
docker compose ps

# Check container logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx

# Monitor real-time resource usage
docker stats

# Check WebSocket connections
docker compose exec app sh -c "netstat -an | grep :3000 | grep ESTABLISHED | wc -l"
```

---

## Connection Limits

### System Limits

Configure in `/etc/security/limits.conf`:

```conf
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
```

### Kernel Parameters

Configure in `/etc/sysctl.conf`:

```conf
# Network optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10000 65000
net.ipv4.tcp_fin_timeout = 15
```

Apply changes:
```bash
sudo sysctl -p
```

---

## Troubleshooting

### Database Connection Issues

**Problem**: Application cannot connect to database

**Solutions:**
1. Check database is running:
   ```bash
   docker compose ps postgres
   ```

2. Verify DATABASE_URL is correct:
   ```bash
   docker compose exec app printenv DATABASE_URL
   ```

3. Test connection:
   ```bash
   docker compose exec app npx prisma db pull
   ```

4. Check PostgreSQL logs:
   ```bash
   docker compose logs postgres
   ```

### WebSocket Connection Issues

**Problem**: WebSocket connections failing or dropping

**Solutions:**
1. Verify WebSocket URL:
   ```bash
   echo $NEXT_PUBLIC_WEBSOCKET_URL
   ```

2. Check Nginx configuration:
   ```bash
   docker compose exec nginx nginx -t
   ```

3. Test WebSocket endpoint:
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
     https://www.cortexbuildpro.com/api/socketio/
   ```

4. Check application logs for WebSocket events:
   ```bash
   docker compose logs app | grep -i "socket\|realtime"
   ```

5. Verify firewall allows WebSocket traffic:
   ```bash
   sudo ufw status
   ```

### SSL/TLS Issues

**Problem**: WSS connections fail with SSL errors

**Solutions:**
1. Check SSL certificate:
   ```bash
   openssl s_client -connect www.cortexbuildpro.com:443 -servername www.cortexbuildpro.com
   ```

2. Verify certificate files exist:
   ```bash
   ls -la /etc/letsencrypt/live/cortexbuildpro.com/
   ```

3. Renew certificate if expired:
   ```bash
   docker compose run --rm certbot renew
   docker compose restart nginx
   ```

### Connection Pool Exhaustion

**Problem**: Database connection pool exhausted

**Solutions:**
1. Increase connection limit in DATABASE_URL
2. Check for connection leaks in application
3. Monitor active connections:
   ```bash
   docker compose exec postgres psql -U cortexbuild -c "SELECT count(*) FROM pg_stat_activity;"
   ```

4. Restart application to reset pool:
   ```bash
   docker compose restart app
   ```

### High Connection Count

**Problem**: Too many WebSocket connections causing performance issues

**Solutions:**
1. Monitor active WebSocket connections:
   ```bash
   docker compose exec app sh -c "netstat -an | grep :3000 | grep ESTABLISHED"
   ```

2. Review pingTimeout and pingInterval settings
3. Implement connection throttling in application
4. Scale horizontally with load balancer

---

## Performance Optimization

### Database Query Optimization

1. Use connection pooling (configured in DATABASE_URL)
2. Index frequently queried fields
3. Use Prisma query optimization:
   ```typescript
   // Include only needed fields
   const users = await prisma.user.findMany({
     select: { id: true, name: true }
   });
   ```

### WebSocket Optimization

1. Use rooms for targeted broadcasting:
   ```typescript
   io.to(`project-${projectId}`).emit('update', data);
   ```

2. Implement message throttling for frequent updates
3. Use binary data for large payloads
4. Compress messages when possible

### Nginx Optimization

1. Enable gzip compression
2. Configure static file caching
3. Use HTTP/2 for better performance
4. Adjust worker_connections based on traffic

---

## Security Best Practices

1. **Always use HTTPS/WSS in production**
2. **Validate JWT tokens for WebSocket authentication**
3. **Use strong passwords for database**
4. **Keep secrets in environment variables, not code**
5. **Enable fail2ban for SSH protection**
6. **Regularly update SSL certificates**
7. **Monitor connection logs for suspicious activity**
8. **Implement rate limiting on API and WebSocket endpoints**

---

## Quick Reference

### Essential Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart application
docker compose restart app

# View logs
docker compose logs -f

# Check connection status
docker compose ps

# Test database connection
docker compose exec postgres psql -U cortexbuild -c "SELECT 1;"

# Monitor WebSocket connections
docker compose exec app sh -c "netstat -an | grep :3000"

# Check SSL certificate expiry
echo | openssl s_client -servername www.cortexbuildpro.com -connect www.cortexbuildpro.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Additional Resources

- **Main Documentation**: `/README.md`
- **Deployment Guide**: `/PRODUCTION_DEPLOYMENT.md`
- **API Setup**: `/API_SETUP_GUIDE.md`
- **Backend/Frontend Connectivity**: `/BACKEND_FRONTEND_CONNECTIVITY.md`
- **Security Guide**: `/SECURITY_COMPLIANCE.md`

---

**Last Updated**: January 26, 2026
**Version**: 1.0.0
