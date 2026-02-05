# Integration Check - Quick Start

## One-Line Command

```bash
./scripts/integration-check.sh
```

This runs all checks and validates your code is ready for integration.

## Individual Checks

Run specific checks when you want to validate a particular aspect:

```bash
./scripts/integration-check.sh git       # Check git status
./scripts/integration-check.sh deps      # Check dependencies
./scripts/integration-check.sh types     # TypeScript type check
./scripts/integration-check.sh lint      # ESLint check
./scripts/integration-check.sh prisma    # Prisma schema validation
./scripts/integration-check.sh build     # Next.js build
./scripts/integration-check.sh docker    # Docker configuration
./scripts/integration-check.sh env       # Environment files
./scripts/integration-check.sh security  # Security scan
```

## Before You...

### Before Committing
```bash
# Run checks sequentially
./scripts/integration-check.sh types
./scripts/integration-check.sh lint
./scripts/integration-check.sh security
```

### Before Pushing
```bash
./scripts/integration-check.sh
```

### Before Deploying
```bash
./scripts/integration-check.sh && cd deployment && ./production-deploy.sh
```

### Before Creating a PR
```bash
./scripts/integration-check.sh
git push origin your-branch
```

## Setup Pre-commit Hooks

Automatically run checks before every commit:

```bash
./scripts/setup-pre-commit-hook.sh
```

## CI/CD

GitHub Actions automatically runs integration checks on:
- Every push to main, cortexbuildpro, or copilot/* branches
- Every pull request

View results in the GitHub Actions tab.

## Common Issues

**TypeScript errors?**
```bash
cd nextjs_space
npx tsc --noEmit  # See errors
```

**Lint errors?**
```bash
cd nextjs_space
npm run lint  # See errors
```

**Build fails?**
```bash
cd nextjs_space
npm run build  # See build errors
```

**Prisma issues?**
```bash
cd nextjs_space
npx prisma validate
npx prisma format
```

## Exit Codes

- `0` - All checks passed
- `1` - Some checks failed

## Full Documentation

See [INTEGRATION_CHECK_GUIDE.md](../docs/INTEGRATION_CHECK_GUIDE.md) for complete documentation.
