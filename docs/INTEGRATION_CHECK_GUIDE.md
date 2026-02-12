# Integration Check Guide

## Overview

CortexBuild Pro includes comprehensive integration checking to ensure all committed and uncommitted changes are validated before deployment. This guide covers the automated CI/CD workflows, pre-deployment checks, and pre-commit hooks.

## Quick Start

### Run Full Integration Check

```bash
cd /root/cortexbuild-pro
./scripts/integration-check.sh
```

### Run Specific Checks

```bash
# Check git status only
./scripts/integration-check.sh git

# Check TypeScript types only
./scripts/integration-check.sh types

# Check linting only
./scripts/integration-check.sh lint

# Check Prisma schema only
./scripts/integration-check.sh prisma

# Run build check only
./scripts/integration-check.sh build

# Check Docker configuration only
./scripts/integration-check.sh docker
```

## Integration Checks Included

### 1. Git Status Check
- Verifies you're in a git repository
- Shows current branch and latest commit
- Detects uncommitted changes
- Checks for unpushed commits
- Compares local branch with remote

### 2. Dependencies Check
- Verifies node_modules exists
- Checks if dependencies are up to date
- Suggests running `npm ci` if needed

### 3. TypeScript Type Check
- Generates Prisma client
- Runs TypeScript compiler with `--noEmit`
- Catches type errors before deployment
- Validates all TypeScript/TSX files

### 4. Linting Check
- Runs ESLint on the codebase
- Enforces code style and quality
- Catches common programming errors
- Ensures consistent code formatting

### 5. Prisma Schema Validation
- Validates Prisma schema syntax
- Checks for schema formatting issues
- Ensures database schema is valid
- Detects potential migration issues

### 6. Next.js Build Check
- Performs a full production build
- Validates all pages and components
- Checks for build-time errors
- Ensures the application can be deployed

### 7. Docker Configuration Check
- Validates Docker Compose configuration
- Checks if Dockerfile exists
- Validates Dockerfile syntax
- Ensures Docker setup is correct

### 8. Environment Configuration Check
- Checks for .env.template file
- Validates .env.example exists
- Warns if .env file is committed
- Ensures environment is properly configured

### 9. Security Check
- Scans for sensitive files in git
- Checks for .env, .pem, .key files
- Validates .gitignore configuration
- Prevents accidental secret commits

## GitHub Actions CI/CD

The project includes an automated GitHub Actions workflow that runs on every push and pull request.

### Workflow File
`.github/workflows/integration-check.yml`

### Jobs

#### 1. Lint and Type Check
- Checks out code
- Installs Node.js dependencies
- Runs ESLint
- Generates Prisma client
- Performs TypeScript type checking

#### 2. Build Validation
- Checks out code
- Installs dependencies
- Generates Prisma client
- Builds the Next.js application

#### 3. Docker Build Check
- Checks out code
- Sets up Docker Buildx
- Builds the Docker image
- Validates Docker configuration

#### 4. Prisma Validation
- Checks out code
- Validates Prisma schema
- Generates Prisma client
- Checks for schema drift

### Viewing Workflow Results

1. Go to your repository on GitHub
2. Click on the "Actions" tab
3. View the status of recent workflow runs
4. Click on a specific run to see detailed logs

## Pre-commit Hooks

Pre-commit hooks automatically validate changes before they're committed.

### Setup Pre-commit Hook

```bash
cd /root/cortexbuild-pro
./scripts/setup-pre-commit-hook.sh
```

### What the Hook Checks

1. **TypeScript Type Check** - Validates type correctness
2. **Prisma Schema Validation** - Ensures schema is valid
3. **Sensitive File Detection** - Prevents committing secrets

### Bypassing the Hook

If you need to commit without running the hook (not recommended):

```bash
git commit --no-verify -m "Your commit message"
```

## Integration with Deployment

### Before Production Deployment

Always run the integration check before deploying:

```bash
# Run full integration check
./scripts/integration-check.sh

# If all checks pass, proceed with deployment
cd deployment
./production-deploy.sh
```

### Integration Check in Production Workflow

The `production-deploy.sh` script can be enhanced to automatically run integration checks:

```bash
# Add this before deployment
if ! ./scripts/integration-check.sh; then
    echo "Integration checks failed - aborting deployment"
    exit 1
fi
```

## Continuous Integration Best Practices

### 1. Run Checks Locally
Always run integration checks locally before pushing:
```bash
./scripts/integration-check.sh
```

### 2. Review CI Failures
If GitHub Actions fails, review the logs:
- Click on the failed job
- Expand the failing step
- Fix the reported issues

### 3. Keep Dependencies Updated
Regularly update dependencies:
```bash
cd nextjs_space
npm update
npm audit fix
```

### 4. Monitor Build Times
- GitHub Actions shows build duration
- Optimize slow checks if needed
- Use caching for dependencies

### 5. Security First
- Never commit secrets or .env files
- Use environment variables
- Review security check warnings

## Troubleshooting

### Integration Check Fails

**TypeScript errors:**
```bash
cd nextjs_space
npx tsc --noEmit
# Fix reported errors
```

**Lint errors:**
```bash
cd nextjs_space
npm run lint
# Fix reported issues
```

**Build fails:**
```bash
cd nextjs_space
npm run build
# Check build output for errors
```

**Prisma errors:**
```bash
cd nextjs_space
npx prisma validate
npx prisma format
npx prisma generate
```

### GitHub Actions Fails

1. **Check the logs** - View detailed error messages
2. **Run locally** - Reproduce the issue on your machine
3. **Fix the issue** - Make necessary code changes
4. **Push again** - CI will run automatically

### Pre-commit Hook Issues

**Hook not running:**
```bash
# Reinstall the hook
./scripts/setup-pre-commit-hook.sh
```

**Hook fails unexpectedly:**
```bash
# Run checks manually
cd nextjs_space
npx tsc --noEmit
npx prisma validate
```

## Advanced Usage

### Custom Integration Checks

Add custom checks to `integration-check.sh`:

```bash
# Add a new check function
check_custom() {
    log_section "10. Custom Check"
    
    # Your custom validation logic
    if your_command; then
        log_success "Custom check passed"
    else
        log_error "Custom check failed"
        return 1
    fi
}

# Add to main() function
main() {
    # ... existing checks ...
    check_custom || true
    # ...
}
```

### Integration with CI/CD Platforms

The integration check script can be used with any CI/CD platform:

**GitLab CI:**
```yaml
test:
  script:
    - ./scripts/integration-check.sh
```

**CircleCI:**
```yaml
jobs:
  test:
    steps:
      - run: ./scripts/integration-check.sh
```

**Jenkins:**
```groovy
stage('Integration Check') {
    steps {
        sh './scripts/integration-check.sh'
    }
}
```

## Summary

The integration check system provides:

✅ **Automated validation** of all changes  
✅ **CI/CD integration** with GitHub Actions  
✅ **Pre-commit hooks** for early detection  
✅ **Comprehensive checks** covering all aspects  
✅ **Clear reporting** with actionable feedback  
✅ **Security scanning** to prevent leaks  
✅ **Easy to use** with simple commands  

Always run integration checks before:
- Committing code
- Creating pull requests  
- Deploying to production
- Merging branches

This ensures high code quality and prevents integration issues.

## Related Documentation

- [Production Deployment Guide](../deployment/PRODUCTION-DEPLOY-GUIDE.md)
- [Quick Start Guide](../deployment/QUICKSTART.md)
- [README](../README.md)

---

For issues or questions, review the logs and error messages provided by the integration check script. Each check provides specific guidance on fixing detected issues.
