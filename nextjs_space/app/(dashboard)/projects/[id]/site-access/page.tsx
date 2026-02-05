import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import SiteAccessClient from './_components/site-access-client';

interface PageProps {
  params: { id: string };
}

export default async function SiteAccessPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true }
  });

  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      organizationId: user?.organizationId || undefined
    },
    select: {
      id: true,
      name: true,
      location: true
    }
  });

  if (!project) return notFound();

  // Fetch site access logs for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const accessLogs = await prisma.siteAccessLog.findMany({
    where: {
      projectId: params.id,
      accessTime: { gte: today }
    },
    orderBy: { accessTime: 'desc' },
    take: 100
  });

  // Get stats
  const entries = accessLogs.filter(log => log.accessType === 'ENTRY').length;
  const exits = accessLogs.filter(log => log.accessType === 'EXIT').length;

  const serializedLogs = JSON.parse(JSON.stringify(accessLogs));

  return (
    <SiteAccessClient
      project={project}
      accessLogs={serializedLogs}
      stats={{ entries, exits, onSite: Math.max(0, entries - exits) }}
    />
  );
}
