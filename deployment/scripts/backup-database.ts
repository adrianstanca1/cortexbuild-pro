#!/usr/bin/env tsx
/**
 * Database Backup Utility Script
 * 
 * Creates JSON backups of critical database tables for disaster recovery.
 * Note: For production, use proper PostgreSQL backup tools (pg_dump).
 * 
 * Usage: npx tsx scripts/backup-database.ts [--tables all|core|custom] [--output <path>]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupOptions {
  tables: 'all' | 'core' | 'custom';
  outputPath: string;
}

/**
 * Parse command-line flags and return backup configuration.
 *
 * Recognizes `--tables` (values: `all`, `core`, `custom`) and `--output`.
 *
 * @returns The resolved BackupOptions with `tables` (defaults to `core`) and `outputPath` (defaults to `./backups`).
 */
function parseArgs(): BackupOptions {
  const args = process.argv.slice(2);
  const options: BackupOptions = {
    tables: 'core',
    outputPath: './backups'
  };

  const tablesIdx = args.indexOf('--tables');
  if (tablesIdx !== -1 && args[tablesIdx + 1]) {
    const value = args[tablesIdx + 1];
    if (value === 'all' || value === 'core' || value === 'custom') {
      options.tables = value;
    }
  }

  const outputIdx = args.indexOf('--output');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    options.outputPath = args[outputIdx + 1];
  }

  return options;
}

interface TableBackup {
  table: string;
  count: number;
  data: any[];
}

/**
 * Creates a backup snapshot of the organizations table including counts of related users, projects, and team members.
 *
 * @returns A TableBackup object containing the table name `'organizations'`, the number of records, and the fetched data with related counts for `users`, `projects`, and `teamMembers`.
 */
async function backupOrganizations(): Promise<TableBackup> {
  const data = await prisma.organization.findMany({
    include: {
      _count: {
        select: { users: true, projects: true, teamMembers: true }
      }
    }
  });
  return { table: 'organizations', count: data.length, data };
}

/**
 * Exports all user records for backup, omitting password hashes.
 *
 * @returns A TableBackup object with `table` set to `'users'`, `count` equal to the number of exported records, and `data` containing the exported user records.
 */
async function backupUsers(): Promise<TableBackup> {
  const data = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
      phone: true,
      avatarUrl: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      // Exclude password hash for security
    }
  });
  return { table: 'users', count: data.length, data };
}

/**
 * Create a backup of all projects, including per-project counts for tasks, documents, and team members.
 *
 * @returns A `TableBackup` object with `table` set to `'projects'`, `count` equal to the number of projects backed up, and `data` containing the fetched project records
 */
async function backupProjects(): Promise<TableBackup> {
  const data = await prisma.project.findMany({
    include: {
      _count: {
        select: { tasks: true, documents: true, teamMembers: true }
      }
    }
  });
  return { table: 'projects', count: data.length, data };
}

/**
 * Exports all task records from the database.
 *
 * @returns A TableBackup object with `table` set to 'tasks', `count` equal to the number of task records exported, and `data` containing the exported task records
 */
async function backupTasks(): Promise<TableBackup> {
  const data = await prisma.task.findMany();
  return { table: 'tasks', count: data.length, data };
}

/**
 * Fetches all team member records and packages them as a table backup.
 *
 * @returns A `TableBackup` for the `teamMembers` table containing the number of records and the fetched records
 */
async function backupTeamMembers(): Promise<TableBackup> {
  const data = await prisma.teamMember.findMany();
  return { table: 'teamMembers', count: data.length, data };
}

/**
 * Exports API connection records while omitting sensitive credential fields.
 *
 * The returned `TableBackup` contains the table name 'apiConnections', the number of exported records, and the exported records with credential fields excluded.
 *
 * @returns A `TableBackup` object with `table` set to 'apiConnections', `count` equal to the number of records exported, and `data` containing the records without credentials.
 */
async function backupApiConnections(): Promise<TableBackup> {
  // Backup API connections but mask credentials
  const data = await prisma.apiConnection.findMany({
    select: {
      id: true,
      name: true,
      serviceName: true,
      type: true,
      environment: true,
      status: true,
      baseUrl: true,
      rateLimitInfo: true,
      lastValidatedAt: true,
      createdAt: true,
      updatedAt: true,
      createdById: true,
      // Exclude credentials for security
    }
  });
  return { table: 'apiConnections', count: data.length, data };
}

/**
 * Fetches all Request for Information (RFI) records from the database for backup.
 *
 * @returns An object with `table` set to 'rfis', `count` equal to the number of RFI records, and `data` containing the fetched RFI records.
 */
async function backupRFIs(): Promise<TableBackup> {
  const data = await prisma.rFI.findMany();
  return { table: 'rfis', count: data.length, data };
}

/**
 * Fetches all submittal records and prepares them for writing to the backup.
 *
 * @returns A TableBackup object containing the table name `'submittals'`, the number of records, and the fetched data array.
 */
async function backupSubmittals(): Promise<TableBackup> {
  const data = await prisma.submittal.findMany();
  return { table: 'submittals', count: data.length, data };
}

/**
 * Creates a backup of all change order records.
 *
 * @returns A TableBackup for the `changeOrders` table containing the number of records and the retrieved data
 */
async function backupChangeOrders(): Promise<TableBackup> {
  const data = await prisma.changeOrder.findMany();
  return { table: 'changeOrders', count: data.length, data };
}

/**
 * Fetches all document records from the database.
 *
 * @returns A TableBackup for the `documents` table containing `table`, `count`, and `data` (array of document records).
 */
async function backupDocuments(): Promise<TableBackup> {
  const data = await prisma.document.findMany();
  return { table: 'documents', count: data.length, data };
}

/**
 * Produces a backup snapshot of all safety incident records.
 *
 * @returns A TableBackup with `table` set to `'safetyIncidents'`, `count` equal to the number of records, and `data` containing the retrieved records.
 */
async function backupSafetyIncidents(): Promise<TableBackup> {
  const data = await prisma.safetyIncident.findMany();
  return { table: 'safetyIncidents', count: data.length, data };
}

/**
 * Fetches all daily report records for backup.
 *
 * @returns A TableBackup for `dailyReports` containing `count` (number of records) and `data` (the array of daily report records).
 */
async function backupDailyReports(): Promise<TableBackup> {
  const data = await prisma.dailyReport.findMany();
  return { table: 'dailyReports', count: data.length, data };
}

/**
 * Collects activity log records created within the last 30 days.
 *
 * @returns A `TableBackup` with `table` equal to `'activityLogs'`, `count` set to the number of records, and `data` containing the matching activity log entries ordered by `createdAt` descending.
 */
async function backupActivityLogs(): Promise<TableBackup> {
  // Only backup recent activity logs (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const data = await prisma.activityLog.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: 'desc' }
  });
  return { table: 'activityLogs', count: data.length, data };
}

/**
 * Orchestrates a JSON backup of selected database tables and writes per-table files and a manifest.
 *
 * Parses command-line options to determine the backup scope and output directory, creates a timestamped
 * backup folder, executes each table backup routine sequentially, writes each table's data as
 * <table>.json, and writes a manifest.json containing timestamp, scope, per-table counts, totalRecords,
 * and version. Logs progress and errors to the console.
 */
async function main() {
  const options = parseArgs();

  console.log('\n📦 CortexBuild Pro Database Backup');
  console.log('====================================\n');
  console.log(`Backup scope: ${options.tables}`);
  console.log(`Output path: ${options.outputPath}\n`);

  // Create output directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(options.outputPath, `backup-${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const coreTables = [
    backupOrganizations,
    backupUsers,
    backupProjects,
    backupTeamMembers,
    backupApiConnections
  ];

  const allTables = [
    ...coreTables,
    backupTasks,
    backupRFIs,
    backupSubmittals,
    backupChangeOrders,
    backupDocuments,
    backupSafetyIncidents,
    backupDailyReports,
    backupActivityLogs
  ];

  const tablesToBackup = options.tables === 'all' ? allTables : 
                         options.tables === 'core' ? coreTables : 
                         allTables;

  const results: TableBackup[] = [];
  let totalRecords = 0;

  console.log('Backing up tables...\n');

  for (const backupFn of tablesToBackup) {
    try {
      const result = await backupFn();
      results.push(result);
      totalRecords += result.count;

      // Write individual table backup
      const filePath = path.join(backupDir, `${result.table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2));
      
      console.log(`  ✅ ${result.table}: ${result.count} records`);
    } catch (error: any) {
      console.log(`  ❌ ${backupFn.name.replace('backup', '').toLowerCase()}: ${error.message}`);
    }
  }

  // Write manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    scope: options.tables,
    tables: results.map(r => ({ name: r.table, count: r.count })),
    totalRecords,
    version: '1.0.0'
  };

  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('\n====================================');
  console.log('Backup Complete!');
  console.log(`  📁 Location: ${backupDir}`);
  console.log(`  📊 Tables: ${results.length}`);
  console.log(`  📝 Records: ${totalRecords}`);
  console.log('\n⚠️  Note: For production backups, use pg_dump for full database exports.\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());