/**
 * Project Summary Report Generator
 * Generates detailed PDF-ready summaries for construction projects
 * Usage: npx tsx --require dotenv/config scripts/project-summary-report.ts [projectId]
 */

import { PrismaClient } from '@prisma/client';
import { format, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

async function generateProjectReport(projectId?: string): Promise<void> {
  console.log('\n========================================');
  console.log('    CortexBuild Pro - Project Report');
  console.log('========================================\n');

  try {
    let projects;
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          organization: { select: { name: true } },
          manager: { select: { name: true, email: true } },
          tasks: { include: { assignee: { select: { name: true } } } },
          teamMembers: { include: { teamMember: { include: { user: { select: { name: true } } } } } },
          _count: { select: { tasks: true, documents: true } }
        }
      });
      projects = project ? [project] : [];
    } else {
      projects = await prisma.project.findMany({
        where: { status: 'IN_PROGRESS' },
        include: {
          organization: { select: { name: true } },
          manager: { select: { name: true, email: true } },
          tasks: { include: { assignee: { select: { name: true } } } },
          teamMembers: { include: { teamMember: { include: { user: { select: { name: true } } } } } },
          _count: { select: { tasks: true, documents: true } }
        },
        take: 10
      });
    }

    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }

    for (const project of projects) {
      await generateSingleProjectReport(project);
    }

  } catch {
    console.error('Error generating report:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function generateSingleProjectReport(project: any): Promise<void> {
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`PROJECT: ${project.name}`);
  console.log(`${'='.repeat(60)}\n`);

  // Fetch additional data
  const [rfis, submittals, safetyIncidents, costItems, changeOrders] = await Promise.all([
    prisma.rFI.findMany({ where: { projectId: project.id } }),
    prisma.submittal.findMany({ where: { projectId: project.id } }),
    prisma.safetyIncident.findMany({ where: { projectId: project.id } }),
    prisma.costItem.findMany({ where: { projectId: project.id } }),
    prisma.changeOrder.findMany({ where: { projectId: project.id } })
  ]);

  // Project Info
  console.log('PROJECT INFORMATION');
  console.log('-'.repeat(40));
  console.log(`Organization: ${project.organization?.name || 'N/A'}`);
  console.log(`Status: ${project.status}`);
  console.log(`Project Manager: ${project.manager?.name || 'Unassigned'}`);
  console.log(`Location: ${project.location || 'N/A'}`);
  console.log(`Client: ${project.clientName || 'N/A'}`);
  console.log(`Start Date: ${project.startDate ? format(new Date(project.startDate), 'dd MMM yyyy') : 'N/A'}`);
  console.log(`End Date: ${project.endDate ? format(new Date(project.endDate), 'dd MMM yyyy') : 'N/A'}`);
  
  if (project.startDate && project.endDate) {
    const totalDays = differenceInDays(new Date(project.endDate), new Date(project.startDate));
    const elapsed = differenceInDays(new Date(), new Date(project.startDate));
    const remaining = Math.max(0, differenceInDays(new Date(project.endDate), new Date()));
    const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
    console.log(`Duration: ${totalDays} days | Elapsed: ${elapsed} days | Remaining: ${remaining} days`);
    console.log(`Timeline Progress: ${progress}%`);
  }

  // Task Summary
  console.log('\nTASK SUMMARY');
  console.log('-'.repeat(40));
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETE').length;
  const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const todoTasks = tasks.filter((t: any) => t.status === 'TODO').length;
  const overdueTasks = tasks.filter((t: any) => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETE'
  ).length;
  const criticalTasks = tasks.filter((t: any) => t.priority === 'CRITICAL' && t.status !== 'COMPLETE').length;
  
  console.log(`Total Tasks: ${tasks.length}`);
  console.log(`  - Completed: ${completedTasks} (${tasks.length > 0 ? Math.round((completedTasks/tasks.length)*100) : 0}%)`);
  console.log(`  - In Progress: ${inProgressTasks}`);
  console.log(`  - To Do: ${todoTasks}`);
  console.log(`  - Overdue: ${overdueTasks}`);
  console.log(`  - Critical (Open): ${criticalTasks}`);

  // Budget Summary
  console.log('\nBUDGET SUMMARY');
  console.log('-'.repeat(40));
  const totalEstimated = costItems.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
  const totalActual = costItems.reduce((sum, c) => sum + (c.actualAmount || 0), 0);
  const totalCommitted = costItems.reduce((sum, c) => sum + (c.committedAmount || 0), 0);
  const variance = totalEstimated - totalActual;
  
  console.log(`Project Budget: £${(project.budget || 0).toLocaleString()}`);
  console.log(`Estimated Costs: £${totalEstimated.toLocaleString()}`);
  console.log(`Committed: £${totalCommitted.toLocaleString()}`);
  console.log(`Actual Spent: £${totalActual.toLocaleString()}`);
  console.log(`Variance: £${variance.toLocaleString()} (${variance >= 0 ? 'Under' : 'Over'} Budget)`);

  // Change Orders
  const approvedCOs = changeOrders.filter(c => c.status === 'APPROVED');
  const pendingCOs = changeOrders.filter(c => c.status === 'PENDING_APPROVAL');
  console.log(`\nChange Orders: ${changeOrders.length} total`);
  console.log(`  - Approved: ${approvedCOs.length} (Value: £${approvedCOs.reduce((s, c) => s + (c.costChange || 0), 0).toLocaleString()})`);
  console.log(`  - Pending: ${pendingCOs.length}`);

  // RFI Summary
  console.log('\nRFI SUMMARY');
  console.log('-'.repeat(40));
  const openRFIs = rfis.filter(r => r.status === 'OPEN' || r.status === 'DRAFT').length;
  const overdueRFIs = rfis.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'CLOSED').length;
  console.log(`Total RFIs: ${rfis.length}`);
  console.log(`  - Open: ${openRFIs}`);
  console.log(`  - Overdue: ${overdueRFIs}`);
  console.log(`  - Closed: ${rfis.filter(r => r.status === 'CLOSED').length}`);

  // Submittal Summary
  console.log('\nSUBMITTAL SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total Submittals: ${submittals.length}`);
  console.log(`  - Approved: ${submittals.filter(s => s.status === 'APPROVED').length}`);
  console.log(`  - Under Review: ${submittals.filter(s => s.status === 'UNDER_REVIEW').length}`);
  console.log(`  - Pending: ${submittals.filter(s => s.status === 'SUBMITTED').length}`);
  console.log(`  - Rejected: ${submittals.filter(s => s.status === 'REJECTED').length}`);

  // Safety Summary
  console.log('\nSAFETY SUMMARY');
  console.log('-'.repeat(40));
  const openIncidents = safetyIncidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const criticalIncidents = safetyIncidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
  console.log(`Total Incidents: ${safetyIncidents.length}`);
  console.log(`  - Open: ${openIncidents}`);
  console.log(`  - Critical/High Severity: ${criticalIncidents}`);
  console.log(`  - Resolved: ${safetyIncidents.filter(i => i.status === 'RESOLVED').length}`);

  // Team Summary
  console.log('\nTEAM SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Team Size: ${project.teamMembers?.length || 0} members`);
  console.log(`Documents: ${project._count?.documents || 0}`);

  // Recommendations
  console.log('\nRECOMMENDATIONS');
  console.log('-'.repeat(40));
  const recommendations: string[] = [];
  
  if (overdueTasks > 0) {
    recommendations.push(`⚠️  Address ${overdueTasks} overdue task(s) immediately`);
  }
  if (criticalTasks > 0) {
    recommendations.push(`🔴 Focus on ${criticalTasks} critical task(s)`);
  }
  if (overdueRFIs > 0) {
    recommendations.push(`📋 Resolve ${overdueRFIs} overdue RFI(s)`);
  }
  if (openIncidents > 0) {
    recommendations.push(`🛡️  Investigate ${openIncidents} open safety incident(s)`);
  }
  if (variance < 0) {
    recommendations.push(`💰 Budget overrun by £${Math.abs(variance).toLocaleString()} - review cost controls`);
  }
  if (pendingCOs.length > 3) {
    recommendations.push(`📝 ${pendingCOs.length} change orders pending approval - expedite review`);
  }
  
  if (recommendations.length === 0) {
    console.log('✅ Project is on track. No immediate actions required.');
  } else {
    recommendations.forEach(r => console.log(r));
  }

  console.log('\n');
}

// Main execution
const projectId = process.argv[2];
generateProjectReport(projectId).catch(console.error);
