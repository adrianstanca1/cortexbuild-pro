# CortexBuild Pro - Documentation Index

This index provides an overview of all documentation available in the CortexBuild Pro repository.

## Essential Documentation

### Getting Started
- **[README.md](README.md)** - Main project overview, features, and quick start guide
- **[QUICKSTART.md](QUICKSTART.md)** - Step-by-step guide to get the platform running quickly

### Deployment & Operations
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - ⭐ **Primary deployment guide** - Comprehensive production deployment
- **[CLOUDPANEL_DEPLOYMENT_GUIDE.md](CLOUDPANEL_DEPLOYMENT_GUIDE.md)** - CloudPanel-specific deployment instructions
- **[DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)** - Quick reference for common deployment commands
- **[RUNBOOK.md](RUNBOOK.md)** - Operational procedures, troubleshooting, and maintenance tasks
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

### GitHub Actions (CI/CD)
- **[.github/workflows/README.md](.github/workflows/README.md)** - ⭐ **NEW** - GitHub Actions setup guide
- **[.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml)** - ⭐ **NEW** - Automated VPS deployment workflow
- **[.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml)** - Docker image build and publish workflow

### Configuration
- **[API_KEYS_AND_PASSWORDS_REFERENCE.md](API_KEYS_AND_PASSWORDS_REFERENCE.md)** - Complete reference for all API keys and passwords
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - Comprehensive guide for configuring API keys and external services
- **[GITHUB_SECRETS_GUIDE.md](GITHUB_SECRETS_GUIDE.md)** - GitHub repository secrets configuration
- **[VPS_CONNECTION_CONFIG.md](VPS_CONNECTION_CONFIG.md)** - VPS connection and WebSocket configuration
- **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Production readiness checklist
- **[PRODUCTION_READINESS_CHECKLIST.md](PRODUCTION_READINESS_CHECKLIST.md)** - Comprehensive pre-deployment checklist

### Security & Compliance
- **[SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)** - Security best practices, compliance information, and audit details
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Pre-deployment security verification checklist
- **[SECURITY_ADVISORY.md](SECURITY_ADVISORY.md)** - Security status and vulnerability reports

### Development & Architecture
- **[CODE_STRUCTURE.md](CODE_STRUCTURE.md)** - Architecture overview and codebase organization
- **[API_REFACTORING_GUIDE.md](API_REFACTORING_GUIDE.md)** - Best practices for API development and code quality
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - Complete API endpoint documentation
- **[API_WEBSOCKET_REFERENCE.md](API_WEBSOCKET_REFERENCE.md)** - WebSocket API reference
- **[BACKEND_FRONTEND_CONNECTIVITY.md](BACKEND_FRONTEND_CONNECTIVITY.md)** - Backend-frontend integration guide
- **[PERFORMANCE_IMPROVEMENTS_2026.md](PERFORMANCE_IMPROVEMENTS_2026.md)** - Performance tuning guide and latest improvements

### Release Information
- **[RELEASE_NOTES.md](RELEASE_NOTES.md)** - Version history and release notes

### Historical Documentation
- **[.github/historical/archive/](.github/historical/archive/)** - Archived completion reports and status documentation
  - All historical completion reports from January 2026 cleanup
  - Branch merge and build completion summaries
  - Deployment verification and status reports
  - Domain-specific deployment guides

## Quick Reference Scripts

### Root Directory Scripts
- **[deploy-now.sh](deploy-now.sh)** - Quick deployment script with interactive guidance
- **[verify-config.sh](verify-config.sh)** - Configuration verification utility
- **[verify-deployment.sh](verify-deployment.sh)** - Deployment verification script
- **[cleanup-remote-branches.sh](cleanup-remote-branches.sh)** - Git branch cleanup utility

### Deployment Scripts
See [deployment/README.md](deployment/README.md) for deployment-specific scripts including:
- deploy-production.sh - Production deployment automation
- deploy-vps.sh - VPS deployment
- setup-ssl.sh - SSL/HTTPS configuration
- backup.sh / restore.sh - Database backup/restore
- And more...

## Deployment Directory

The `deployment/` directory contains Docker configuration and deployment scripts. 
See [deployment/README.md](deployment/README.md) for quick reference or [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) for comprehensive deployment guide.

## Next.js Application

The `nextjs_space/` directory contains:
- Complete Next.js 14 application
- API routes and backend logic
- React components and UI
- Database schema (Prisma)
- Test suites
- Application-specific documentation

## Recent Cleanup (January 2026)

### Latest Cleanup (January 29, 2026)
- **Removed 7 duplicate/redundant documentation files**
- **Removed 2 duplicate shell scripts**
- **Consolidated deployment guides**: Merged VPS and API setup information into primary guides
- **File reduction**: Removed 9 files total to reduce duplication

### Files Removed
- DEPLOYMENT_FIX_502.md (obsolete, specific fix already integrated)
- API_SERVER_SETUP.md (duplicate of API_SETUP_GUIDE.md)
- VPS_DEPLOYMENT_GUIDE.md (consolidated into PRODUCTION_DEPLOYMENT.md)
- CONFIGURATION_CHECKLIST.md (merged into PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- CREDENTIALS_CHECKLIST.md (merged into PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- VPS_DEPLOYMENT_CHECKLIST.md (merged into PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- ENVIRONMENT_SETUP_GUIDE.md (merged into API_SETUP_GUIDE.md)
- deploy-to-vps.sh (duplicate of deploy-now.sh)
- verify-production-readiness.sh (overlaps with verify-deployment.sh)

### Previous Cleanup (January 27, 2026)
- **Archived 22 historical completion reports** to `.github/historical/archive/`
- **Removed 5 redundant deployment documentation files**
- **File reduction**: From 44 to 25 markdown files in root (43% reduction)

### Result
- Cleaner root directory with essential documentation only
- Reduced duplication and confusion (47% reduction in redundant documentation)
- Maintained all important operational guides
- Easier to find the correct documentation

## Getting Help

1. **Start here**: [README.md](README.md)
2. **Quick setup**: [QUICKSTART.md](QUICKSTART.md)
3. **API Keys & Passwords**: [API_KEYS_AND_PASSWORDS_REFERENCE.md](API_KEYS_AND_PASSWORDS_REFERENCE.md)
4. **Deploy to production**: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
5. **Configuration**: [PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
6. **Problems?**: [RUNBOOK.md](RUNBOOK.md) - Troubleshooting section
7. **Security**: [SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)

## Contributing

When adding new documentation:
1. Keep it focused and avoid duplication
2. Update this index when adding major documents
3. Follow the existing documentation structure
4. Use clear, concise language
5. Include examples where appropriate

---

**Last Updated:** January 29, 2026  
**Latest Change:** Removed duplicate and redundant documentation files to reduce confusion and improve maintainability
