# Deployment Scripts

This directory contains utility scripts for database management, health checks, and diagnostics when deploying CortexBuild Pro on a VPS.

## Available Scripts

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

### Running Scripts in Docker Environment

```bash
# From deployment directory
docker-compose exec app sh -c "cd /app && npx tsx scripts/seed.ts"
docker-compose exec app sh -c "cd /app && npx tsx scripts/health-check.ts --verbose"
```

### Running Scripts Locally (Development)

```bash
# Make sure you have DATABASE_URL set in .env
export DATABASE_URL="postgresql://user:password@localhost:5432/cortexbuild"
npx tsx scripts/health-check.ts
```

## Environment Variables

All scripts require:
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_PASSWORD` - (Optional) Password for seed script users (default: "ChangeMe123!")

For full list of environment variables, see `../.env.example`

## Note on Code Duplication

⚠️ **Important**: These scripts are duplicated from `../nextjs_space/scripts/` with added JSDoc documentation.

**Why the duplication?**
- Supports standalone VPS deployment scenarios
- Maintains deployment independence
- Provides comprehensive documentation for operations

**Future**: Consider consolidating into shared module. See `/CODE_STRUCTURE.md` for details.

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

- See `/CODE_STRUCTURE.md` for comprehensive documentation on code patterns
- See `/PRODUCTION_DEPLOYMENT.md` for full deployment instructions
- See `../nextjs_space/scripts/README.md` for Next.js script usage
