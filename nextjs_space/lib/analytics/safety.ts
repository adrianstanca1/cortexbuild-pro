import { prisma } from '@/lib/db';

export async function getSafetyMetrics(organizationId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [incidents, toolboxTalks, mewpChecks] = await Promise.all([
    prisma.safetyIncident.findMany({
      where: {
        project: { organizationId },
        incidentDate: { gte: thirtyDaysAgo }
      }
    }),
    prisma.toolboxTalk.findMany({
      where: {
        project: { organizationId },
        createdAt: { gte: thirtyDaysAgo }
      }
    }),
    prisma.mEWPWeeklyCheck.findMany({
      where: {
        project: { organizationId },
        createdAt: { gte: thirtyDaysAgo }
      }
    })
  ]);

  const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');

  return {
    totalIncidents: incidents.length,
    criticalIncidents: criticalIncidents.length,
    incidentsThisMonth: incidents.length,
    toolboxTalksConducted: toolboxTalks.length,
    mewpChecksCompleted: mewpChecks.length,
    daysSinceLastIncident: incidents.length > 0 
      ? Math.floor((Date.now() - new Date(incidents[0].incidentDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999
  };
}

export async function getSafetyTrends(organizationId: string) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const incidents = await prisma.safetyIncident.findMany({
    where: {
      project: { organizationId },
      incidentDate: { gte: ninetyDaysAgo }
    },
    select: {
      severity: true,
      incidentDate: true
    },
    orderBy: { incidentDate: 'asc' }
  });

  const monthlyIncidents = incidents.reduce((acc, i) => {
    const month = i.incidentDate.toISOString().substring(0, 7);
    if (!acc[month]) acc[month] = { minor: 0, moderate: 0, major: 0 };
    if (i.severity === 'LOW' || i.severity === 'MINOR') acc[month].minor++;
    else if (i.severity === 'MEDIUM' || i.severity === 'MODERATE') acc[month].moderate++;
    else acc[month].major++;
    return acc;
  }, {} as Record<string, { minor: number; moderate: number; major: number }>);

  return Object.entries(monthlyIncidents).map(([month, data]) => ({
    month,
    ...data
  }));
}
