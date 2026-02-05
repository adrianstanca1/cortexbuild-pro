# Repository Organization

**Version:** 2.3.0  
**Last Updated:** February 5, 2026

## Overview

This document describes the organization and structure of the CortexBuild Pro repository after comprehensive cleanup and consolidation.

## Directory Structure

```
cortexbuild-pro/
├── README.md                 # Main project documentation
├── VERSION                   # Version tracking (2.3.0)
├── .env.template             # Environment template for root
├── .gitignore                # Git ignore rules
├── .dockerignore             # Docker ignore rules
│
├── .github/                  # GitHub Actions workflows
│   └── workflows/            # CI/CD pipelines
│
├── docs/                     # Feature documentation
│   ├── *.md                  # Feature guides and summaries
│   ├── VERIFICATION_REPORT.md # TypeScript verification report
│   └── deployment/           # Deployment implementation records
│       └── archived/         # Historical summaries
│
├── deployment/               # Deployment configurations
│   ├── README.md             # Deployment hub documentation
│   ├── QUICKSTART.md         # Quick start guide
│   ├── AUTOMATED-DEPLOYMENT.md # GitHub Actions deployment
│   ├── PRODUCTION-DEPLOY-GUIDE.md # Production workflow
│   ├── CLOUDPANEL-GUIDE.md   # CloudPanel-specific
│   ├── README-DOCKER-MANAGER.md # Docker Manager guide
│   ├── DEPLOYMENT-COMPARISON.md # Method comparison
│   ├── QUICK-REFERENCE.md    # Command reference
│   ├── .env.example          # Environment template
│   ├── .env.production       # Production template
│   ├── docker-compose.yml    # Standard Docker Compose
│   ├── docker-stack.yml      # Docker Swarm/Portainer
│   ├── Dockerfile            # Application container
│   ├── nginx.conf            # HTTP configuration
│   ├── nginx-ssl.conf        # HTTPS configuration
│   └── *.sh                  # Deployment scripts (14 scripts)
│
├── scripts/                  # Repository utility scripts
│   ├── cleanup-branches.sh   # Branch cleanup
│   ├── merge-and-delete-branches.sh # Branch management
│   ├── integration-check.sh  # Integration testing
│   └── *.md                  # Script documentation
│
├── nextjs_space/             # Main Next.js application
│   ├── app/                  # Next.js App Router
│   ├── components/           # React components
│   ├── lib/                  # Utility libraries
│   ├── prisma/               # Database schema
│   ├── public/               # Static assets
│   ├── types/                # TypeScript types
│   ├── hooks/                # React hooks
│   └── package.json          # Dependencies
│
└── screenshots/              # UI screenshots
```

## Clean-Up Summary

### Files Removed
- `deployment/.env.docker-manager` - Redundant (use `.env.example` instead)

### Files Archived
Moved to `docs/deployment/archived/`:
- `CLEANUP_SUMMARY.md` - Repository cleanup documentation
- `DEPLOYMENT_SUCCESS.md` - Deployment status report
- `VPS_DEPLOYMENT_SUMMARY.md` - VPS deployment implementation summary

### Files Organized
- All feature documentation in `docs/`
- All deployment files in `deployment/`
- All utility scripts in `scripts/`
- Historical records in `docs/deployment/archived/`

## File Conventions

### Root Directory
Only essential project files:
- `README.md` - Main documentation
- `VERSION` - Version number
- `.env.template` - Environment template
- Configuration files (`.gitignore`, `.dockerignore`)

### Documentation (`docs/`)
Feature-specific documentation:
- Feature summaries and guides
- Implementation reports
- Security notes
- Performance optimizations

### Deployment (`deployment/`)
All deployment-related files:
- Deployment guides (8 markdown files)
- Configuration files (Docker, nginx)
- Deployment scripts (14 shell scripts)
- Environment templates

### Scripts (`scripts/`)
Repository maintenance utilities:
- Branch management
- Integration checks
- Pre-commit hooks

### Application (`nextjs_space/`)
Main Next.js application code:
- Source code organized by feature
- Database schema and migrations
- Type definitions
- UI components

## Environment Configuration

### Available Templates
1. **Root `.env.template`** - General template with all options documented
2. **`deployment/.env.example`** - Minimal deployment template
3. **`deployment/.env.production`** - Production-specific template

### Usage
```bash
# For local development
cp .env.template nextjs_space/.env

# For deployment
cp deployment/.env.example deployment/.env
# or
cp deployment/.env.production deployment/.env
```

## Documentation Categories

### User Documentation
- `README.md` - Getting started, features, setup
- `deployment/QUICKSTART.md` - Quick deployment guide
- `deployment/README.md` - Complete deployment documentation

### Developer Documentation
- `docs/ADVANCED_FEATURES_SUMMARY.md` - Advanced features
- `docs/ADMIN_UI_PAGES_SUMMARY.md` - Admin interface
- `docs/INTEGRATION_CHECK_GUIDE.md` - Integration testing
- `docs/VERIFICATION_REPORT.md` - TypeScript verification

### Operations Documentation
- `deployment/PRODUCTION-DEPLOY-GUIDE.md` - Production workflow
- `deployment/AUTOMATED-DEPLOYMENT.md` - CI/CD setup
- `deployment/QUICK-REFERENCE.md` - Command reference

### Historical Records
- `docs/deployment/archived/` - Implementation summaries

## Maintenance Guidelines

### Adding New Files

1. **Documentation**: Place in `docs/` with descriptive name
2. **Deployment scripts**: Place in `deployment/` with `.sh` extension
3. **Utility scripts**: Place in `scripts/` with descriptive name
4. **Application code**: Place in `nextjs_space/` following existing structure

### Removing Files

1. Check for references in other files (use grep)
2. Update documentation if referenced
3. Consider archiving instead of deleting if historically valuable

### Updating Structure

1. Document changes in this file
2. Update relevant README files
3. Update cross-references in documentation
4. Commit with descriptive message

## Benefits of Current Organization

✅ **Clean root directory** - Only essential files visible  
✅ **Logical grouping** - Related files together  
✅ **Clear separation** - Deployment vs. application vs. documentation  
✅ **Easy navigation** - Intuitive directory names  
✅ **Reduced duplication** - Single source of truth  
✅ **Better maintainability** - Clear structure to follow  
✅ **Improved onboarding** - Easy for new developers to understand  

## Version History

- **v2.3.0** (Feb 5, 2026) - Repository cleanup and organization
  - Archived historical summaries
  - Removed redundant .env file
  - Created clear directory structure
  - Documented organization

---

**Maintained by:** CortexBuild Pro Team  
**For questions or suggestions:** Open an issue on GitHub
