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

### Repository Status
- **[REPOSITORY_MERGE_COMPLETE.md](REPOSITORY_MERGE_COMPLETE.md)** - ⭐ **Complete merge summary** - All repositories and progress consolidated
- **[REPOSITORY_CLEANUP_REPORT.md](REPOSITORY_CLEANUP_REPORT.md)** - Latest cleanup report (January 2026)

### Historical Documentation
- **[.github/historical/](.github/historical/)** - Archived merge and platform status documentation
  - MERGE_COMPLETE.md - Branch merge history (January 2026)
  - CLEANUP_SUMMARY.md - Repository cleanup summary (January 2026)
  - BRANCH_ANALYSIS.md - Detailed branch analysis (January 2026)
  - PLATFORM_STATUS_JANUARY_2026.md - Platform completion report (January 2026)
  - TASK_COMPLETION_SUMMARY.md - Task completion status (January 2026)
  - BUILD_COMPLETION_REPORT.md - Build completion status (January 2026)
  - DEPLOYMENT_SUMMARY.md - Historical deployment summary (January 2026)
  - DEPLOYMENT_COMPLETE.txt - Deployment completion status (January 2026)
  - DEPLOY_TO_CORTEXBUILDPRO.md - Domain-specific deployment guide (archived)
  - QUICK_REFERENCE.md - Quick reference guide (consolidated into PRODUCTION_DEPLOYMENT.md)

## Quick Reference Scripts

- **[deploy-now.sh](deploy-now.sh)** - Automated deployment script
- **[verify-config.sh](verify-config.sh)** - Configuration verification utility

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

During repository cleanup, redundant and insecure documents were removed:

### Security Improvements
- **Removed files with hardcoded credentials** for enhanced security
- Redacted sensitive information from START_HERE.md

### Consolidation
- Multiple deployment guides → **PRODUCTION_DEPLOYMENT.md** (primary guide)
- Streamlined **deployment/README.md** to quick reference (points to PRODUCTION_DEPLOYMENT.md)
- Removed: DEPLOYMENT_GUIDE.md, PERFORMANCE_OPTIMIZATIONS.md (superseded by PERFORMANCE_IMPROVEMENTS_2026.md)
- Removed redundant deployment scripts with security vulnerabilities
- Removed manual test files: manual-seed.js, test-materials.ts, test-rfis.js
- Archived historical documentation to .github/historical/:
  - MERGE_COMPLETE.md, CLEANUP_SUMMARY.md, BRANCH_ANALYSIS.md
  - PLATFORM_COMPLETION_REPORT.md → PLATFORM_STATUS_JANUARY_2026.md
  - TASK_COMPLETION_SUMMARY.md, BUILD_COMPLETION_REPORT.md
  - DEPLOYMENT_SUMMARY.md, DEPLOYMENT_COMPLETE.txt
  - DEPLOY_TO_CORTEXBUILDPRO.md, QUICK_REFERENCE.md
- Created **REPOSITORY_MERGE_COMPLETE.md** - Comprehensive summary of all merged work

### Scripts Consolidated
- Kept: `deploy-now.sh` (local Docker deployment)
- Kept: `deployment/deploy-from-github.sh` (GitHub-based remote deployment)
- Removed: Multiple redundant deployment scripts

### Script Duplication Note
- Scripts in `deployment/scripts/` are intentionally duplicated from `nextjs_space/scripts/`
- This duplication supports standalone VPS deployment scenarios
- See `deployment/scripts/README.md` for detailed explanation

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

**Last Updated:** January 26, 2026  
**Latest Cleanup:** Archived 6 additional completion/summary documents to maintain clean root directory
