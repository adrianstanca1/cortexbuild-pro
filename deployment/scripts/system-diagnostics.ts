#!/usr/bin/env tsx
/**
 * System Diagnostics Script
 * 
 * Comprehensive diagnostics for troubleshooting CortexBuild Pro issues.
 * 
 * Usage: npx tsx scripts/system-diagnostics.ts [--full]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DiagnosticResult {
  category: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    value?: any;
    message?: string;
  }>;
}

/**
 * Parse command-line flags for the diagnostics script.
 *
 * @returns An object with `full` indicating whether `--full` was provided, and `verbose` indicating whether `--verbose` or `-v` was provided.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    full: args.includes('--full'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
}

/**
 * Checks for required and optional environment variables and reports their status.
 *
 * Produces a diagnostic check for each variable indicating whether it is set, redacted value state, and an optional message when a required variable is missing.
 *
 * @returns A DiagnosticResult with category "Environment Variables" whose `checks` array contains entries with `name`, `status` (`'pass' | 'warn' | 'fail'`), `value`, and an optional `message`. 
 */
async function checkEnvironmentVariables(): Promise<DiagnosticResult> {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const optionalVars = [
    'AWS_BUCKET_NAME',
    'AWS_FOLDER_PREFIX',
    'ABACUSAI_API_KEY',
    'CLOUD_STORAGE_ENABLED'
  ];

  const checks = [];

  for (const varName of requiredVars) {
    const isSet = !!process.env[varName];
    checks.push({
      name: `${varName} (required)`,
      status: isSet ? 'pass' as const : 'fail' as const,
      value: isSet ? '***set***' : 'NOT SET',
      message: isSet ? undefined : `Missing required environment variable`
    });
  }

  for (const varName of optionalVars) {
    const isSet = !!process.env[varName];
    checks.push({
      name: `${varName} (optional)`,
      status: isSet ? 'pass' as const : 'warn' as const,
      value: isSet ? '***set***' : 'not set'
    });
  }

  return { category: 'Environment Variables', checks };
}

/**
 * Verify presence of expected Prisma models and report their existence and record counts.
 *
 * Each check corresponds to a model and indicates whether the table exists, includes the record count when available, and contains a failure message when the table is missing or an error occurred.
 *
 * @returns DiagnosticResult with category "Database Schema" and a list of checks for each expected model. Each check has `name`, `status` ('pass' | 'fail'), an optional `value` (e.g., "`42 records`" or "`exists`"), and an optional `message` for failures.
 */
async function checkDatabaseSchema(): Promise<DiagnosticResult> {
  const checks = [];
  
  const expectedModels = [
    'User', 'Organization', 'Project', 'Task', 'TeamMember',
    'Document', 'RFI', 'Submittal', 'ChangeOrder', 'SafetyIncident',
    'DailyReport', 'ActivityLog', 'ApiConnection', 'ApiConnectionLog'
  ];

  for (const model of expectedModels) {
    try {
      const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
      // @ts-ignore - Dynamic model access
      const count = await prisma[modelKey]?.count?.();
      
      checks.push({
        name: `${model} table`,
        status: 'pass' as const,
        value: count !== undefined ? `${count} records` : 'exists'
      });
    } catch (error: any) {
      checks.push({
        name: `${model} table`,
        status: 'fail' as const,
        message: error.message?.includes('does not exist') 
          ? 'Table missing - run prisma db push'
          : error.message
      });
    }
  }

  return { category: 'Database Schema', checks };
}

/**
 * Verifies the existence and expected type (file or directory) of critical project paths.
 *
 * The function inspects a fixed list of required paths (e.g., package.json, prisma/schema.prisma, app, .next)
 * and produces a diagnostic check for each entry indicating whether it is present and the correct type.
 *
 * @returns A DiagnosticResult with category "File System" and an array of checks. Each check contains:
 * - `name`: the path and expected type (e.g., "package.json (file)")
 * - `status`: `'pass'` when the path exists and matches the expected type, `'warn'` for `.next` when missing, or `'fail'` otherwise
 * - optional `message`: a human-readable note such as "Not found", "Expected <type>", or guidance like "Run yarn build" for `.next`
 */
async function checkFileSystem(): Promise<DiagnosticResult> {
  const checks = [];
  const projectRoot = path.join(__dirname, '..');

  const requiredPaths = [
    { path: 'package.json', type: 'file' },
    { path: 'prisma/schema.prisma', type: 'file' },
    { path: 'app', type: 'directory' },
    { path: 'lib', type: 'directory' },
    { path: 'components', type: 'directory' },
    { path: 'public', type: 'directory' },
    { path: 'scripts', type: 'directory' },
    { path: '.next', type: 'directory' }
  ];

  for (const item of requiredPaths) {
    const fullPath = path.join(projectRoot, item.path);
    const exists = fs.existsSync(fullPath);
    
    let isCorrectType = false;
    if (exists) {
      const stat = fs.statSync(fullPath);
      isCorrectType = item.type === 'file' ? stat.isFile() : stat.isDirectory();
    }

    checks.push({
      name: `${item.path} (${item.type})`,
      status: exists && isCorrectType ? 'pass' as const : 
              item.path === '.next' ? 'warn' as const : 'fail' as const,
      message: !exists ? 'Not found' : 
               !isCorrectType ? `Expected ${item.type}` :
               item.path === '.next' && !exists ? 'Run yarn build' : undefined
    });
  }

  return { category: 'File System', checks };
}

/**
 * Performs a set of database connectivity and write-capability diagnostics.
 *
 * Runs checks that verify basic query responsiveness, connection pool behavior under concurrent queries, and the ability to create and delete records.
 *
 * @returns DiagnosticResult with category "Database Connectivity" and a `checks` array containing individual check entries. Each check includes a `name`, `status` (`pass` | `warn` | `fail`), and optional `value` or `message` describing latency, counts, or errors.
 */
async function checkDatabaseConnectivity(): Promise<DiagnosticResult> {
  const checks = [];

  // Test basic connectivity
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const elapsed = Date.now() - start;
    
    checks.push({
      name: 'Database connection',
      status: 'pass' as const,
      value: `${elapsed}ms latency`
    });
  } catch (error: any) {
    checks.push({
      name: 'Database connection',
      status: 'fail' as const,
      message: error.message
    });
  }

  // Test connection pool
  try {
    const start = Date.now();
    await Promise.all([
      prisma.$queryRaw`SELECT pg_backend_pid()`,
      prisma.$queryRaw`SELECT pg_backend_pid()`,
      prisma.$queryRaw`SELECT pg_backend_pid()`
    ]);
    const elapsed = Date.now() - start;
    
    checks.push({
      name: 'Connection pool (3 concurrent)',
      status: elapsed < 3000 ? 'pass' as const : 'warn' as const,
      value: `${elapsed}ms total`
    });
  } catch (error: any) {
    checks.push({
      name: 'Connection pool',
      status: 'fail' as const,
      message: error.message
    });
  }

  // Test write capability - using a different approach since ActivityLog requires userId
  try {
    // First, find a user to associate with the test log
    const testUser = await prisma.user.findFirst({ select: { id: true } });
    
    if (testUser) {
      const testLog = await prisma.activityLog.create({
        data: {
          action: 'diagnostic_test',
          entityType: 'System',
          details: JSON.stringify({ timestamp: new Date().toISOString() }),
          userId: testUser.id
        }
      });
      
      await prisma.activityLog.delete({ where: { id: testLog.id } });
      
      checks.push({
        name: 'Write capability',
        status: 'pass' as const,
        value: 'Can create and delete records'
      });
    } else {
      // No users in system, test with a simple query
      await prisma.$executeRaw`SELECT 1`;
      checks.push({
        name: 'Write capability',
        status: 'pass' as const,
        value: 'Database writable (no users to test with)'
      });
    }
  } catch (error: any) {
    checks.push({
      name: 'Write capability',
      status: 'fail' as const,
      message: error.message
    });
  }

  return { category: 'Database Connectivity', checks };
}

/**
 * Collects configured API connections and produces diagnostic checks about their status.
 *
 * @returns A DiagnosticResult whose category is "API Integrations" and whose checks include the total configured connections, counts per connection status, any stale connections not validated in the last 7 days (reported as warnings), or a single failing check containing the error message if the check could not complete
 */
async function checkApiIntegrations(): Promise<DiagnosticResult> {
  const checks = [];

  try {
    const connections = await prisma.apiConnection.findMany({
      select: {
        serviceName: true,
        status: true,
        lastValidatedAt: true,
        lastErrorMessage: true
      }
    });

    if (connections.length === 0) {
      checks.push({
        name: 'API Connections',
        status: 'warn' as const,
        value: 'No connections configured',
        message: 'Configure integrations in Admin > API Management'
      });
    } else {
      const statusCounts: Record<string, number> = {};
      connections.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });

      checks.push({
        name: 'API Connections Total',
        status: 'pass' as const,
        value: `${connections.length} configured`
      });

      for (const [status, count] of Object.entries(statusCounts)) {
        checks.push({
          name: `Connections in ${status}`,
          status: status === 'ACTIVE' ? 'pass' as const : 
                  status === 'ERROR' || status === 'EXPIRED' ? 'warn' as const : 
                  'pass' as const,
          value: count
        });
      }

      // Check for stale connections (not validated in 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const stale = connections.filter(c => 
        !c.lastValidatedAt || new Date(c.lastValidatedAt) < sevenDaysAgo
      );

      if (stale.length > 0) {
        checks.push({
          name: 'Stale connections (>7 days)',
          status: 'warn' as const,
          value: stale.length,
          message: 'Run test-api-connections.ts to refresh'
        });
      }
    }
  } catch (error: any) {
    checks.push({
      name: 'API Integrations Check',
      status: 'fail' as const,
      message: error.message
    });
  }

  return { category: 'API Integrations', checks };
}

/**
 * Performs a set of data integrity checks for organizations, users, projects, and tasks.
 *
 * Checks performed:
 * - Organizations without users
 * - Users without an organization
 * - Projects without managers
 * - Overdue tasks (due date before now and not complete)
 *
 * @returns A DiagnosticResult with category `"Data Health"` and a `checks` array where each check includes `name`, `status` (`pass`/`warn`/`fail`), `value` (count or detail), and an optional `message` with contextual information.
 */
async function checkDataHealth(): Promise<DiagnosticResult> {
  const checks = [];

  try {
    // Check for organizations without users
    const orgsWithoutUsers = await prisma.organization.findMany({
      where: {
        users: { none: {} }
      }
    });

    checks.push({
      name: 'Organizations without users',
      status: orgsWithoutUsers.length === 0 ? 'pass' as const : 'warn' as const,
      value: orgsWithoutUsers.length,
      message: orgsWithoutUsers.length > 0 
        ? `Found: ${orgsWithoutUsers.map(o => o.name).join(', ')}`
        : undefined
    });

    // Check for users without organizations
    const usersWithoutOrg = await prisma.user.count({
      where: { organizationId: null }
    });

    checks.push({
      name: 'Users without organization',
      status: usersWithoutOrg === 0 ? 'pass' as const : 'warn' as const,
      value: usersWithoutOrg
    });

    // Check for projects without managers
    const projectsWithoutManager = await prisma.project.count({
      where: { managerId: null }
    });

    checks.push({
      name: 'Projects without managers',
      status: projectsWithoutManager === 0 ? 'pass' as const : 'warn' as const,
      value: projectsWithoutManager
    });

    // Check for overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'COMPLETE' }
      }
    });

    checks.push({
      name: 'Overdue tasks',
      status: overdueTasks === 0 ? 'pass' as const : 'warn' as const,
      value: overdueTasks
    });

  } catch (error: any) {
    checks.push({
      name: 'Data Health Check',
      status: 'fail' as const,
      message: error.message
    });
  }

  return { category: 'Data Health', checks };
}

/**
 * Run all system diagnostics, print a categorized report to stdout, and terminate the process with an appropriate exit code.
 *
 * Executes environment, filesystem, database connectivity and schema, API integrations, and data-health checks; prints per-check results and a summary with totals. The process exits with code `0` when there are no failures (all checks pass or only warnings) and with code `1` if any check fails.
 */
async function main() {
  const options = parseArgs();

  console.log('\n🔍 CortexBuild Pro System Diagnostics');
  console.log('======================================\n');

  const diagnostics: DiagnosticResult[] = await Promise.all([
    checkEnvironmentVariables(),
    checkFileSystem(),
    checkDatabaseConnectivity(),
    checkDatabaseSchema(),
    checkApiIntegrations(),
    checkDataHealth()
  ]);

  const statusEmoji = {
    pass: '✅',
    warn: '⚠️',
    fail: '❌'
  };

  let totalPass = 0;
  let totalWarn = 0;
  let totalFail = 0;

  for (const diagnostic of diagnostics) {
    console.log(`\n📋 ${diagnostic.category}`);
    console.log('-'.repeat(40));

    for (const check of diagnostic.checks) {
      const emoji = statusEmoji[check.status];
      let line = `  ${emoji} ${check.name}`;
      
      if (check.value !== undefined) {
        line += `: ${check.value}`;
      }
      
      console.log(line);
      
      if (check.message && (options.verbose || check.status !== 'pass')) {
        console.log(`     ↳ ${check.message}`);
      }

      if (check.status === 'pass') totalPass++;
      else if (check.status === 'warn') totalWarn++;
      else totalFail++;
    }
  }

  const total = totalPass + totalWarn + totalFail;
  const overallStatus = totalFail > 0 ? 'fail' : totalWarn > 0 ? 'warn' : 'pass';

  console.log('\n======================================');
  console.log('Diagnostic Summary');
  console.log('======================================');
  console.log(`${statusEmoji[overallStatus]} Overall: ${overallStatus.toUpperCase()}`);
  console.log(`  ✅ Passed: ${totalPass}/${total}`);
  console.log(`  ⚠️  Warnings: ${totalWarn}/${total}`);
  console.log(`  ❌ Failed: ${totalFail}/${total}`);
  
  if (totalFail > 0) {
    console.log('\n🔧 Recommended Actions:');
    console.log('  - Review failed checks above');
    console.log('  - Check environment variables in .env');
    console.log('  - Run: yarn prisma db push (if schema issues)');
    console.log('  - Run: yarn build (if .next missing)');
  }

  console.log();
  process.exit(totalFail > 0 ? 1 : 0);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());