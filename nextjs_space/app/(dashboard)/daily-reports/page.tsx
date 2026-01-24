import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { DailyReportsClient } from './_components/daily-reports-client';

export default async function DailyReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect('/login');

  const [projects, reports] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.dailyReport.findMany({
      where: {
        project: { organizationId }
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        photos: true
      },
      orderBy: { reportDate: 'desc' },
      take: 50
    })
  ]);

  return (
    <DailyReportsClient
      initialReports={JSON.parse(JSON.stringify(reports))}
      projects={JSON.parse(JSON.stringify(projects))}
    />
  );
}
