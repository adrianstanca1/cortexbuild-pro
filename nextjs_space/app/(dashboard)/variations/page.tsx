import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { VariationsManagerClient } from './_components/variations-manager-client';

export default async function VariationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect('/login');

  const [projects, variations] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true, budget: true },
      orderBy: { name: 'asc' }
    }),
    prisma.changeOrder.findMany({
      where: {
        project: { organizationId }
      },
      include: {
        project: { select: { id: true, name: true, budget: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <VariationsManagerClient
      initialVariations={JSON.parse(JSON.stringify(variations))}
      projects={JSON.parse(JSON.stringify(projects))}
      userRole={session.user.role}
    />
  );
}
