#!/usr/bin/env tsx
/**
 * Report Generation Script
 * 
 * Generates comprehensive reports for compliance, auditing, and analytics.
 * Supports multiple output formats: JSON, CSV, and summary text.
 * 
 * Usage: npx tsx scripts/generate-report.ts [--type <type>] [--format <format>] [--output <path>]
 * 
 * Report Types:
 *   - summary: Executive summary of all platform data
 *   - projects: Detailed project status report
 *   - users: User activity and access report
 *   - api-usage: API integration usage report
 *   - compliance: Full compliance/audit report
 *   - financial: Financial summary (budgets, change orders)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type ReportType = 'summary' | 'projects' | 'users' | 'api-usage' | 'compliance' | 'financial';
type OutputFormat = 'json' | 'csv' | 'txt';

interface ReportOptions {
  type: ReportType;
  format: OutputFormat;
  outputPath: string;
  organizationId?: string;
}

function parseArgs(): ReportOptions {
  const args = process.argv.slice(2);
  const options: ReportOptions = {
    type: 'summary',
    format: 'json',
    outputPath: './reports'
  };

  const typeIdx = args.indexOf('--type');
  if (typeIdx !== -1 && args[typeIdx + 1]) {
    const value = args[typeIdx + 1] as ReportType;
    if (['summary', 'projects', 'users', 'api-usage', 'compliance', 'financial'].includes(value)) {
      options.type = value;
    }
  }

  const formatIdx = args.indexOf('--format');
  if (formatIdx !== -1 && args[formatIdx + 1]) {
    const value = args[formatIdx + 1] as OutputFormat;
    if (['json', 'csv', 'txt'].includes(value)) {
      options.format = value;
    }
  }

  const outputIdx = args.indexOf('--output');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    options.outputPath = args[outputIdx + 1];
  }

  const orgIdx = args.indexOf('--org');
  if (orgIdx !== -1 && args[orgIdx + 1]) {
    options.organizationId = args[orgIdx + 1];
  }

  return options;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
}

// Generate executive summary report
async function generateSummaryReport(orgId?: string) {
  const where = orgId ? { organizationId: orgId } : {};

  const [orgs, users, projects, tasks, documents, rfis, submittals, changeOrders, safetyIncidents, apiConnections] =
    await Promise.all([
      prisma.organization.count(),
      prisma.user.count({ where }),
      prisma.project.count({ where }),
      prisma.task.count({ where: { project: where } }),
      prisma.document.count({ where: { project: where } }),
      prisma.rFI.count({ where: { project: where } }),
      prisma.submittal.count({ where: { project: where } }),
      prisma.changeOrder.count({ where: { project: where } }),
      prisma.safetyIncident.count({ where: { project: where } }),
      prisma.apiConnection.count()
    ]);

  const taskStatusCounts = await prisma.task.groupBy({
    by: ['status'],
    where: { project: where },
    _count: true
  });

  const projectStatusCounts = await prisma.project.groupBy({
    by: ['status'],
    where,
    _count: true
  });

  const recentActivity = await prisma.activityLog.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'Executive Summary',
    scope: orgId ? 'Single Organization' : 'Platform-wide',
    metrics: {
      organizations: orgs,
      totalUsers: users,
      totalProjects: projects,
      totalTasks: tasks,
      totalDocuments: documents,
      totalRFIs: rfis,
      totalSubmittals: submittals,
      totalChangeOrders: changeOrders,
      totalSafetyIncidents: safetyIncidents,
      apiIntegrations: apiConnections,
      recentActivityLast7Days: recentActivity
    },
    taskBreakdown: taskStatusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    projectBreakdown: projectStatusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>)
  };
}

// Generate detailed projects report
async function generateProjectsReport(orgId?: string) {
  const where = orgId ? { organizationId: orgId } : {};

  const projects = await prisma.project.findMany({
    where,
    include: {
      manager: { select: { name: true, email: true } },
      organization: { select: { name: true } },
      _count: {
        select: {
          tasks: true,
          documents: true,
          teamMembers: true,
          rfis: true,
          submittals: true,
          changeOrders: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const taskStats = await Promise.all(
    projects.map(async (p) => {
      const [completed, overdue] = await Promise.all([
        prisma.task.count({ where: { projectId: p.id, status: 'COMPLETE' } }),
        prisma.task.count({
          where: {
            projectId: p.id,
            status: { not: 'COMPLETE' },
            dueDate: { lt: new Date() }
          }
        })
      ]);
      return { projectId: p.id, completed, overdue };
    })
  );

  const statsMap = new Map(taskStats.map(s => [s.projectId, s]));

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'Projects Report',
    totalProjects: projects.length,
    projects: projects.map(p => {
      const budget = typeof p.budget === 'object' && p.budget !== null && 'toNumber' in p.budget
        ? (p.budget as any).toNumber()
        : Number(p.budget || 0);
      return {
        id: p.id,
        name: p.name,
        organization: p.organization.name,
        status: p.status,
        manager: p.manager?.name || 'Unassigned',
        managerEmail: p.manager?.email || '',
        budget: formatCurrency(budget),
        startDate: p.startDate?.toISOString().split('T')[0],
        endDate: p.endDate?.toISOString().split('T')[0],
        location: p.location || '',
        counts: p._count,
        taskCompletion: {
          total: p._count.tasks,
          completed: statsMap.get(p.id)?.completed || 0,
          overdue: statsMap.get(p.id)?.overdue || 0,
          completionRate: p._count.tasks > 0
            ? Math.round((statsMap.get(p.id)?.completed || 0) / p._count.tasks * 100)
            : 0
        },
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      };
    })
  };
}

// Generate user activity report
async function generateUsersReport(orgId?: string) {
  const where = orgId ? { organizationId: orgId } : {};

  const users = await prisma.user.findMany({
    where,
    include: {
      organization: { select: { name: true } },
      _count: {
        select: {
          assignedTasks: true,
          activities: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const roleBreakdown = await prisma.user.groupBy({
    by: ['role'],
    where,
    _count: true
  });

  // Consider users active if they logged in within last 30 days
  const activeUsers = users.filter(u =>
    u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  
  const recentlyActive = users.filter(u =>
    u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'User Activity Report',
    totalUsers: users.length,
    activeUsers,
    recentlyActiveUsers: recentlyActive,
    roleBreakdown: roleBreakdown.reduce((acc, item) => {
      acc[item.role] = item._count;
      return acc;
    }, {} as Record<string, number>),
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      organization: u.organization?.name || '',
      lastLogin: u.lastLogin?.toISOString() || 'Never',
      assignedTasks: u._count.assignedTasks,
      activityCount: u._count.activities,
      createdAt: u.createdAt.toISOString()
    }))
  };
}

// Generate API usage report
async function generateApiUsageReport() {
  const connections = await prisma.apiConnection.findMany({
    include: {
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 100
      },
      createdBy: { select: { name: true, email: true } }
    }
  });

  const statusCounts = await prisma.apiConnection.groupBy({
    by: ['status'],
    _count: true
  });

  const typeCounts = await prisma.apiConnection.groupBy({
    by: ['type'],
    _count: true
  });

  const recentLogs = await prisma.apiConnectionLog.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'API Usage Report',
    totalConnections: connections.length,
    actionsLast24Hours: recentLogs,
    statusBreakdown: statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    typeBreakdown: typeCounts.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>),
    connections: connections.map(c => ({
      id: c.id,
      name: c.name,
      serviceName: c.serviceName,
      type: c.type,
      environment: c.environment,
      status: c.status,
      baseUrl: c.baseUrl || '',
      rateLimitInfo: c.rateLimitInfo,
      lastValidated: c.lastValidatedAt?.toISOString() || 'Never',
      lastError: c.lastErrorMessage || '',
      createdBy: c.createdBy?.name || 'System',
      recentActionsCount: c.logs.length,
      createdAt: c.createdAt.toISOString()
    }))
  };
}

// Generate financial report
async function generateFinancialReport(orgId?: string) {
  const where = orgId ? { organizationId: orgId } : {};

  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      budget: true,
      status: true,
      organization: { select: { name: true } },
      changeOrders: {
        select: {
          costChange: true,
          status: true
        }
      }
    }
  });

  let totalBudget = 0;
  let totalApprovedChanges = 0;
  let totalPendingChanges = 0;

  const projectFinancials = projects.map(p => {
    const budget = typeof p.budget === 'object' && p.budget !== null && 'toNumber' in p.budget
      ? (p.budget as any).toNumber()
      : Number(p.budget || 0);
    
    const approvedChanges = p.changeOrders
      .filter(co => co.status === 'APPROVED')
      .reduce((sum, co) => {
        const costChange = typeof co.costChange === 'object' && co.costChange !== null && 'toNumber' in co.costChange
          ? (co.costChange as any).toNumber()
          : Number(co.costChange || 0);
        return sum + costChange;
      }, 0);
    
    const pendingChanges = p.changeOrders
      .filter(co => co.status === 'DRAFT' || co.status === 'PENDING_APPROVAL')
      .reduce((sum, co) => {
        const costChange = typeof co.costChange === 'object' && co.costChange !== null && 'toNumber' in co.costChange
          ? (co.costChange as any).toNumber()
          : Number(co.costChange || 0);
        return sum + costChange;
      }, 0);

    totalBudget += budget;
    totalApprovedChanges += approvedChanges;
    totalPendingChanges += pendingChanges;

    return {
      projectId: p.id,
      projectName: p.name,
      organization: p.organization.name,
      status: p.status,
      originalBudget: formatCurrency(budget),
      approvedChangeOrders: formatCurrency(approvedChanges),
      pendingChangeOrders: formatCurrency(pendingChanges),
      revisedBudget: formatCurrency(budget + approvedChanges),
      changeOrderCount: p.changeOrders.length
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'Financial Summary Report',
    scope: orgId ? 'Single Organization' : 'Platform-wide',
    summary: {
      totalOriginalBudget: formatCurrency(totalBudget),
      totalApprovedChanges: formatCurrency(totalApprovedChanges),
      totalPendingChanges: formatCurrency(totalPendingChanges),
      totalRevisedBudget: formatCurrency(totalBudget + totalApprovedChanges),
      projectsCount: projects.length,
      averageBudget: formatCurrency(projects.length > 0 ? totalBudget / projects.length : 0)
    },
    projects: projectFinancials
  };
}

// Generate compliance report
async function generateComplianceReport(orgId?: string) {
  const where = orgId ? { organizationId: orgId } : {};

  const [users, apiLogs, activityLogs, safetyIncidents] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLogin: true,
        createdAt: true
      }
    }),
    prisma.apiConnectionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        connection: { select: { serviceName: true } },
        performedBy: { select: { name: true, email: true } }
      }
    }),
    prisma.activityLog.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        user: { select: { name: true, email: true } }
      }
    }),
    prisma.safetyIncident.findMany({
      where: { project: where },
      include: {
        project: { select: { name: true } },
        reportedBy: { select: { name: true } }
      }
    })
  ]);

  const dormantUsers = users.filter(u =>
    !u.lastLogin || new Date(u.lastLogin) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );

  const criticalSafetyIncidents = safetyIncidents.filter(i => i.severity === 'CRITICAL');

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'Compliance & Audit Report',
    scope: orgId ? 'Single Organization' : 'Platform-wide',
    userAccessAudit: {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      dormantUsers: dormantUsers.length,
      dormantUsersList: dormantUsers.map(u => ({
        name: u.name,
        email: u.email,
        lastLogin: u.lastLogin?.toISOString() || 'Never',
        role: u.role
      }))
    },
    apiAuditTrail: {
      totalActions: apiLogs.length,
      actionsByType: apiLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentActions: apiLogs.slice(0, 50).map(log => ({
        service: log.connection?.serviceName || 'Unknown',
        action: log.action,
        result: log.testSuccess !== null ? (log.testSuccess ? 'SUCCESS' : 'FAILURE') : 'N/A',
        performedBy: log.performedBy?.email || 'System',
        timestamp: log.createdAt.toISOString()
      }))
    },
    activityAudit: {
      totalActivitiesLast30Days: activityLogs.length,
      actionBreakdown: activityLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    },
    safetyCompliance: {
      totalIncidents: safetyIncidents.length,
      criticalIncidents: criticalSafetyIncidents.length,
      incidentsBySeverity: safetyIncidents.reduce((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      criticalIncidentsList: criticalSafetyIncidents.map(i => ({
        description: i.description.substring(0, 100),
        project: i.project.name,
        reporter: i.reportedBy?.name || 'Unknown',
        date: i.incidentDate.toISOString(),
        status: i.status
      }))
    }
  };
}

// Convert report to CSV
function toCSV(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(h => {
        const val = item[h];
        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  // For non-array data, flatten to key-value pairs
  const flatten = (obj: any, prefix = ''): string[] => {
    const lines: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        lines.push(...flatten(val, fullKey));
      } else if (Array.isArray(val)) {
        lines.push(`${fullKey},"${val.length} items"`);
      } else {
        lines.push(`${fullKey},${val}`);
      }
    }
    return lines;
  };

  return 'Key,Value\n' + flatten(data).join('\n');
}

// Convert report to text summary
function toText(data: any, reportType: string): string {
  const lines: string[] = [
    '='.repeat(60),
    `CORTEXBUILD PRO - ${reportType.toUpperCase()}`,
    '='.repeat(60),
    `Generated: ${data.generatedAt}`,
    ''
  ];

  const formatValue = (key: string, val: any, indent = 0): string[] => {
    const prefix = '  '.repeat(indent);
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return [
        `${prefix}${key}:`,
        ...Object.entries(val).flatMap(([k, v]) => formatValue(k, v, indent + 1))
      ];
    } else if (Array.isArray(val)) {
      return [`${prefix}${key}: ${val.length} items`];
    } else {
      return [`${prefix}${key}: ${val}`];
    }
  };

  for (const [key, val] of Object.entries(data)) {
    if (key === 'generatedAt' || key === 'reportType') continue;
    lines.push(...formatValue(key, val));
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const options = parseArgs();

  console.log('\n📊 CortexBuild Pro Report Generator');
  console.log('=====================================\n');
  console.log(`Report type: ${options.type}`);
  console.log(`Output format: ${options.format}`);
  console.log(`Output path: ${options.outputPath}`);
  if (options.organizationId) {
    console.log(`Organization filter: ${options.organizationId}`);
  }
  console.log('');

  // Generate the report
  let reportData: any;
  switch (options.type) {
    case 'summary':
      reportData = await generateSummaryReport(options.organizationId);
      break;
    case 'projects':
      reportData = await generateProjectsReport(options.organizationId);
      break;
    case 'users':
      reportData = await generateUsersReport(options.organizationId);
      break;
    case 'api-usage':
      reportData = await generateApiUsageReport();
      break;
    case 'financial':
      reportData = await generateFinancialReport(options.organizationId);
      break;
    case 'compliance':
      reportData = await generateComplianceReport(options.organizationId);
      break;
    default:
      console.error(`Unknown report type: ${options.type}`);
      process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(options.outputPath)) {
    fs.mkdirSync(options.outputPath, { recursive: true });
  }

  // Format and write output
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${options.type}-report-${timestamp}.${options.format}`;
  const filepath = path.join(options.outputPath, filename);

  let content: string;
  switch (options.format) {
    case 'json':
      content = JSON.stringify(reportData, null, 2);
      break;
    case 'csv':
      // For CSV, export the main data array if present
      const mainArray = reportData.projects || reportData.users || reportData.connections;
      content = mainArray ? toCSV(mainArray) : toCSV(reportData);
      break;
    case 'txt':
      content = toText(reportData, options.type);
      break;
    default:
      content = JSON.stringify(reportData, null, 2);
  }

  fs.writeFileSync(filepath, content);

  console.log('✅ Report generated successfully!');
  console.log(`📁 File: ${filepath}`);
  console.log(`📝 Size: ${(content.length / 1024).toFixed(2)} KB\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
