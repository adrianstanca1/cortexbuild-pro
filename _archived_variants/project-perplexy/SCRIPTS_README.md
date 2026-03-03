# Deployment Scripts Documentation

This directory contains automated deployment scripts for the ConstructAI platform.

## Available Scripts

### 1. deploy.sh - One-Command Deployment

**Purpose**: Interactive deployment wizard for all deployment scenarios

**Usage**:
```bash
./deploy.sh
```

**Features**:
- Interactive menu-driven interface
- Three deployment modes:
  1. Docker Compose (recommended)
  2. Manual deployment
  3. Development environment
- Automatic prerequisite checking
- Environment configuration assistance
- Service health verification
- Color-coded output

**When to use**:
- First-time setup
- When you want guided deployment
- Testing different deployment methods
- Quick environment setup

---

### 2. health-check.sh - Deployment Verification

**Purpose**: Comprehensive health check for deployed services

**Usage**:
```bash
./health-check.sh

# With custom URLs
BACKEND_URL=https://api.example.com FRONTEND_URL=https://example.com ./health-check.sh
```

**Checks Performed**:
- ✅ Environment configuration
- ✅ Build artifacts
- ✅ Docker services (if applicable)
- ✅ Database connectivity
- ✅ Redis connectivity
- ✅ Backend health endpoint
- ✅ Frontend accessibility
- ✅ Security configuration

**Exit Codes**:
- `0` - All checks passed
- `1` - One or more checks failed

**When to use**:
- After deployment
- Before going to production
- Troubleshooting issues
- CI/CD pipeline verification
- Regular health monitoring

---

### 3. validate-deployment.sh - Pre-Deployment Validation

**Purpose**: Validate that the system is ready for deployment

**Usage**:
```bash
./validate-deployment.sh
```

**Checks**:
- Node.js installation and version
- npm installation
- Docker installation
- Dependencies installed
- Prisma client generated
- Build artifacts present
- Environment file exists
- Docker configuration files

**When to use**:
- Before starting deployment
- Troubleshooting setup issues
- Verifying local environment
- CI/CD pre-deployment checks

---

### 4. build.sh - Build All Packages

**Purpose**: Build all workspace packages in correct order

**Usage**:
```bash
./build.sh
```

**Build Order**:
1. Shared package
2. Backend
3. Frontend

**When to use**:
- Manual builds
- Testing build process
- CI/CD pipelines
- Before manual deployment

---

### 5. deploy-local.sh - Local Production Deployment

**Purpose**: Deploy application locally in production mode

**Usage**:
```bash
./deploy-local.sh
```

**Process**:
1. Check prerequisites (Node.js, npm, Python)
2. Install dependencies
3. Build application
4. Create storage directory
5. Start services (backend and frontend)
6. Display access information

**When to use**:
- Testing production builds locally
- QA environment setup
- Staging deployment
- Local production testing

---

### 6. start-local.sh - Start Local Services

**Purpose**: Quick start for local development/testing

**Usage**:
```bash
./start-local.sh
```

**When to use**:
- Restarting services after build
- Quick local testing
- Development workflow

---

### 7. build-local.sh - Local Build Script

**Purpose**: Build packages locally with error handling

**Usage**:
```bash
./build-local.sh
```

**Features**:
- Comprehensive error handling
- Step-by-step build process
- Dependency verification
- Build artifact validation

**When to use**:
- Troubleshooting build issues
- Detailed build logging
- Local development builds

---

### 8. docker-build-local.sh - Docker Build Script

**Purpose**: Build Docker images locally

**Usage**:
```bash
./docker-build-local.sh
```

**When to use**:
- Testing Docker builds
- Local Docker deployment
- Image verification before pushing

---

## Script Dependencies

### Required System Tools

All scripts require:
- **Bash 4+**: Shell interpreter
- **curl**: For HTTP requests (health checks)
- **grep**: Text processing
- **ps**: Process monitoring

### Deployment-Specific Tools

**Docker deployment**:
- Docker 20.10+
- Docker Compose v2+

**Manual deployment**:
- Node.js 20+
- npm 8+
- MongoDB 7.0+
- Redis 7+

**Optional tools**:
- PM2: Process management
- Nginx: Reverse proxy
- mongosh: MongoDB shell
- redis-cli: Redis command-line

---

## Usage Examples

### First-Time Deployment

```bash
# 1. Validate environment
./validate-deployment.sh

# 2. Run deployment wizard
./deploy.sh
# Choose option 1 (Docker Compose)

# 3. Verify deployment
./health-check.sh
```

### Development Workflow

```bash
# 1. Setup development environment
./deploy.sh
# Choose option 3 (Development)

# 2. Make code changes

# 3. Rebuild
./build.sh

# 4. Restart services
./start-local.sh

# 5. Verify changes
./health-check.sh
```

### Production Deployment

```bash
# 1. Pre-deployment validation
./validate-deployment.sh

# 2. Build application
./build.sh

# 3. Deploy
# Option A: Docker
docker compose -f docker-compose.prod.yml up -d

# Option B: Manual
./deploy-local.sh

# 4. Verify deployment
./health-check.sh

# 5. Monitor
docker compose logs -f  # or pm2 logs
```

### CI/CD Pipeline

```bash
# .github/workflows/deploy.yml
steps:
  - name: Validate
    run: ./validate-deployment.sh
    
  - name: Build
    run: ./build.sh
    
  - name: Deploy
    run: docker compose -f docker-compose.prod.yml up -d
    
  - name: Health Check
    run: ./health-check.sh
```

---

## Script Options and Environment Variables

### deploy.sh

No command-line options (interactive menu).

### health-check.sh

Environment variables:
```bash
BACKEND_URL=http://localhost:3001    # Backend URL to check
FRONTEND_URL=http://localhost:3000   # Frontend URL to check
TIMEOUT=10                            # Request timeout in seconds
```

### validate-deployment.sh

No options or environment variables.

### Other scripts

Check script header comments for specific options.

---

## Troubleshooting

### Permission Denied

```bash
# Make scripts executable
chmod +x *.sh

# Or individually
chmod +x deploy.sh health-check.sh validate-deployment.sh
```

### Script Not Found

```bash
# Run from project root
cd /path/to/project-perplexy
./deploy.sh

# Or use full path
/path/to/project-perplexy/deploy.sh
```

### Docker Not Found

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker service
sudo systemctl start docker
```

### npm Not Found

```bash
# npm should come with Node.js
# If missing, reinstall Node.js from https://nodejs.org/
node --version
npm --version
```

### Build Failures

```bash
# 1. Validate environment
./validate-deployment.sh

# 2. Clean and retry
rm -rf node_modules packages/*/node_modules packages/*/dist
npm install --legacy-peer-deps
./build.sh
```

### Health Check Failures

```bash
# Check if services are running
docker compose ps  # Docker deployment
pm2 list          # Manual deployment

# Check logs
docker compose logs -f backend
docker compose logs -f frontend

# Verify ports
lsof -i :3000
lsof -i :3001
```

---

## Best Practices

### Development

1. Use `deploy.sh` option 3 for initial setup
2. Use `npm run dev` for active development
3. Run `health-check.sh` after major changes
4. Use `validate-deployment.sh` before committing

### Testing

1. Use `deploy.sh` option 1 (Docker) for isolated testing
2. Run `health-check.sh` after deployment
3. Test with `docker compose -f docker-compose.prod.yml`
4. Verify all endpoints manually

### Production

1. Review [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
2. Run `validate-deployment.sh` first
3. Use Docker Compose production config
4. Run `health-check.sh` after deployment
5. Set up continuous health monitoring
6. Configure automated backups

---

## Script Maintenance

### Adding New Scripts

1. Create script with `.sh` extension
2. Add shebang: `#!/bin/bash`
3. Add script description in header
4. Include error handling: `set -e`
5. Add to this documentation
6. Make executable: `chmod +x script.sh`
7. Test thoroughly

### Updating Scripts

1. Test changes locally
2. Update documentation
3. Increment version in script header
4. Test in all deployment scenarios
5. Update CHANGELOG if applicable

---

## Additional Resources

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md) - Cloud platform guides
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-deployment checklist
- [QUICKSTART_NEW.md](./QUICKSTART_NEW.md) - Quick start guide
- [README.md](./README.md) - Main documentation

---

## Support

For script issues:
1. Check this documentation
2. Review script source code
3. Open an issue on GitHub
4. Check existing issues for solutions

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Platform**: ConstructAI Construction Management Platform
