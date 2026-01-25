# Code Structure and Duplication Documentation

## Overview

This document explains the current code structure, identified duplication patterns, and best practices for API/Database configurations.

## Script Duplication

### Current State

The repository contains duplicate scripts in two locations:
- `deployment/scripts/` - Scripts for VPS deployment scenarios
- `nextjs_space/scripts/` - Scripts for Next.js application

**Duplicated Files:**
1. `backup-database.ts` (deployment: 332 lines, nextjs: 251 lines)
2. `broadcast-test.ts`
3. `cleanup-old-data.ts`
4. `data-integrity-check.ts`
5. `generate-report.ts` (deployment: 754 lines, nextjs: 662 lines)
6. `health-check.ts`
7. `project-summary-report.ts`
8. `seed.ts`
9. `system-diagnostics.ts`
10. `test-api-connections.ts`

### Differences

The scripts are **functionally identical** (~95% code match). Main differences:
- **deployment/scripts/**: Contains extensive JSDoc documentation
- **nextjs_space/scripts/**: Contains minimal inline comments

Both versions:
- Use the same Prisma imports and queries
- Have identical core logic
- Produce the same outputs
- No environment-specific code

### Rationale for Duplication

The duplication exists to support two deployment scenarios:
1. **Docker deployment** (deployment/scripts) - Standalone VPS deployment
2. **Development/Next.js** (nextjs_space/scripts) - Application-integrated scripts

### Future Consolidation

To eliminate duplication, consider:
1. Create `shared/scripts/` with core implementations
2. Make both locations thin wrappers that import from shared
3. Keep deployment-specific documentation in deployment/
4. Estimated effort: 2-3 hours, Low risk

## Database Connection Patterns

### ✅ Recommended: Use Centralized Database Client

**For Next.js Application Code:**
```typescript
import { prisma } from '@/lib/db';

// Use prisma directly - includes connection pooling, retry logic
const users = await prisma.user.findMany();
```

**For Standalone Scripts:**
```typescript
import { getScriptPrismaClient, disconnectScriptPrisma } from '@/lib/script-db';

async function main() {
  const prisma = getScriptPrismaClient();
  
  try {
    // Your script logic
    const users = await prisma.user.findMany();
  } finally {
    await disconnectScriptPrisma();
  }
}
```

### ❌ Avoid: Direct PrismaClient Instantiation

```typescript
// DON'T DO THIS - bypasses connection pooling and centralized config
const prisma = new PrismaClient();
```

### Connection String Format

All database connections should use this format:
```
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&connection_limit=5&pool_timeout=10&connect_timeout=10"
```

**Required Parameters:**
- `schema=public` - PostgreSQL schema
- `connection_limit=5` - Max connections per client
- `pool_timeout=10` - Seconds to wait for connection
- `connect_timeout=10` - Seconds to establish connection

## API Connection Patterns

### Centralized Configuration

All API credentials and configurations are managed through:
1. **Environment Variables** (`.env` file)
2. **Service Registry** (`lib/service-registry.ts`)
3. **Encrypted Storage** (for dynamic API keys)

### Environment Variables

**Core Services:**
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# File Storage (AWS S3)
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="your-bucket"
AWS_FOLDER_PREFIX="cortexbuild/"

# AI Processing (AbacusAI)
ABACUSAI_API_KEY="..."
WEB_APP_ID="..."

# Email (SendGrid - Optional)
SENDGRID_API_KEY="..."
SENDGRID_FROM_EMAIL="..."
```

### ✅ Best Practices

1. **Never hardcode API keys or credentials**
   - ✅ Use `process.env.ABACUSAI_API_KEY`
   - ❌ Use `"sk-abc123def456"`

2. **Use centralized configuration**
   - ✅ Import from `lib/aws-config.ts`, `lib/auth-options.ts`
   - ❌ Inline `process.env` calls everywhere

3. **Handle missing credentials gracefully**
   ```typescript
   if (!process.env.AWS_BUCKET_NAME) {
     console.warn('S3 not configured, file uploads disabled');
     return null;
   }
   ```

4. **Use service registry for dynamic APIs**
   ```typescript
   import { getServiceStatus } from '@/lib/service-registry';
   const sendgrid = await getServiceStatus('sendgrid');
   ```

### Service Registry Pattern

For plug-and-play API integrations:

```typescript
// 1. Define service in service-registry.ts
const serviceDefinitions = {
  sendgrid: {
    name: 'SendGrid',
    category: 'EMAIL',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true }
    ]
  }
};

// 2. Use in application
import { getActiveConnection } from '@/lib/service-registry';
const connection = await getActiveConnection('sendgrid', orgId);
```

## Security Best Practices

### Credentials Management

1. **Seed Scripts**: Use `ADMIN_PASSWORD` environment variable
   ```typescript
   const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
   ```

2. **Never commit `.env` files**: Already in `.gitignore`
   ```
   .env
   .env.local
   deployment/.env
   ```

3. **Use `.env.example` as template**: Provides all required variables

### Encrypted Storage

For user-provided API keys:
```typescript
import { encryptCredentials, decryptCredentials } from '@/lib/encryption';

// Store encrypted
const encrypted = await encryptCredentials(apiKey);
await prisma.apiConnection.create({ 
  data: { credentials: encrypted } 
});

// Retrieve and decrypt
const connection = await prisma.apiConnection.findFirst();
const decrypted = await decryptCredentials(connection.credentials);
```

## Development Workflow

### Running Scripts

**In Development:**
```bash
cd nextjs_space
npx tsx scripts/health-check.ts
```

**In Docker:**
```bash
docker-compose exec app sh -c "npx tsx scripts/seed.ts"
```

### Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name description

# Apply migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

## Summary

- ✅ Use centralized database clients (`lib/db.ts`, `lib/script-db.ts`)
- ✅ All API keys via environment variables
- ✅ Service registry for dynamic API integrations
- ✅ Encrypted storage for user-provided credentials
- ⚠️ Script duplication exists but is documented
- ❌ Never hardcode credentials or API keys
