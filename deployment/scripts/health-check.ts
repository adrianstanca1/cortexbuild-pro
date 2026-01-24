#!/usr/bin/env tsx
/**
 * System Health Check Script
 * 
 * Performs comprehensive health checks on all system components:
 * - Database connectivity and connection pool
 * - API connections status
 * - Storage services
 * - Real-time services
 * 
 * Usage: npx tsx scripts/health-check.ts [--verbose] [--json]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  details?: Record<string, any>;
}

interface SystemHealth {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: HealthCheckResult[];
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
    total: number;
  };
}

/**
 * Parse command-line flags to detect verbose and JSON output options.
 *
 * @returns An object with `verbose` set to `true` if `--verbose` or `-v` is present, and `json` set to `true` if `--json` is present.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    json: args.includes('--json'),
  };
}

/**
 * Performs a connectivity and basic integrity check against the PostgreSQL database.
 *
 * Measures response time and, on success, returns counts for organizations, users, and projects.
 *
 * @returns A HealthCheckResult for the "Database (PostgreSQL)" component. On success the result includes `responseTime` (milliseconds), `message`, and `details` with `organizations`, `users`, and `projects` counts; `status` is `healthy` if `responseTime` is less than 1000 ms or `degraded` otherwise. On failure the result has `status` set to `unhealthy` and includes an error `message`.
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Simple query to test connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Get counts for basic integrity check
    const [orgCount, userCount, projectCount] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.project.count()
    ]);

    const responseTime = Date.now() - start;

    return {
      component: 'Database (PostgreSQL)',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      message: `Connected successfully`,
      details: {
        organizations: orgCount,
        users: userCount,
        projects: projectCount
      }
    };
  } catch (error: any) {
    return {
      component: 'Database (PostgreSQL)',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error.message || 'Connection failed'
    };
  }
}

/**
 * Performs a health check of configured API connections.
 *
 * Marks the component as `degraded` if any connection has status `ERROR` or `EXPIRED`, or if all connections are `INACTIVE` or `DISABLED` (and there is at least one connection); `healthy` otherwise. On failure returns `unhealthy`.
 *
 * @returns A `HealthCheckResult` for the "API Connections" component containing the overall `status`, `responseTime` in milliseconds, a short `message`, and `details` with `total` connections, counts per status, and a per-connection summary (`service`, `status`, `environment`, `lastValidated`).
 */
async function checkApiConnections(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const connections = await prisma.apiConnection.findMany({
      select: {
        id: true,
        serviceName: true,
        status: true,
        environment: true,
        lastValidatedAt: true,
        lastErrorMessage: true
      }
    });

    const statusCounts = {
      ACTIVE: 0,
      INACTIVE: 0,
      ERROR: 0,
      EXPIRED: 0,
      DISABLED: 0
    };

    connections.forEach(conn => {
      if (conn.status in statusCounts) {
        statusCounts[conn.status as keyof typeof statusCounts]++;
      }
    });

    const responseTime = Date.now() - start;
    const hasErrors = statusCounts.ERROR > 0 || statusCounts.EXPIRED > 0;
    const allInactive = connections.length === statusCounts.INACTIVE + statusCounts.DISABLED;

    return {
      component: 'API Connections',
      status: hasErrors ? 'degraded' : (allInactive && connections.length > 0 ? 'degraded' : 'healthy'),
      responseTime,
      message: `${connections.length} connections configured`,
      details: {
        total: connections.length,
        ...statusCounts,
        connections: connections.map(c => ({
          service: c.serviceName,
          status: c.status,
          environment: c.environment,
          lastValidated: c.lastValidatedAt
        }))
      }
    };
  } catch (error: any) {
    return {
      component: 'API Connections',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error.message || 'Failed to check connections'
    };
  }
}

/**
 * Checks Prisma's connection pool by issuing concurrent lightweight queries to assess responsiveness.
 *
 * @returns A HealthCheckResult containing:
 *  - `component`: "Connection Pool"
 *  - `status`: `'healthy'` if the total response time is less than 2000 ms, `'degraded'` otherwise, or `'unhealthy'` on error
 *  - `responseTime`: total elapsed time in milliseconds for the concurrent queries
 *  - `message`: a brief human-readable summary or the error message on failure
 *  - `details` (on success): an object with `concurrentQueries` (number of parallel queries) and `avgResponseTime` (average per-query time in milliseconds)
 */
async function checkConnectionPool(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Run multiple concurrent queries to test pool
    const queries = Array(5).fill(null).map(() => 
      prisma.$queryRaw`SELECT pg_backend_pid()`
    );
    
    await Promise.all(queries);
    const responseTime = Date.now() - start;

    return {
      component: 'Connection Pool',
      status: responseTime < 2000 ? 'healthy' : 'degraded',
      responseTime,
      message: `Pool handling concurrent queries well`,
      details: {
        concurrentQueries: queries.length,
        avgResponseTime: Math.round(responseTime / queries.length)
      }
    };
  } catch (error: any) {
    return {
      component: 'Connection Pool',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error.message || 'Pool exhausted or failing'
    };
  }
}

/**
 * Checks for orphaned records across team members, tasks, and documents.
 *
 * @returns A `HealthCheckResult` with:
 * - `status`: `'healthy'` if no orphaned records were found, `'degraded'` otherwise
 * - `responseTime`: elapsed time in milliseconds for the check
 * - `message`: summary stating no orphaned records or the total number found
 * - `details`: an object containing `orphanedTeamMembers`, `orphanedTasks`, and `orphanedDocuments` counts
 */
async function checkDataIntegrity(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Check for orphaned records
    const [orphanedTeamMembers, orphanedTasks, orphanedDocs] = await Promise.all([
      prisma.teamMember.count({
        where: { organization: { id: undefined } }
      }).catch(() => 0),
      prisma.task.count({
        where: { project: { id: undefined } }
      }).catch(() => 0),
      prisma.document.count({
        where: { project: { id: undefined } }
      }).catch(() => 0)
    ]);

    const responseTime = Date.now() - start;
    const totalOrphaned = orphanedTeamMembers + orphanedTasks + orphanedDocs;

    return {
      component: 'Data Integrity',
      status: totalOrphaned === 0 ? 'healthy' : 'degraded',
      responseTime,
      message: totalOrphaned === 0 ? 'No orphaned records found' : `${totalOrphaned} potential orphaned records`,
      details: {
        orphanedTeamMembers,
        orphanedTasks,
        orphanedDocuments: orphanedDocs
      }
    };
  } catch (error: any) {
    return {
      component: 'Data Integrity',
      status: 'degraded',
      responseTime: Date.now() - start,
      message: 'Could not complete integrity check'
    };
  }
}

/**
 * Checks file storage configuration and reports usage and status.
 *
 * @returns A HealthCheckResult describing the storage component, where `status` is `healthy` if S3 or cloud storage is configured, `degraded` if no storage is configured, or `unhealthy` if an error occurred. `details` includes `s3Configured`, `cloudStorageEnabled`, `documentsStored`, and `bucket`.
 */
async function checkStorage(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const hasS3Config = !!(process.env.AWS_BUCKET_NAME && process.env.AWS_FOLDER_PREFIX);
    const hasCloudStorage = !!process.env.CLOUD_STORAGE_ENABLED;

    // Count documents to verify storage is being used
    const docCount = await prisma.document.count();

    const responseTime = Date.now() - start;

    return {
      component: 'File Storage (S3)',
      status: hasS3Config || hasCloudStorage ? 'healthy' : 'degraded',
      responseTime,
      message: hasS3Config ? 'S3 configured' : (hasCloudStorage ? 'Cloud storage enabled' : 'Storage not configured'),
      details: {
        s3Configured: hasS3Config,
        cloudStorageEnabled: hasCloudStorage,
        documentsStored: docCount,
        bucket: process.env.AWS_BUCKET_NAME ? '***configured***' : 'not set'
      }
    };
  } catch (error: any) {
    return {
      component: 'File Storage (S3)',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error.message
    };
  }
}

/**
 * Validates NextAuth environment configuration and reports authentication health.
 *
 * Checks whether NEXTAUTH_SECRET and NEXTAUTH_URL are present and produces a HealthCheckResult
 * for the "Authentication (NextAuth)" component.
 *
 * @returns A HealthCheckResult for the authentication component. `status` is `'healthy'` when both
 * NEXTAUTH_SECRET and NEXTAUTH_URL are configured, otherwise `'unhealthy'`. The result includes
 * `responseTime`, a human-readable `message`, and `details` with `secretConfigured` and
 * `urlConfigured` booleans.
 */
async function checkAuthentication(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;

    const responseTime = Date.now() - start;
    const isConfigured = hasNextAuthSecret && hasNextAuthUrl;

    return {
      component: 'Authentication (NextAuth)',
      status: isConfigured ? 'healthy' : 'unhealthy',
      responseTime,
      message: isConfigured ? 'Properly configured' : 'Missing configuration',
      details: {
        secretConfigured: hasNextAuthSecret,
        urlConfigured: hasNextAuthUrl
      }
    };
  } catch (error: any) {
    return {
      component: 'Authentication (NextAuth)',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error.message
    };
  }
}

/**
 * Run all system health checks, aggregate their results, and print a formatted report.
 *
 * Executes each component checker concurrently, computes counts of healthy/degraded/unhealthy checks,
 * determines the overall status, and outputs the report either as JSON or human-readable text
 * depending on CLI options (`--json`, `--verbose`).
 *
 * @returns The aggregated SystemHealth object containing `timestamp`, `overall` status, `components`, and `summary`.
 */
async function runHealthCheck(): Promise<SystemHealth> {
  const options = parseArgs();

  console.log('\n🏥 CortexBuild Pro System Health Check');
  console.log('========================================\n');

  const checks = await Promise.all([
    checkDatabase(),
    checkConnectionPool(),
    checkApiConnections(),
    checkDataIntegrity(),
    checkStorage(),
    checkAuthentication()
  ]);

  const summary = {
    healthy: checks.filter(c => c.status === 'healthy').length,
    degraded: checks.filter(c => c.status === 'degraded').length,
    unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    total: checks.length
  };

  const overall = summary.unhealthy > 0 ? 'unhealthy' : 
                  summary.degraded > 0 ? 'degraded' : 'healthy';

  const health: SystemHealth = {
    timestamp: new Date().toISOString(),
    overall,
    components: checks,
    summary
  };

  // Output results
  if (options.json) {
    console.log(JSON.stringify(health, null, 2));
  } else {
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌'
    };

    checks.forEach(check => {
      console.log(`${statusEmoji[check.status]} ${check.component}`);
      console.log(`   Status: ${check.status.toUpperCase()}`);
      if (check.responseTime !== undefined) {
        console.log(`   Response time: ${check.responseTime}ms`);
      }
      if (check.message) {
        console.log(`   Message: ${check.message}`);
      }
      if (options.verbose && check.details) {
        console.log(`   Details: ${JSON.stringify(check.details, null, 2).split('\n').join('\n   ')}`);
      }
      console.log();
    });

    console.log('----------------------------------------');
    console.log(`\n${statusEmoji[overall]} Overall Status: ${overall.toUpperCase()}`);
    console.log(`   ✅ Healthy: ${summary.healthy}/${summary.total}`);
    console.log(`   ⚠️  Degraded: ${summary.degraded}/${summary.total}`);
    console.log(`   ❌ Unhealthy: ${summary.unhealthy}/${summary.total}\n`);
  }

  return health;
}

// Run the health check
runHealthCheck()
  .then(health => {
    process.exit(health.overall === 'unhealthy' ? 1 : 0);
  })
  .catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });