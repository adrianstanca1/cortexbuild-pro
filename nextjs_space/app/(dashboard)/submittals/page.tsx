import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { SubmittalsClient } from './_components/submittals-client';

export default async function SubmittalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect('/login');

  const [projects, submittals, teamMembers] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.submittal.findMany({
      where: {
        project: { organizationId }
      },
      include: {
        project: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
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
    <SubmittalsClient
      initialSubmittals={JSON.parse(JSON.stringify(submittals))}
      projects={JSON.parse(JSON.stringify(projects))}
      teamMembers={JSON.parse(JSON.stringify(teamMembers))}
    />
  );
}
