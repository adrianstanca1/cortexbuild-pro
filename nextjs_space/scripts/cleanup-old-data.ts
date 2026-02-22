/**
 * Cleanup Script for CortexBuild Pro
 * 
 * This script removes old activity logs and stale data from the database.
 * Use with caution in production environments.
 * 
 * Usage: npx tsx scripts/cleanup-old-data.ts [--dry-run] [--days 90]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CleanupOptions {
  dryRun: boolean;
  retentionDays: number;
}

function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2);
  const options: CleanupOptions = {
    dryRun: args.includes('--dry-run'),
    retentionDays: 90
  };

  const daysIndex = args.indexOf('--days');
  if (daysIndex !== -1 && args[daysIndex + 1]) {
    options.retentionDays = parseInt(args[daysIndex + 1], 10);
  }

  return options;
}

async function cleanupActivityLogs(options: CleanupOptions) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - options.retentionDays);

  console.log(`\n📋 Activity Logs Cleanup`);
  console.log(`   Retention period: ${options.retentionDays} days`);
  console.log(`   Cutoff date: ${cutoffDate.toISOString()}`);

  const count = await prisma.activityLog.count({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });

  console.log(`   Found ${count} old activity logs to delete`);

  if (!options.dryRun && count > 0) {
    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    console.log(`   ✓ Deleted ${result.count} activity logs`);
  } else if (options.dryRun) {
    console.log(`   [DRY RUN] Would delete ${count} activity logs`);
  }
}

async function cleanupOrphanedAttachments(options: CleanupOptions) {
  console.log(`\n📎 Orphaned Attachments Check`);

  // Find orphaned RFI attachments (without associated RFI)
  const orphanedRFIAttachments = await prisma.rFIAttachment.count({
    where: { rfiId: '' }
  });

  // Find orphaned Submittal attachments
  const orphanedSubmittalAttachments = await prisma.submittalAttachment.count({
    where: { submittalId: '' }
  });

  const totalOrphaned = orphanedRFIAttachments + orphanedSubmittalAttachments;
  console.log(`   Found ${totalOrphaned} orphaned attachments (${orphanedRFIAttachments} RFI, ${orphanedSubmittalAttachments} Submittal)`);

  if (!options.dryRun && totalOrphaned > 0) {
    console.log(`   Note: Orphaned attachments cleanup requires manual verification`);
  } else if (options.dryRun) {
    console.log(`   [DRY RUN] Would review ${totalOrphaned} attachments`);
  }
}

async function generateCleanupReport(options: CleanupOptions) {
  console.log(`\n📊 Database Statistics`);
  
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.document.count(),
    prisma.activityLog.count(),
    prisma.rFI.count(),
    prisma.submittal.count(),
    prisma.changeOrder.count(),
    prisma.dailyReport.count(),
    prisma.safetyIncident.count()
  ]);

  const labels = [
    'Users', 'Organizations', 'Projects', 'Tasks', 'Documents',
    'Activity Logs', 'RFIs', 'Submittals', 'Change Orders',
    'Daily Reports', 'Safety Incidents'
  ];

  console.log('\n   Current Record Counts:');
  labels.forEach((label, i) => {
    console.log(`   - ${label}: ${stats[i]}`);
  });
}

async function main() {
  const options = parseArgs();

  console.log('\n🧹 CortexBuild Pro - Database Cleanup Script');
  console.log('==========================================');
  
  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No data will be deleted');
  }

  try {
    await generateCleanupReport(options);
    await cleanupActivityLogs(options);
    await cleanupOrphanedAttachments(options);

    console.log('\n✅ Cleanup completed successfully');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
