# 🚀 CortexBuild Pro - Docker Manager & Windmill Deployment

## What's New?

We've added support for **Docker Manager (Portainer)** and **Windmill** workflow automation to make deployment and management easier!

## Quick Start

### One-Command Deployment (Easiest)

```bash
cd /root/cortexbuild_pro/deployment
./quick-deploy.sh
```

This interactive script will:
- ✅ Check your system requirements
- ✅ Install Docker if needed
- ✅ Guide you through deployment options
- ✅ Set up Docker Manager and/or Windmill
- ✅ Deploy your application

### Direct Deployment Options

| Method | Command | Best For |
|--------|---------|----------|
| **Docker Manager** | `./docker-manager-deploy.sh` | Visual management, teams |
| **Windmill** | `./windmill-setup.sh` | Automation, CI/CD |
| **Docker Compose** | `docker compose up -d` | Simple, traditional |

## 📚 Documentation

### Quick References
- **[Quick Start Guide](./QUICKSTART-DOCKER-MANAGER.md)** - Get started in 5 minutes
- **[Comparison Guide](./DEPLOYMENT-COMPARISON.md)** - Choose the right method
- **[VPS Deploy Guide](./README-VPS-DEPLOY.md)** - Server-specific instructions

### Full Documentation
- **[Docker Manager Guide](./README-DOCKER-MANAGER.md)** - Complete Portainer & Windmill docs
- **[General Deployment](./README.md)** - Traditional Docker Compose guide

## 🎯 Which Method Should I Use?

### Use Docker Manager (Portainer) if:
- ✅ You want a web UI for managing containers
- ✅ You have a team needing access
- ✅ You prefer visual monitoring and logs
- ✅ You manage multiple servers

### Use Windmill if:
- ✅ You want automated deployments
- ✅ You need scheduled updates
- ✅ You integrate with CI/CD pipelines
- ✅ You want workflow automation

### Use Docker Compose if:
- ✅ You prefer command-line tools
- ✅ You have a simple setup
- ✅ You're familiar with Docker

### Use Both (Recommended) if:
- ✅ You want the best of both worlds
- ✅ Visual management + Automation
- ✅ Production environment

## 📂 File Structure

```
deployment/
├── 🚀 Quick Start
│   ├── quick-deploy.sh                    # Interactive deployment
│   ├── QUICKSTART-DOCKER-MANAGER.md       # 5-minute guide
│   └── DEPLOYMENT-COMPARISON.md           # Method comparison
│
├── 🐳 Docker Manager (Portainer)
│   ├── docker-manager-deploy.sh           # Setup script
│   ├── docker-stack.yml                   # Stack configuration
│   ├── portainer-stack-env.txt            # Environment template
│   └── .env.docker-manager                # Detailed env template
│
├── 🔄 Windmill Automation
│   ├── windmill-setup.sh                  # Setup script
│   └── windmill-deploy-flow.yaml          # Deployment workflow
│
├── 📖 Documentation
│   ├── README-DOCKER-MANAGER.md           # Full guide
│   ├── README-VPS-DEPLOY.md              # VPS-specific guide
│   └── README.md                          # General guide
│
└── 🔧 Traditional Docker
    ├── docker-compose.yml                 # Standard compose
    ├── Dockerfile                         # Image build
    └── .env.example                       # Environment template
```

## 🌟 Features

### Docker Manager (Portainer)
- 🖥️ Web UI on port 9000
- 📊 Real-time monitoring
- 📝 Visual log viewer
- 👥 Team access control
- 🔄 One-click updates
- 📦 Stack management

### Windmill
- 🤖 Automated workflows
- ⏰ Scheduled deployments
- 🔔 Email notifications
- 🪝 Webhook triggers
- 📊 Execution history
- 🔗 CI/CD integration

## 🔗 Access Points

After deployment:

| Service | URL | Port |
|---------|-----|------|
| **Application** | http://YOUR_IP:3000 | 3000 |
| **Portainer** | http://YOUR_IP:9000 | 9000 |
| **Windmill** | http://YOUR_IP:8000 | 8000 |
| **Database** | localhost:5432 | 5432 |

## 📋 Quick Commands

### View Status
```bash
docker ps                          # All containers
docker compose ps                  # Stack containers
```

### View Logs
```bash
docker logs -f cortexbuild-app    # Application logs
docker compose logs -f            # All service logs
```

### Restart Application
```bash
docker restart cortexbuild-app    # Via Docker
docker compose restart app        # Via Compose
```

### Update Application
```bash
git pull                          # Get latest code
cd deployment
docker compose up -d --build      # Rebuild and deploy
```

## 🆘 Support

### Documentation
- [Quick Start Guide](./QUICKSTART-DOCKER-MANAGER.md)
- [Full Documentation](./README-DOCKER-MANAGER.md)
- [Comparison Guide](./DEPLOYMENT-COMPARISON.md)

### Troubleshooting
```bash
# Check container status
docker ps

# View application logs
docker logs cortexbuild-app

# View all logs
docker compose logs

# Restart services
docker compose restart

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 🔐 Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Generate secure `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Generate secure `POSTGRES_PASSWORD`: `openssl rand -base64 24`
- [ ] Enable firewall: `ufw allow 22,80,443/tcp`
- [ ] Set up SSL/HTTPS certificates
- [ ] Restrict Portainer/Windmill access (firewall or VPN)
- [ ] Regular backups configured
- [ ] Keep Docker images updated

## 📞 Getting Started

1. **Upload project to your VPS**
2. **SSH into your server**
3. **Run quick deployment:**
   ```bash
   cd /root/cortexbuild_pro/deployment
   ./quick-deploy.sh
   ```
4. **Follow the prompts**
5. **Access your application!**

## 🎓 Learn More

- **Docker Manager:** Professional container management with Portainer
- **Windmill:** Workflow automation platform for deployments
- **Docker Compose:** Traditional container orchestration

---

**Last Updated:** 2026-02-03  
**Version:** 1.0.0

**Need help?** Check the documentation or review the troubleshooting guide.
