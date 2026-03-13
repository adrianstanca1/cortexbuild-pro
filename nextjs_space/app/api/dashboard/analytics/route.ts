import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));




export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    if (type === 'resource-allocation') {
      // Get team members with their project assignments
      const teamMembers = await prisma.teamMember.findMany({
        where: { organizationId },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          projectAssignments: {
            include: {
              project: { select: { id: true, name: true, status: true } }
            }
          }
        }
      });

      // Get aggregated time entries for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [timeByUser, tasksByUser] = await Promise.all([
        // Aggregate time entries by user using database groupBy
        prisma.timeEntry.groupBy({
          by: ['userId'],
          where: {
            project: { organizationId },
            date: { gte: thirtyDaysAgo }
          },
          _sum: { hours: true }
        }),
        // Aggregate tasks by assignee using database groupBy
        prisma.task.groupBy({
          by: ['assigneeId', 'priority'],
          where: {
            project: { organizationId },
            status: { not: 'COMPLETE' },
            assigneeId: { not: null }
          },
          _count: { id: true }
        })
      ]);

      // Convert aggregated data to maps for quick lookup
      const userTimeMap: Record<string, number> = {};
      timeByUser.forEach(entry => {
        userTimeMap[entry.userId] = entry._sum.hours || 0;
      });

      const tasksByUserMap: Record<string, { total: number; critical: number }> = {};
      tasksByUser.forEach(task => {
        if (task.assigneeId) {
          if (!tasksByUserMap[task.assigneeId]) {
            tasksByUserMap[task.assigneeId] = { total: 0, critical: 0 };
          }
          tasksByUserMap[task.assigneeId].total += task._count.id;
          if (task.priority === 'CRITICAL' || task.priority === 'HIGH') {
            tasksByUserMap[task.assigneeId].critical += task._count.id;
          }
        }
      });

      const allocation = teamMembers.map(member => ({
        id: member.id,
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
        jobTitle: member.jobTitle,
        projectCount: member.projectAssignments.length,
        projects: member.projectAssignments.map(pa => ({
          id: pa.project.id,
          name: pa.project.name,
          status: pa.project.status
        })),
        hoursLast30Days: userTimeMap[member.user.id] || 0,
        activeTasks: tasksByUserMap[member.user.id]?.total || 0,
        criticalTasks: tasksByUserMap[member.user.id]?.critical || 0,
        utilizationRate: Math.min(100, ((userTimeMap[member.user.id] || 0) / 160) * 100) // Assuming 160 hours/month capacity
      }));

      return NextResponse.json(bigintSafe({ allocation }));
    }

    if (type === 'budget-summary') {
      const projects = await prisma.project.findMany({
        where: { organizationId },
        include: {
          costItems: true,
          changeOrders: { where: { status: 'APPROVED' } },
          progressClaims: { where: { status: 'APPROVED' } }
        }
      });

      const summary = projects.map(project => {
        const originalBudget = project.budget || 0;
        const approvedCOs = project.changeOrders.reduce((sum, co) => sum + (co.costChange || 0), 0);
        const revisedBudget = originalBudget + approvedCOs;
        const actualSpend = project.costItems.reduce((sum, ci) => sum + (ci.actualAmount || 0), 0);
        const estimatedSpend = project.costItems.reduce((sum, ci) => sum + (ci.estimatedAmount || 0), 0);
        const claimed = project.progressClaims.reduce((sum, pc) => sum + (pc.thisClaim || 0), 0);

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          originalBudget,
          approvedCOs,
          revisedBudget,
          actualSpend,
          estimatedSpend,
          claimed,
          variance: revisedBudget - actualSpend,
          variancePercent: revisedBudget > 0 ? ((revisedBudget - actualSpend) / revisedBudget) * 100 : 0,
          cpi: actualSpend > 0 ? estimatedSpend / actualSpend : 1
        };
      });

      const totals = summary.reduce((acc, p) => ({
        originalBudget: acc.originalBudget + p.originalBudget,
        revisedBudget: acc.revisedBudget + p.revisedBudget,
        actualSpend: acc.actualSpend + p.actualSpend,
        claimed: acc.claimed + p.claimed
      }), { originalBudget: 0, revisedBudget: 0, actualSpend: 0, claimed: 0 });

      return NextResponse.json(bigintSafe({ projects: summary, totals }));
    }

    if (type === 'schedule-health') {
      const projects = await prisma.project.findMany({
        where: { organizationId, status: 'IN_PROGRESS' },
        include: {
          tasks: { select: { status: true, dueDate: true, priority: true } },
          milestones: { select: { status: true, targetDate: true, percentComplete: true } }
        }
      });

      const health = projects.map(project => {
        const overdueTasks = project.tasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETE'
        ).length;
        const completedTasks = project.tasks.filter(t => t.status === 'COMPLETE').length;
        const totalTasks = project.tasks.length;

        const overdueMilestones = project.milestones.filter(m => 
          new Date(m.targetDate) < new Date() && m.status !== 'COMPLETED'
        ).length;
        const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length;
        const totalMilestones = project.milestones.length;

        // Calculate SPI
        const plannedProgress = totalMilestones > 0 
          ? project.milestones.filter(m => new Date(m.targetDate) <= new Date()).length / totalMilestones
          : totalTasks > 0 ? completedTasks / totalTasks : 0;
        const actualProgress = totalMilestones > 0
          ? completedMilestones / totalMilestones
          : totalTasks > 0 ? completedTasks / totalTasks : 0;
        const spi = plannedProgress > 0 ? actualProgress / plannedProgress : 1;

        let status = 'on-track';
        if (spi < 0.8) status = 'behind';
        else if (spi < 0.95) status = 'at-risk';
        else if (spi > 1.05) status = 'ahead';

        return {
          id: project.id,
          name: project.name,
          spi: Math.round(spi * 100) / 100,
          status,
          overdueTasks,
          overdueMilestones,
          taskProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          milestoneProgress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
          endDate: project.endDate
        };
      });

      return NextResponse.json(bigintSafe({ projects: health }));
    }

    // Default: overview stats
    const [projectCount, taskCount, rfiCount, safetyCount] = await Promise.all([
      prisma.project.count({ where: { organizationId, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { project: { organizationId }, status: { not: 'COMPLETE' } } }),
      prisma.rFI.count({ where: { project: { organizationId }, status: 'OPEN' } }),
      prisma.safetyIncident.count({ where: { project: { organizationId }, status: { in: ['OPEN', 'INVESTIGATING'] } } })
    ]);

    return NextResponse.json(bigintSafe({
      activeProjects: projectCount,
      pendingTasks: taskCount,
      openRFIs: rfiCount,
      openSafetyIncidents: safetyCount
    }));

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
