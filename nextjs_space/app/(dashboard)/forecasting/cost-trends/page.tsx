import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import CostTrendsClient from './_components/cost-trends-client';

export default async function CostTrendsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true }
  });

  // Fetch projects with budget data
  const projects = await prisma.project.findMany({
    where: {
      organizationId: user?.organizationId || undefined,
      status: { in: ['PLANNING', 'IN_PROGRESS'] }
    },
    select: {
      id: true,
      name: true,
      budget: true,
      status: true,
      startDate: true,
      endDate: true,
      _count: {
        select: {
          changeOrders: true,
          tasks: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Get portfolio-level cost data
  const changeOrders = await prisma.changeOrder.findMany({
    where: {
      project: {
        organizationId: user?.organizationId || undefined
      }
    },
    select: {
      id: true,
      costChange: true,
      status: true,
      createdAt: true,
      projectId: true
    }
  });

  const forecasts = await prisma.forecastEntry.findMany({
    where: {
      project: {
        organizationId: user?.organizationId || undefined
      }
    },
    orderBy: { forecastDate: 'desc' },
    take: 50,
    select: {
      id: true,
      projectId: true,
      forecastDate: true,
      originalBudget: true,
      currentBudget: true,
      forecastAtCompletion: true,
      actualCost: true,
      earnedValue: true,
      costPerformanceIndex: true,
      schedulePerformanceIndex: true
    }
  });

  // Calculate portfolio metrics
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const approvedChanges = changeOrders
    .filter(co => co.status === 'APPROVED')
    .reduce((sum, co) => sum + (co.costChange || 0), 0);
  const pendingChanges = changeOrders
    .filter(co => co.status === 'PENDING_APPROVAL')
    .reduce((sum, co) => sum + (co.costChange || 0), 0);

  const serializedData = JSON.parse(JSON.stringify({
    projects,
    changeOrders,
    forecasts,
    metrics: {
      totalBudget,
      approvedChanges,
      pendingChanges,
      currentBudget: totalBudget + approvedChanges,
      projectCount: projects.length
    }
  }));

  return <CostTrendsClient {...serializedData} />;
}
