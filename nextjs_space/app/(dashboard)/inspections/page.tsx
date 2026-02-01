import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { InspectionsClient } from './_components/inspections-client';

export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const [projects, inspections] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true }
    }),
    prisma.inspection.findMany({
      where: { project: { organizationId: session.user.organizationId } },
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        _count: { select: { checklistItems: true, photos: true } }
      },
      orderBy: { scheduledDate: 'desc' }
    })
  ]);

  return (
    <InspectionsClient
      inspections={JSON.parse(JSON.stringify(inspections))}
      projects={projects}
    />
  );
}
