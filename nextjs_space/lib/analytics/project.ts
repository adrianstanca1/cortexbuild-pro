import { prisma } from '@/lib/db';

export async function getProjectStats(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      status: true,
      budget: true,
      startDate: true,
      endDate: true,
      _count: {
        select: { tasks: true }
      }
    }
  });

  return {
    total: projects.length,
    active: projects.filter(p => p.status === 'IN_PROGRESS').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    onHold: projects.filter(p => p.status === 'ON_HOLD').length,
    totalBudget: projects.reduce((sum, p) => sum + Number(p.budget || 0), 0)
  };
}

export async function getProjectAnalytics(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: {
      tasks: {
        where: { status: { not: 'COMPLETE' } }
      },
      rfis: true,
      submittals: true,
      changeOrders: true
    }
  });

  return projects.map(project => ({
    id: project.id,
    name: project.name,
    status: project.status,
    taskProgress: project.tasks.length,
    openRfis: project.rfis.filter(r => r.status === 'OPEN').length,
    pendingSubmittals: project.submittals.filter(s => s.status === 'SUBMITTED').length,
    pendingChangeOrders: project.changeOrders.filter(c => c.status === 'PENDING_APPROVAL').length
  }));
}

export async function getAllProjectsSummary(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      status: true,
      budget: true,
      startDate: true,
      endDate: true,
      manager: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return projects;
}

export async function getProductivityTrends(organizationId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tasks = await prisma.task.findMany({
    where: {
      project: { organizationId },
      updatedAt: { gte: thirtyDaysAgo }
    },
    select: {
      status: true,
      updatedAt: true
    }
  });

  const dailyCompleted = tasks
    .filter(t => t.status === 'COMPLETE')
    .reduce((acc, t) => {
      const date = t.updatedAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(dailyCompleted).map(([date, count]) => ({ date, count }));
}
