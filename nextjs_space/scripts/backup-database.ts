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

async function backupTasks(): Promise<TableBackup> {
  const data = await prisma.task.findMany();
  return { table: 'tasks', count: data.length, data };
}

async function backupTeamMembers(): Promise<TableBackup> {
  const data = await prisma.teamMember.findMany();
  return { table: 'teamMembers', count: data.length, data };
}

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

async function backupRFIs(): Promise<TableBackup> {
  const data = await prisma.rFI.findMany();
  return { table: 'rfis', count: data.length, data };
}

async function backupSubmittals(): Promise<TableBackup> {
  const data = await prisma.submittal.findMany();
  return { table: 'submittals', count: data.length, data };
}

async function backupChangeOrders(): Promise<TableBackup> {
  const data = await prisma.changeOrder.findMany();
  return { table: 'changeOrders', count: data.length, data };
}

async function backupDocuments(): Promise<TableBackup> {
  const data = await prisma.document.findMany();
  return { table: 'documents', count: data.length, data };
}

async function backupSafetyIncidents(): Promise<TableBackup> {
  const data = await prisma.safetyIncident.findMany();
  return { table: 'safetyIncidents', count: data.length, data };
}

async function backupDailyReports(): Promise<TableBackup> {
  const data = await prisma.dailyReport.findMany();
  return { table: 'dailyReports', count: data.length, data };
}

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
