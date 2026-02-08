# Deployment Scripts

This directory contains deployment-specific utility scripts for CortexBuild Pro.

## Scripts in This Directory

- `verify-platform.ts` - Verify platform configuration and requirements
- `verify-build.sh` - Verify build integrity and artifacts
- `script-db-helper.ts` - Shared database client helper for deployment scripts

## Main Application Scripts

**Most utility scripts are located in `../nextjs_space/scripts/`** including:

### Database Management
- `seed.ts` - Seed database with initial data (organizations, users, projects)
- `backup-database.ts` - Create JSON backups of database tables
- `data-integrity-check.ts` - Verify data integrity and find orphaned records
- `cleanup-old-data.ts` - Clean up old activity logs and expired sessions

### Health & Diagnostics
- `health-check.ts` - Comprehensive system health check (database, APIs, storage)
- `system-diagnostics.ts` - Detailed system diagnostics and configuration check
- `test-api-connections.ts` - Test and validate API connections
- `broadcast-test.ts` - Test real-time broadcast functionality

### Reporting
- `generate-report.ts` - Generate comprehensive system reports
- `project-summary-report.ts` - Generate project summary reports

## Usage

### Running Main Scripts in Docker Environment

```bash
# From deployment directory - scripts run from /app which is nextjs_space
docker-compose exec app sh -c "cd /app && npx tsx scripts/seed.ts"
docker-compose exec app sh -c "cd /app && npx tsx scripts/health-check.ts --verbose"
```

### Running Scripts Locally (Development)

```bash
# Make sure you have DATABASE_URL set in .env
cd ../nextjs_space
export DATABASE_URL="postgresql://user:password@localhost:5432/cortexbuild"
npx tsx scripts/health-check.ts
```

## Environment Variables

All scripts require:
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_PASSWORD` - (Optional) Password for seed script users (default: "ChangeMe123!")

For full list of environment variables, see `../.env.example`

## Note on Script Location

✅ **Consolidated**: Most utility scripts are now located in `../nextjs_space/scripts/` to eliminate duplication.

This directory contains only deployment-specific scripts that are unique to the deployment process.
All database management, health checks, and reporting scripts are in the main application directory.

## Best Practices

1. **Always use environment variables** for passwords and API keys
   - ✅ Use `process.env.ADMIN_PASSWORD`
   - ❌ Never hardcode credentials

2. **Run health checks before and after deployments**
   ```bash
   npx tsx scripts/health-check.ts --verbose
   ```

3. **Backup before major changes**
   ```bash
   npx tsx scripts/backup-database.ts --tables all --output ./backups
   ```

4. **Check data integrity regularly**
   ```bash
   npx tsx scripts/data-integrity-check.ts
   ```

## Troubleshooting

**Database connection issues:**
```bash
# Check DATABASE_URL is set correctly
echo $DATABASE_URL

# Verify PostgreSQL is running
docker-compose ps postgres

# Check database connectivity
docker-compose exec postgres pg_isready -U cortexbuild
```

**Permission errors:**
```bash
# Ensure scripts are executable
chmod +x scripts/*.ts
```

## Learn More

- See `../deployment/PRODUCTION-DEPLOY-GUIDE.md` for full deployment instructions
- See `../nextjs_space/scripts/README.md` for Next.js script usage
