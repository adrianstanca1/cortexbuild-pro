# CortexBuild Pro - Docker Manager & Windmill Deployment Guide

Complete guide to deploy CortexBuild Pro using Docker Manager (Portainer) and Windmill workflow automation on your VPS.

## 🚀 Quick Start - One Command Deployment

The fastest way to deploy CortexBuild Pro to your VPS:

```bash
# Clone the repository on your VPS
git clone https://github.com/yourusername/cortexbuild-pro.git /root/cortexbuild_pro
cd /root/cortexbuild_pro/deployment

# Run the deployment script (installs Docker, Portainer, Windmill, and deploys the app)
sudo ./quick-start.sh
```

### With Custom Domain and SSL:

```bash
sudo ./quick-start.sh --domain app.yourdomain.com --email admin@yourdomain.com --ssl
```

### Options:

| Option | Description |
|--------|-------------|
| `--domain DOMAIN` | Set public domain for the application |
| `--email EMAIL` | Email for SSL certificate notifications |
| `--ssl` | Enable SSL/HTTPS with Let's Encrypt |
| `--no-portainer` | Skip Portainer installation |
| `--no-windmill` | Skip Windmill installation |
| `--seed-db` | Seed database with sample data |
| `--skip-clean` | Skip clean dependency rebuild |
| `-y, --yes` | Skip all confirmation prompts |

---

## 📋 Overview

This guide covers:
- **Docker Manager (Portainer)**: Visual Docker management and deployment
- **Windmill**: Automated workflow for build and deployment
- **Traditional Docker**: Compose and Swarm deployment methods

---

## 🎯 Deployment Options

### Option 1: Docker Manager (Portainer) - Recommended for Visual Management

**Pros:**
- ✅ Visual web interface for container management
- ✅ Easy stack management and updates
- ✅ Built-in monitoring and logs viewer
- ✅ Environment variable management
- ✅ Multi-server support

### Option 2: Windmill - Recommended for Automation

**Pros:**
- ✅ Fully automated deployment workflow
- ✅ Scheduled deployments
- ✅ Webhook triggers for CI/CD
- ✅ Built-in error handling and notifications

### Option 3: Docker Compose - Traditional Method

**Pros:**
- ✅ Simple and straightforward
- ✅ No additional tools required
- ✅ Good for single-server deployments

---

## 🚀 Quick Start - Docker Manager (Portainer)

### Prerequisites

1. **VPS Requirements:**
   - Ubuntu 20.04+ / Debian 11+
   - 2GB+ RAM (4GB recommended)
   - Docker installed
   - Ports 80, 443, 9000 (Portainer) open

2. **Install Docker Manager (Portainer):**
   ```bash
   # Create volume for Portainer data
   docker volume create portainer_data

   # Run Portainer
   docker run -d \
     -p 9000:9000 \
     -p 9443:9443 \
     --name portainer \
     --restart=always \
     -v /var/run/docker.sock:/var/run/docker.sock \
     -v portainer_data:/data \
     portainer/portainer-ce:latest
   ```

3. **Access Portainer:**
   - Navigate to: `http://YOUR_SERVER_IP:9000`
   - Create admin account on first visit

### Deployment Steps

#### Method A: Using Pre-built Image (Fast)

1. **Build Image on VPS:**
   ```bash
   cd /root/cortexbuild_pro/deployment
   ./docker-manager-deploy.sh
   ```
   This will:
   - Check Docker installation
   - Build the Docker image
   - Prepare for Portainer deployment

2. **Create Stack in Portainer:**
   - Log into Portainer UI
   - Go to **Stacks** → **Add stack**
   - Name: `cortexbuild-pro`
   - Build method: **Web editor**
   - Copy contents of `docker-compose.yml` 
   - Click **Environment variables** tab
   - Add variables from `portainer-stack-env.txt`:
     ```
     POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
     NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
     NEXTAUTH_URL=https://yourdomain.com
     ```
   - Click **Deploy the stack**

3. **Run Database Setup:**
   ```bash
   # Get app container ID
   docker ps --filter "name=cortexbuild-app"
   
   # Run migrations
   docker exec cortexbuild-app npx prisma migrate deploy
   
   # Seed database (first time only)
   docker exec cortexbuild-app npx prisma db seed
   ```

#### Method B: Using Docker Stack File

For Docker Swarm deployment:

1. **Initialize Swarm:**
   ```bash
   docker swarm init
   ```

2. **Deploy Stack via Portainer:**
   - Go to **Stacks** → **Add stack**
   - Name: `cortexbuild-pro`
   - Build method: **Repository** or **Upload**
   - Select `docker-stack.yml`
   - Add environment variables
   - Click **Deploy the stack**

3. **Or deploy via CLI:**
   ```bash
   cd /root/cortexbuild_pro/deployment
   docker stack deploy -c docker-stack.yml cortexbuild
   ```

### Managing via Portainer

**View Containers:**
- Dashboard → Click on your environment → Containers

**View Logs:**
- Containers → Click container name → Logs

**Restart Service:**
- Containers → Select container → Restart

**Update Stack:**
- Stacks → cortexbuild-pro → Editor → Update stack

---

## 🔄 Windmill Workflow Setup

### Install Windmill

1. **Install Windmill on your VPS:**
   ```bash
   # Using Docker Compose
   curl https://raw.githubusercontent.com/windmill-labs/windmill/main/docker-compose.yml -o windmill-compose.yml
   docker compose -f windmill-compose.yml up -d
   ```

2. **Access Windmill:**
   - Navigate to: `http://YOUR_SERVER_IP:8000`
   - Create admin account

### Import Deployment Workflow

1. **In Windmill UI:**
   - Go to **Flows** → **Create Flow**
   - Name: `CortexBuild Pro Deployment`
   
2. **Import Workflow:**
   - Copy contents from `windmill-deploy-flow.yaml`
   - Paste into Windmill flow editor
   - Adjust paths if necessary

3. **Configure Triggers:**
   - **Manual**: Run on-demand via UI
   - **Scheduled**: Set cron schedule (e.g., daily at 2 AM)
   - **Webhook**: Enable for CI/CD integration

### Workflow Steps

The automated workflow performs:

1. ✅ Pull latest code from git
2. ✅ Build Docker image
3. ✅ Deploy/update containers
4. ✅ Health check verification
5. ✅ Run database migrations
6. ✅ Send notifications (success/failure)

### Running the Workflow

**Via Windmill UI:**
- Go to Flows → CortexBuild Pro Deployment → Run

**Via Webhook:**
```bash
curl -X POST https://windmill.yourdomain.com/api/w/YOUR_WORKSPACE/jobs/run/p/YOUR_PATH \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**From CI/CD (GitHub Actions example):**
```yaml
- name: Trigger Windmill Deploy
  run: |
    curl -X POST ${{ secrets.WINDMILL_WEBHOOK_URL }} \
      -H "Authorization: Bearer ${{ secrets.WINDMILL_TOKEN }}"
```

---

## 🔧 Configuration Files

### docker-stack.yml
Docker Swarm/Stack configuration optimized for production:
- Health checks
- Rolling updates
- Automatic restart policies
- Resource limits

### docker-compose.yml
Standard Docker Compose configuration for development and simple deployments.

### portainer-stack-env.txt
Environment variables template for Portainer Stack deployment.

### windmill-deploy-flow.yaml
Complete Windmill workflow for automated deployment.

---

## 📊 Monitoring & Management

### Health Checks

**Via Portainer:**
- Containers view shows health status
- Green = Healthy, Yellow = Starting, Red = Unhealthy

**Via CLI:**
```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test application endpoint
curl -I http://localhost:3000/api/auth/providers
```

### Logs

**Via Portainer:**
- Containers → Select container → Logs
- Real-time log streaming with filters

**Via CLI:**
```bash
# Follow all logs
docker compose logs -f

# Follow specific service
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app
```

### Resource Usage

**Via Portainer:**
- Dashboard shows CPU/Memory usage graphs

**Via CLI:**
```bash
# Real-time stats
docker stats

# Container resource usage
docker stats cortexbuild-app cortexbuild-db
```

---

## 🔄 Updating the Application

### Via Portainer

1. Go to **Stacks** → cortexbuild-pro
2. Click **Editor**
3. Make changes or pull latest image
4. Click **Update the stack**
5. Enable **Re-pull image** and **Prune services**

### Via Windmill

1. Trigger the deployment workflow
2. Workflow automatically:
   - Pulls latest code
   - Rebuilds image
   - Updates containers
   - Runs migrations

### Manual Update

```bash
cd /root/cortexbuild_pro

# Pull latest code
git pull origin main

# Rebuild and deploy
cd deployment
docker compose build --no-cache app
docker compose up -d app

# Run migrations
docker compose exec app npx prisma migrate deploy
```

---

## 🔐 Security Best Practices

### Environment Variables

**Never commit secrets!**
- Use `.env` files (git-ignored)
- Use Portainer's environment variables feature
- Use Docker secrets for sensitive data

**Generate secure secrets:**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# POSTGRES_PASSWORD
openssl rand -base64 24

# ENCRYPTION_KEY
openssl rand -hex 32
```

### Firewall Configuration

```bash
# UFW setup
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 9000/tcp  # Portainer (restrict to VPN/whitelist in production)
sudo ufw enable
```

### Access Control

**Portainer:**
- Create read-only users for monitoring
- Use RBAC for team access
- Enable 2FA if available

**Windmill:**
- Use workspace permissions
- Create service accounts for automation
- Enable audit logs

---

## 🛠️ Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs cortexbuild-app

# Check events
docker events --since 1h

# Inspect container
docker inspect cortexbuild-app
```

### Database Connection Issues

```bash
# Test database connectivity
docker exec cortexbuild-app sh -c "npx prisma db pull"

# Check database logs
docker logs cortexbuild-db

# Verify connection string
docker exec cortexbuild-app env | grep DATABASE_URL
```

### Portainer Issues

```bash
# Restart Portainer
docker restart portainer

# Check Portainer logs
docker logs portainer

# Reset Portainer password
docker stop portainer
docker run --rm -v portainer_data:/data portainer/helper-reset-password
docker start portainer
```

### Windmill Issues

```bash
# Check Windmill logs
docker compose -f windmill-compose.yml logs -f

# Restart Windmill
docker compose -f windmill-compose.yml restart

# Access Windmill database
docker compose -f windmill-compose.yml exec postgres psql -U postgres
```

---

## 📁 File Structure

```
deployment/
├── docker-compose.yml              # Standard Docker Compose
├── docker-stack.yml                # Docker Swarm/Stack file
├── Dockerfile                      # Application build instructions
├── portainer-stack-env.txt         # Environment variables template
├── windmill-deploy-flow.yaml       # Windmill automation workflow
├── docker-manager-deploy.sh        # Helper deployment script
├── .env.example                    # Environment template
└── README-DOCKER-MANAGER.md        # This file
```

---

## 🎓 Advanced Topics

### Multi-Server Deployment

**Using Portainer:**
1. Add multiple Docker endpoints
2. Deploy same stack to multiple servers
3. Use edge agents for remote servers

**Using Docker Swarm:**
```bash
# Manager node
docker swarm init

# Worker nodes
docker swarm join --token TOKEN MANAGER_IP:2377

# Deploy across cluster
docker stack deploy -c docker-stack.yml cortexbuild
```

### Blue-Green Deployment

```yaml
# docker-stack.yml modification
services:
  app-blue:
    # ... blue version
  app-green:
    # ... green version
  
  nginx:
    # Load balancer switches between blue/green
```

### Backup Strategy

**Automated backups with Windmill:**
1. Create backup workflow
2. Schedule daily/weekly
3. Upload to S3/backup server

**Manual backup:**
```bash
# Database backup
docker exec cortexbuild-db pg_dump -U cortexbuild cortexbuild > backup.sql

# Volume backup
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## 📞 Support & Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Portainer Documentation](https://docs.portainer.io/)
- [Windmill Documentation](https://docs.windmill.dev/)

### Quick Commands Reference

```bash
# Portainer
docker logs portainer
docker restart portainer

# View stacks
docker stack ls

# View services
docker service ls

# Scale service
docker service scale cortexbuild_app=3

# Update service
docker service update --image cortexbuild-app:latest cortexbuild_app
```

---

## ✅ Deployment Checklist

- [ ] Docker installed on VPS
- [ ] Portainer/Docker Manager installed and accessible
- [ ] (Optional) Windmill installed for automation
- [ ] Project uploaded to VPS
- [ ] `.env` file configured with secrets
- [ ] Docker image built successfully
- [ ] Stack deployed via Portainer
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] Application accessible
- [ ] SSL certificate configured
- [ ] Backups scheduled
- [ ] Monitoring configured
- [ ] Firewall rules set

---

**Last Updated:** 2026-02-03
**Version:** 1.0.0
