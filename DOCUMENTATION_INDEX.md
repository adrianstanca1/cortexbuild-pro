# CortexBuild Pro - Documentation Index

This index provides an overview of all documentation available in the CortexBuild Pro repository.

## Essential Documentation

### Getting Started
- **[README.md](README.md)** - Main project overview, features, and quick start guide
- **[QUICKSTART.md](QUICKSTART.md)** - Step-by-step guide to get the platform running quickly

### Deployment & Operations
- **[deployment/PRODUCTION-DEPLOY-GUIDE.md](deployment/PRODUCTION-DEPLOY-GUIDE.md)** - ⭐ **Primary deployment guide** - Comprehensive production deployment
- **[deployment/CLOUDPANEL-GUIDE.md](deployment/CLOUDPANEL-GUIDE.md)** - CloudPanel-specific deployment instructions
- **[deployment/README.md](deployment/README.md)** - Deployment scripts overview and quick reference
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
- **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Production readiness checklist

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
- **[docs/PERFORMANCE_OPTIMIZATIONS.md](docs/PERFORMANCE_OPTIMIZATIONS.md)** - Performance tuning guide and improvements

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
- **[verify-config.sh](verify-config.sh)** - Configuration verification utility
- **[scan-env-vars.sh](scan-env-vars.sh)** - Environment variable scanning tool
- **[validate-pre-deployment.sh](validate-pre-deployment.sh)** - Pre-deployment validation
- **[trigger-production-deploy.sh](trigger-production-deploy.sh)** - CI/CD deployment trigger
- **[vps-deploy.sh](vps-deploy.sh)** - VPS deployment script
- **[create-deployment-package.sh](create-deployment-package.sh)** - Build deployment package

### Deployment Scripts
See [deployment/README.md](deployment/README.md) for deployment-specific scripts including:
- production-deploy.sh - Production deployment automation
- vps-setup.sh - VPS server setup
- public-launch-master.sh - Comprehensive public deployment
- backup.sh / restore.sh - Database backup/restore
- And more...

## Deployment Directory

The `deployment/` directory contains Docker configuration and deployment scripts. 
See [deployment/README.md](deployment/README.md) for quick reference or [deployment/PRODUCTION-DEPLOY-GUIDE.md](deployment/PRODUCTION-DEPLOY-GUIDE.md) for comprehensive deployment guide.

## Next.js Application

The `nextjs_space/` directory contains:
- Complete Next.js 14 application
- API routes and backend logic
- React components and UI
- Database schema (Prisma)
- Test suites
- Application-specific documentation

## Recent Cleanup (February 2026)

### Latest Cleanup (February 5, 2026) - Branch Merge & File Cleanup
- **Merged copilot/fix-build-issues branch**: 11 commits with build fixes, type safety, realtime improvements
- **Archived 18 redundant summary/status files** to historical archive
- **Verified build still works** after merging all changes

### Files Archived (February 2026)
- BRANCH_MERGE_COMPLETE.md
- BRANCH_MERGE_COMPLETION.md
- BRANCH_CONSOLIDATION_SUMMARY.md
- MERGE_AND_CLEANUP_SUMMARY.md
- CLEANUP_SUMMARY.md
- CHECKS_COMPLETE_SUMMARY.md
- TASK_COMPLETION_SUMMARY.md
- ERROR_FIX_SUMMARY.md
- FIX_SUMMARY.md
- FINAL_COMPLETION_SUMMARY.md
- FINAL_STATUS_REPORT.md
- FINAL_DEPLOYMENT_STATUS.md
- IMPLEMENTATION_COMPLETE.md
- VERIFICATION_REPORT.md
- REFACTORING_SUMMARY.md
- FEATURE_VERIFICATION_COMPLETE.md
- DEPLOYMENT_COMPLETE_SUMMARY.md
- DEPLOYMENT_SUCCESS.md

## Previous Cleanup (January 2026)

### January 29, 2026 - Branch Consolidation
- **Archived 3 PR-specific summary files** to historical archive
- **Verified all branches merged**: All copilot branches confirmed merged via PRs
- **Confirmed cortexbuildpro as default branch**: Primary development branch

### Files Archived
- IMPLEMENTATION_COMPLETE.md (PR-specific, moved to historical archive)
- PR_SUMMARY.md (PR #90 specific, moved to historical archive)
- FIX_SUMMARY.md (PR #88 specific, moved to historical archive)

### Previous Cleanup (January 29, 2026)
- **Removed 7 duplicate/redundant documentation files**
- **Removed 2 duplicate shell scripts**
- **Consolidated deployment guides**: Merged VPS and API setup information into primary guides
- **File reduction**: Removed 9 files total to reduce duplication

### Files Previously Removed
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

### Consolidation Result
- All feature branches merged into cortexbuildpro (default branch)
- PR-specific documentation archived for historical reference
- Cleaner root directory with essential documentation only
- Reduced duplication and confusion
- Maintained all important operational guides
- Easier to find the correct documentation

## Getting Help

1. **Start here**: [README.md](README.md)
2. **Quick setup**: [QUICKSTART.md](QUICKSTART.md)
3. **API Keys & Passwords**: [API_KEYS_AND_PASSWORDS_REFERENCE.md](API_KEYS_AND_PASSWORDS_REFERENCE.md)
4. **Deploy to production**: [deployment/PRODUCTION-DEPLOY-GUIDE.md](deployment/PRODUCTION-DEPLOY-GUIDE.md)
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

**Last Updated:** February 8, 2026  
**Latest Change:** Repository cleanup - removed 25 redundant files (10 documentation, 13 scripts, 2 config files)

### February 8, 2026 Cleanup - Branch Sync & Consolidation
- **Analyzed all 9 branches** for unmerged changes and conflicts
- **Removed 5 redundant root shell scripts**: deploy-now.sh, quick-public-launch.sh, delete-copilot-branches.sh, prepare-vps-deployment.sh, show-deployment-status.sh
- **Removed 8 redundant deployment scripts**: deploy-production.sh, clean-build-deploy.sh, one-click-deploy.sh, vps-full-deploy.sh, vps-public-deploy.sh, windmill-setup.sh, windmill-deploy-flow.yaml, scripts-help.sh
- **Removed 10 redundant documentation files**: BRANCH_STATUS.md, BRANCH_CLEANUP_ANALYSIS.md, SECURITY_REVIEW_SUMMARY.md, PRODUCTION_DEPLOYMENT.md, CLOUDPANEL_DEPLOYMENT_GUIDE.md, DEPLOYMENT_QUICK_REFERENCE.md, PRODUCTION_READINESS_CHECKLIST.md, VPS_CONNECTION_CONFIG.md, PERFORMANCE_OPTIMIZATIONS_SUMMARY.md, deployment/QUICK-REFERENCE.md
- **Removed 2 redundant config files**: deployment/.env.docker-manager, deployment/portainer-stack-env.txt
- **Updated DOCUMENTATION_INDEX.md** to reflect current file structure

### February 5, 2026 Cleanup
- **Removed 16 redundant documentation files**:
  - BRANCH_MERGE_README.md (task completion)
  - BUILD_STATUS.md (status report)
  - DEPLOYMENT_PREPARATION_SUMMARY.md (summary)
  - DEPLOYMENT_READY.md (status)
  - DEPLOYMENT_SUMMARY.md (summary)
  - DEPLOYMENT_WORKFLOW.md (overlaps with PRODUCTION_DEPLOYMENT.md)
  - DEPLOY_PRODUCTION_TESTING.md (testing guide)
  - DEPLOY_TO_VPS_COMPLETE.md (completion status)
  - ENTERPRISE_PRODUCTIONIZATION_SUMMARY.md (summary)
  - VPS_DEPLOYMENT_CHECKLIST.md (overlaps with PRODUCTION_DEPLOYMENT_CHECKLIST.md)
  - VPS_DEPLOYMENT_IMPLEMENTATION_SUMMARY.md (summary)
  - VPS_DEPLOYMENT_INSTRUCTIONS.md (overlaps with PRODUCTION_DEPLOYMENT.md)
  - VPS_DEPLOYMENT_PACKAGE_GUIDE.md (overlaps with scripts)
  - VPS_DEPLOYMENT_SUMMARY.md (summary)
  - VPS_QUICK_DEPLOY.md (overlaps with scripts)
  - test-performance-optimizations.md (test plan)

- **Removed 3 redundant deployment scripts**:
  - deploy-to-vps-exact.sh (overlaps with deploy-to-vps.sh)
  - deploy-to-vps.sh (overlaps with deploy-now.sh)
  - one-command-deploy.sh (overlaps with deploy-now.sh)

- **Result**: Reduced from 48 to 32 markdown files (33% reduction) and 19 to 16 scripts
- **All branches aligned**: Only copilot/align-and-merge-branches exists, no conflicts
- **Working tree**: Clean, all changes committed
