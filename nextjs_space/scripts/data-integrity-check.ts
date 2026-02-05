/**
 * Data Integrity Check Script
 * Validates database relationships and data consistency
 * Usage: npx tsx --require dotenv/config scripts/data-integrity-check.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IntegrityIssue {
  type: 'warning' | 'error';
  entity: string;
  id: string;
  message: string;
}

async function runIntegrityCheck(): Promise<void> {
  console.log('\n========================================');
  console.log('  CortexBuild Pro - Data Integrity Check');
  console.log('========================================\n');
  
  const issues: IntegrityIssue[] = [];
  
  try {
    // 1. Check for orphaned tasks (tasks without valid projects)
    console.log('Checking tasks...');
    const tasks = await prisma.task.findMany({
      select: { id: true, title: true, projectId: true }
    });
    
    for (const task of tasks) {
      const project = await prisma.project.findUnique({ where: { id: task.projectId } });
      if (!project) {
        issues.push({
          type: 'error',
          entity: 'Task',
          id: task.id,
          message: `Task "${task.title}" references non-existent project ${task.projectId}`
        });
      }
    }

    // 2. Check for orphaned team members
    console.log('Checking team members...');
    const teamMembers = await prisma.teamMember.findMany({
      select: { id: true, userId: true, organizationId: true }
    });
    
    for (const member of teamMembers) {
      const user = await prisma.user.findUnique({ where: { id: member.userId } });
      if (!user) {
        issues.push({
          type: 'error',
          entity: 'TeamMember',
          id: member.id,
          message: `Team member references non-existent user ${member.userId}`
        });
      }
      
      const org = await prisma.organization.findUnique({ where: { id: member.organizationId } });
      if (!org) {
        issues.push({
          type: 'error',
          entity: 'TeamMember',
          id: member.id,
          message: `Team member references non-existent organization ${member.organizationId}`
        });
      }
    }

    // 3. Check for projects with invalid managers
    console.log('Checking projects...');
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, managerId: true, organizationId: true, budget: true }
    });
    
    for (const project of projects) {
      if (project.managerId) {
        const manager = await prisma.user.findUnique({ where: { id: project.managerId } });
        if (!manager) {
          issues.push({
            type: 'warning',
            entity: 'Project',
            id: project.id,
            message: `Project "${project.name}" has invalid manager ID ${project.managerId}`
          });
        }
      }
      
      // Check for negative budgets
      if (project.budget && project.budget < 0) {
        issues.push({
          type: 'warning',
          entity: 'Project',
          id: project.id,
          message: `Project "${project.name}" has negative budget: ${project.budget}`
        });
      }
    }

    // 4. Check for cost items with invalid amounts
    console.log('Checking cost items...');
    const costItems = await prisma.costItem.findMany({
      select: { id: true, description: true, estimatedAmount: true, actualAmount: true }
    });
    
    for (const item of costItems) {
      if (item.actualAmount > item.estimatedAmount * 2) {
        issues.push({
          type: 'warning',
          entity: 'CostItem',
          id: item.id,
          message: `Cost item "${item.description}" has actual (${item.actualAmount}) > 2x estimated (${item.estimatedAmount})`
        });
      }
    }

    // 5. Check for RFIs without valid projects
    console.log('Checking RFIs...');
    const rfis = await prisma.rFI.findMany({
      select: { id: true, number: true, projectId: true }
    });
    
    for (const rfi of rfis) {
      const project = await prisma.project.findUnique({ where: { id: rfi.projectId } });
      if (!project) {
        issues.push({
          type: 'error',
          entity: 'RFI',
          id: rfi.id,
          message: `RFI #${rfi.number} references non-existent project ${rfi.projectId}`
        });
      }
    }

    // 6. Check for duplicate RFI numbers within projects
    console.log('Checking for duplicate RFI numbers...');
    const rfisByProject = new Map<string, number[]>();
    for (const rfi of rfis) {
      const existing = rfisByProject.get(rfi.projectId) || [];
      if (existing.includes(rfi.number)) {
        issues.push({
          type: 'warning',
          entity: 'RFI',
          id: rfi.id,
          message: `Duplicate RFI number ${rfi.number} in project ${rfi.projectId}`
        });
      }
      existing.push(rfi.number);
      rfisByProject.set(rfi.projectId, existing);
    }

    // 7. Check for users without organizations
    console.log('Checking users...');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, organizationId: true, role: true }
    });
    
    for (const user of users) {
      if (!user.organizationId && user.role !== 'SUPER_ADMIN') {
        issues.push({
          type: 'warning',
          entity: 'User',
          id: user.id,
          message: `User ${user.email} has no organization assigned`
        });
      }
    }

    // 8. Check for safety incidents without reporters
    console.log('Checking safety incidents...');
    const incidents = await prisma.safetyIncident.findMany({
      select: { id: true, description: true, reportedById: true, status: true, severity: true }
    });
    
    for (const incident of incidents) {
      if (!incident.reportedById) {
        issues.push({
          type: 'warning',
          entity: 'SafetyIncident',
          id: incident.id,
          message: `Safety incident "${incident.description?.substring(0, 50)}..." has no reporter assigned`
        });
      }
    }

    // Print results
    console.log('\n----------------------------------------');
    console.log('INTEGRITY CHECK RESULTS');
    console.log('----------------------------------------\n');
    
    const errors = issues.filter(i => i.type === 'error');
    const warnings = issues.filter(i => i.type === 'warning');
    
    if (issues.length === 0) {
      console.log('✅ No integrity issues found. Database is healthy.');
    } else {
      if (errors.length > 0) {
        console.log(`\n🔴 ERRORS (${errors.length}):`);
        errors.forEach(e => {
          console.log(`  - [${e.entity}:${e.id}] ${e.message}`);
        });
      }
      
      if (warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
        warnings.forEach(w => {
          console.log(`  - [${w.entity}:${w.id}] ${w.message}`);
        });
      }
    }
    
    // Summary stats
    console.log('\n----------------------------------------');
    console.log('DATABASE STATISTICS');
    console.log('----------------------------------------');
    console.log(`Organizations: ${await prisma.organization.count()}`);
    console.log(`Users: ${await prisma.user.count()}`);
    console.log(`Team Members: ${await prisma.teamMember.count()}`);
    console.log(`Projects: ${await prisma.project.count()}`);
    console.log(`Tasks: ${await prisma.task.count()}`);
    console.log(`Documents: ${await prisma.document.count()}`);
    console.log(`RFIs: ${await prisma.rFI.count()}`);
    console.log(`Submittals: ${await prisma.submittal.count()}`);
    console.log(`Cost Items: ${await prisma.costItem.count()}`);
    console.log(`Safety Incidents: ${await prisma.safetyIncident.count()}`);
    console.log(`Activity Logs: ${await prisma.activityLog.count()}`);
    
    console.log('\n✅ Integrity check completed.');
    
  } catch {
    console.error('Error during integrity check:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runIntegrityCheck().catch(console.error);
