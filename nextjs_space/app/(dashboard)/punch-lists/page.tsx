import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { PunchListsClient } from './_components/punch-lists-client';

export const dynamic = "force-dynamic";

export default async function PunchListsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const [projects, punchLists, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true }
    }),
    prisma.punchList.findMany({
      where: { project: { organizationId: session.user.organizationId } },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        photos: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.teamMember.findMany({
      where: { organizationId: session.user.organizationId },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
  ]);

  return (
    <PunchListsClient
      punchLists={JSON.parse(JSON.stringify(punchLists))}
      projects={projects}
      teamMembers={teamMembers.map(tm => tm.user)}
    />
  );
}
