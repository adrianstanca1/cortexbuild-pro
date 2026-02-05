# 🚀 CortexBuild Pro - Deployment Methods Comparison

## Quick Decision Guide

**Choose Docker Manager (Portainer) if you:**
- ✅ Prefer visual web interface
- ✅ Manage multiple containers/services
- ✅ Need team access with different permissions
- ✅ Want built-in monitoring and logs viewer
- ✅ Deploy to multiple servers

**Choose Windmill if you:**
- ✅ Want fully automated deployments
- ✅ Need scheduled deployment workflows
- ✅ Integrate with CI/CD pipelines
- ✅ Require deployment notifications
- ✅ Run complex multi-step workflows

**Choose Docker Compose if you:**
- ✅ Prefer command-line tools
- ✅ Have simple single-server deployment
- ✅ Want quick and lightweight setup
- ✅ Are familiar with Docker commands

---

## Feature Comparison

| Feature | Docker Manager | Windmill | Docker Compose |
|---------|---------------|----------|----------------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ Visual | ⭐⭐⭐⭐ Workflow UI | ⭐⭐⭐ CLI |
| **Setup Time** | 5 minutes | 10 minutes | 2 minutes |
| **Management** | Web UI | Web UI + CLI | CLI only |
| **Monitoring** | Built-in | Built-in | Manual |
| **Automation** | Limited | Full | Scripts |
| **Multi-Server** | Yes | Yes | No |
| **Team Access** | Yes (RBAC) | Yes (RBAC) | No |
| **Updates** | Click button | Click button | Run command |
| **Rollback** | One click | Automatic | Manual |
| **Health Checks** | Visual | Automated | Docker only |
| **Logs** | Visual viewer | Visual viewer | CLI only |
| **Notifications** | Via webhooks | Built-in | None |
| **CI/CD Integration** | API/Webhook | Webhook | Scripts |
| **Cost** | Free | Free | Free |
| **Resource Usage** | ~150MB RAM | ~500MB RAM | Minimal |

---

## Architecture Overview

### Docker Manager (Portainer) Setup
```
┌──────────────────────────────────────────────┐
│           VPS Server (72.62.132.43)          │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │      Portainer (Port 9000)         │     │
│  │       Web Management UI            │     │
│  └─────────────┬──────────────────────┘     │
│                │                             │
│                ▼                             │
│  ┌─────────────────────────────────────┐    │
│  │    Docker Engine & Containers       │    │
│  │  ┌───────────────────────────────┐  │    │
│  │  │   CortexBuild App (Port 3000) │  │    │
│  │  └───────────────┬───────────────┘  │    │
│  │                  │                   │    │
│  │  ┌───────────────▼───────────────┐  │    │
│  │  │   PostgreSQL Database         │  │    │
│  │  └───────────────────────────────┘  │    │
│  └─────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### Windmill Automation Setup
```
┌──────────────────────────────────────────────┐
│           VPS Server (72.62.132.43)          │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │      Windmill (Port 8000)          │     │
│  │    Workflow Automation Engine      │     │
│  └─────────────┬──────────────────────┘     │
│                │ Triggers & Executes         │
│                ▼                             │
│  ┌─────────────────────────────────────┐    │
│  │    Deployment Workflow              │    │
│  │  1. Pull Code                       │    │
│  │  2. Build Image                     │    │
│  │  3. Deploy Container                │    │
│  │  4. Health Check                    │    │
│  │  5. Run Migrations                  │    │
│  │  6. Send Notifications              │    │
│  └─────────────┬───────────────────────┘    │
│                │                             │
│                ▼                             │
│  ┌─────────────────────────────────────┐    │
│  │   CortexBuild App + Database        │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │   Webhook Endpoint                 │     │
│  │   (For CI/CD Integration)          │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

### Combined Setup (Recommended)
```
┌──────────────────────────────────────────────────────────┐
│              VPS Server (72.62.132.43)                   │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │   Portainer      │      │    Windmill      │         │
│  │   (Port 9000)    │      │   (Port 8000)    │         │
│  │   Management     │      │   Automation     │         │
│  └────────┬─────────┘      └────────┬─────────┘         │
│           │                         │                    │
│           │    ┌───────────────────┐│                    │
│           │    │  Docker Engine    ││                    │
│           └────►                   ◄┘                    │
│                │  ┌─────────────┐  │                     │
│                │  │ CortexBuild │  │                     │
│                │  │     App     │  │                     │
│                │  └──────┬──────┘  │                     │
│                │         │         │                     │
│                │  ┌──────▼──────┐  │                     │
│                │  │ PostgreSQL  │  │                     │
│                │  └─────────────┘  │                     │
│                └───────────────────┘                     │
│                                                          │
│  Benefits:                                               │
│  ✓ Visual monitoring via Portainer                      │
│  ✓ Automated deployments via Windmill                   │
│  ✓ Manual control when needed                           │
│  ✓ Best of both worlds                                  │
└──────────────────────────────────────────────────────────┘
```

---

## Deployment Workflow

### Using Docker Manager (Portainer)

1. **Initial Setup** (One-time)
   ```bash
   # Install Portainer
   docker run -d -p 9000:9000 --name portainer \
     --restart=always \
     -v /var/run/docker.sock:/var/run/docker.sock \
     -v portainer_data:/data \
     portainer/portainer-ce:latest
   ```

2. **Deploy Application**
   - Access Portainer UI at `http://YOUR_IP:9000`
   - Create Stack with `docker-stack.yml`
   - Set environment variables
   - Click "Deploy"

3. **Daily Operations**
   - Monitor: View container stats in dashboard
   - Logs: Click container → Logs tab
   - Update: Stack → Editor → Update stack
   - Restart: Container → Restart button

### Using Windmill Automation

1. **Initial Setup** (One-time)
   ```bash
   # Run setup script
   ./windmill-setup.sh
   ```

2. **Configure Workflow**
   - Access Windmill UI at `http://YOUR_IP:8000`
   - Import workflow from `windmill-deploy-flow.yaml`
   - Configure schedule or webhook

3. **Automated Deployments**
   - Manual: Click "Run" in Windmill UI
   - Scheduled: Runs automatically (e.g., daily at 2 AM)
   - CI/CD: Triggered by webhook from GitHub/GitLab

4. **Monitoring**
   - View workflow execution history
   - Check logs for each step
   - Receive notifications on success/failure

---

## Quick Commands Cheat Sheet

### Docker Manager (Portainer)
```bash
# Install Portainer
docker volume create portainer_data
docker run -d -p 9000:9000 --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data portainer/portainer-ce:latest

# Access UI
http://YOUR_SERVER_IP:9000

# Update Portainer
docker stop portainer
docker rm portainer
docker pull portainer/portainer-ce:latest
# Then run install command again
```

### Windmill
```bash
# Install Windmill
cd /root/cortexbuild_pro/deployment
./windmill-setup.sh

# Access UI
http://YOUR_SERVER_IP:8000

# View logs
cd /root/windmill
docker compose logs -f

# Restart
docker compose restart
```

### Docker Compose (Traditional)
```bash
# Deploy
cd /root/cortexbuild_pro/deployment
docker compose up -d

# Update
docker compose up -d --no-deps --build app

# View logs
docker compose logs -f app

# Restart
docker compose restart app

# Stop
docker compose down
```

---

## Integration Examples

### CI/CD with GitHub Actions

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Windmill Deployment
        run: |
          curl -X POST ${{ secrets.WINDMILL_WEBHOOK_URL }} \
            -H "Authorization: Bearer ${{ secrets.WINDMILL_TOKEN }}"
```

### CI/CD with GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - curl -X POST $WINDMILL_WEBHOOK_URL -H "Authorization: Bearer $WINDMILL_TOKEN"
  only:
    - main
```

### Scheduled Updates

**Via Windmill:**
- Set cron schedule in workflow: `0 2 * * *` (daily at 2 AM)
- Automatic pull, build, deploy, test

**Via Cron + Docker Manager:**
```bash
# Add to crontab
0 2 * * * cd /root/cortexbuild_pro && git pull && docker compose up -d --build
```

---

## Security Best Practices

### For All Methods

1. **Change Default Passwords**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32  # For NEXTAUTH_SECRET
   openssl rand -base64 24  # For database password
   ```

2. **Firewall Configuration**
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw allow 9000/tcp  # Portainer (restrict to VPN/IP in production)
   sudo ufw allow 8000/tcp  # Windmill (restrict to VPN/IP in production)
   sudo ufw enable
   ```

3. **Use HTTPS/SSL**
   - Set up SSL certificates with Let's Encrypt
   - Configure reverse proxy (nginx)
   - Redirect HTTP to HTTPS

### For Portainer

- Enable 2FA if available
- Create read-only users for monitoring
- Use HTTPS for Portainer UI
- Limit access to specific IPs

### For Windmill

- Use API tokens with limited scope
- Enable audit logs
- Restrict webhook access
- Use workspace permissions

---

## Troubleshooting Guide

### Common Issues

| Issue | Docker Manager | Windmill | Docker Compose |
|-------|---------------|----------|----------------|
| Container won't start | Check logs in UI | Check workflow logs | `docker logs [container]` |
| Can't access UI | Check port 9000 open | Check port 8000 open | - |
| Database connection fails | Check env vars in stack | Check workflow env | Check `.env` file |
| Image build fails | Rebuild via UI | Check build step logs | `docker compose build` |
| Out of disk space | Check volumes in UI | Use cleanup workflow | `docker system prune` |

### Getting Help

1. Check logs via Portainer UI or `docker logs`
2. Verify environment variables
3. Check firewall rules
4. Review documentation in `README-DOCKER-MANAGER.md`
5. Test with curl: `curl -I http://localhost:3000`

---

## Recommended Setup

**For Production (Best of Both Worlds):**
```bash
# 1. Install both Portainer and Windmill
./docker-manager-deploy.sh
./windmill-setup.sh

# 2. Use Portainer for:
#    - Daily monitoring
#    - Manual interventions
#    - Team access

# 3. Use Windmill for:
#    - Automated deployments
#    - Scheduled updates
#    - CI/CD integration
```

**For Development:**
```bash
# Use Docker Compose for simplicity
docker compose up -d
```

**For Small Teams:**
```bash
# Use Portainer for visual management
./docker-manager-deploy.sh
# Then create stack in Portainer UI
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `docker-stack.yml` | Docker Swarm/Stack configuration |
| `docker-compose.yml` | Standard Docker Compose config |
| `Dockerfile` | Application image build instructions |
| `portainer-stack-env.txt` | Environment variables template |
| `windmill-deploy-flow.yaml` | Windmill workflow definition |
| `docker-manager-deploy.sh` | Automated setup script |
| `windmill-setup.sh` | Windmill installation script |
| `.env.docker-manager` | Environment template |
| `README-DOCKER-MANAGER.md` | Full documentation and quick start guide |

---

**Last Updated:** 2026-02-03
**Version:** 1.0.0
