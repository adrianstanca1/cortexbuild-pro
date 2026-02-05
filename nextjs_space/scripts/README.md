# Next.js Application Scripts

This directory contains utility scripts for the Next.js application, including database management, health checks, and diagnostics.

## Available Scripts

### Database Management
- `seed.ts` - Seed database with initial data (configured in `package.json` for `prisma db seed`)
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

### Running Scripts in Development

```bash
# From nextjs_space directory
npx tsx scripts/health-check.ts
npx tsx scripts/seed.ts
npx tsx scripts/backup-database.ts --tables core
```

### Using Prisma Seed Command

The `seed.ts` script is configured in `package.json`:

```bash
# Run seed via Prisma
npx prisma db seed

# Or via yarn/npm
yarn prisma db seed
npm run prisma db seed
```

### Running in Production/Docker

```bash
docker-compose exec app sh -c "cd /app && npx tsx scripts/health-check.ts"
```

## Environment Variables

All scripts require:
- `DATABASE_URL` - PostgreSQL connection string (automatically used by Prisma)
- `ADMIN_PASSWORD` - (Optional) Password for seed script users (default: "ChangeMe123!")

Set these in your `.env` file. See `.env.example` for all available variables.

## Database Connection

Scripts use Prisma Client directly. For better connection management, consider using:

```typescript
// Instead of:
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Use the shared client helper:
import { getScriptPrismaClient, disconnectScriptPrisma } from '@/lib/script-db';

async function main() {
  const prisma = getScriptPrismaClient();
  try {
    // Your logic here
  } finally {
    await disconnectScriptPrisma();
  }
}
```

See `/CODE_STRUCTURE.md` for more details on database connection patterns.

## Best Practices

1. **Environment Variables**: Always use env vars for sensitive data
   ```typescript
   const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
   ```

2. **Connection Management**: Disconnect Prisma in finally blocks
   ```typescript
   try {
     // Your operations
   } finally {
     await prisma.$disconnect();
   }
   ```

3. **Error Handling**: Wrap main function with proper error handling
   ```typescript
   main()
     .catch((e) => {
       console.error(e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

## Script Arguments

Most scripts support command-line arguments:

```bash
# Health check with verbose output
npx tsx scripts/health-check.ts --verbose

# Health check with JSON output
npx tsx scripts/health-check.ts --json

# Backup specific tables
npx tsx scripts/backup-database.ts --tables core --output ./my-backups

# Generate report as JSON
npx tsx scripts/generate-report.ts --format json
```

## Scheduled Execution

For regular maintenance, you can schedule scripts with cron:

```bash
# Add to crontab
# Daily backup at 2 AM
0 2 * * * cd /path/to/nextjs_space && npx tsx scripts/backup-database.ts

# Weekly data integrity check (Sundays at 3 AM)
0 3 * * 0 cd /path/to/nextjs_space && npx tsx scripts/data-integrity-check.ts

# Monthly cleanup (1st of month at 1 AM)
0 1 1 * * cd /path/to/nextjs_space && npx tsx scripts/cleanup-old-data.ts
```

## Troubleshooting

**Prisma Client not found:**
```bash
# Generate Prisma Client
npx prisma generate
```

**Database connection errors:**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db pull --schema=./prisma/schema.prisma
```

**TypeScript errors:**
```bash
# Install dependencies
yarn install
# or
npm install
```

## Learn More

- **Code Structure**: See `/CODE_STRUCTURE.md` for patterns and best practices
- **API Configuration**: See `/CODE_STRUCTURE.md` for API connection patterns
- **Prisma Schema**: See `./prisma/schema.prisma` for database models
- **Deployment Scripts**: See `../deployment/scripts/README.md` for deployment versions
