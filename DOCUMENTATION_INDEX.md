# CortexBuild Pro - Documentation Index

This index provides an overview of all documentation available in the CortexBuild Pro repository.

## Essential Documentation

### Getting Started
- **[README.md](README.md)** - Main project overview, features, and quick start guide
- **[START_HERE.md](START_HERE.md)** - Begin here for an overview of the platform
- **[QUICKSTART.md](QUICKSTART.md)** - Step-by-step guide to get the platform running quickly

### Deployment & Operations
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - ⭐ **Primary deployment guide** - Comprehensive production deployment
- **[RUNBOOK.md](RUNBOOK.md)** - Operational procedures, troubleshooting, and maintenance tasks

### Configuration
- **[CONFIGURATION_CHECKLIST.md](CONFIGURATION_CHECKLIST.md)** - Complete checklist for setting up all services
- **[API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)** - Detailed guide for configuring API keys and external services

### Security & Compliance
- **[SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)** - Security best practices, compliance information, and audit details

### Development
- **[CODE_STRUCTURE.md](CODE_STRUCTURE.md)** - Architecture overview and codebase organization
- **[API_REFACTORING_GUIDE.md](API_REFACTORING_GUIDE.md)** - Best practices for API development and code quality
- **[PERFORMANCE_IMPROVEMENTS_2026.md](PERFORMANCE_IMPROVEMENTS_2026.md)** - Performance tuning guide and latest improvements

### Status Reports
- **[PLATFORM_COMPLETION_REPORT.md](PLATFORM_COMPLETION_REPORT.md)** - Comprehensive platform status and feature completeness

## Quick Reference Scripts

- **[deploy-now.sh](deploy-now.sh)** - Automated deployment script
- **[verify-config.sh](verify-config.sh)** - Configuration verification utility

## Deployment Directory

The `deployment/` directory contains:
- Docker Compose configuration
- Nginx configuration templates
- Production environment examples
- Deployment scripts and utilities

## Next.js Application

The `nextjs_space/` directory contains:
- Complete Next.js 14 application
- API routes and backend logic
- React components and UI
- Database schema (Prisma)
- Test suites
- Application-specific documentation

## Recent Cleanup (January 2026)

During repository cleanup, redundant and insecure documents were removed:

### Security Improvements
- **Removed files with hardcoded credentials** for enhanced security
- Redacted sensitive information from START_HERE.md

### Consolidation
- Multiple deployment guides → **PRODUCTION_DEPLOYMENT.md**
- Removed: DEPLOYMENT_GUIDE.md, DEPLOYMENT_SUMMARY.md
- Removed: PERFORMANCE_OPTIMIZATIONS.md (superseded by PERFORMANCE_IMPROVEMENTS_2026.md)
- Removed redundant deployment scripts with security vulnerabilities

### Scripts Consolidated
- Kept: `deploy-now.sh` (local Docker deployment)
- Kept: `deployment/deploy-from-github.sh` (GitHub-based remote deployment)
- Removed: Multiple redundant deployment scripts

## Getting Help

1. **Start here**: [README.md](README.md)
2. **Quick setup**: [QUICKSTART.md](QUICKSTART.md)
3. **Deploy to production**: [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
4. **Configuration**: [CONFIGURATION_CHECKLIST.md](CONFIGURATION_CHECKLIST.md)
5. **Problems?**: [RUNBOOK.md](RUNBOOK.md) - Troubleshooting section
6. **Security**: [SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md)

## Contributing

When adding new documentation:
1. Keep it focused and avoid duplication
2. Update this index when adding major documents
3. Follow the existing documentation structure
4. Use clear, concise language
5. Include examples where appropriate

---

**Last Updated:** January 25, 2026
