import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { RFIsClient } from './_components/rfis-client';

export default async function RFIsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect('/login');

  const [projects, rfis, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.rFI.findMany({
      where: {
        project: { organizationId }
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { attachments: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.teamMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
  ]);

  return (
    <RFIsClient
      initialRFIs={JSON.parse(JSON.stringify(rfis))}
      projects={JSON.parse(JSON.stringify(projects))}
      teamMembers={JSON.parse(JSON.stringify(teamMembers))}
    />
  );
}
