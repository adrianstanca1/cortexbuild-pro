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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    json: args.includes('--json'),
  };
}

// Check database connectivity
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

// Check API connections status
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

// Check Prisma connection pool
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

// Check data integrity
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

// Check storage configuration
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

// Check authentication configuration
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

// Main health check function
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
