import { prisma } from '@/lib/db';

export async function getBudgetOverview(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      budget: true,
      spent: true
    }
  });

  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + Number(p.spent || 0), 0);

  return {
    totalBudget,
    totalSpent,
    remaining: totalBudget - totalSpent,
    utilizationPercent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  };
}

export async function getBudgetByCategory(organizationId: string) {
  const costCodes = await prisma.costCode.findMany({
    where: { organizationId },
    include: {
      costItems: true
    }
  });

  return costCodes.map(code => ({
    id: code.id,
    name: code.name,
    code: code.code,
    budget: Number(code.budget || 0),
    spent: code.costItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }));
}

export async function getProjectBudgetSummary(organizationId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      budget: true,
      spent: true,
      forecast: true
    },
    orderBy: { budget: 'desc' }
  });

  return projects.map(project => ({
    id: project.id,
    name: project.name,
    budget: Number(project.budget || 0),
    spent: Number(project.spent || 0),
    forecast: Number(project.forecast || 0),
    variance: Number(project.budget || 0) - Number(project.spent || 0),
    variancePercent: Number(project.budget || 0) > 0 
      ? ((Number(project.budget || 0) - Number(project.spent || 0)) / Number(project.budget || 0)) * 100 
      : 0
  }));
}
