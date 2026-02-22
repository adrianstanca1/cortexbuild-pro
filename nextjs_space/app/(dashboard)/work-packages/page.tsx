import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { WorkPackagesClient } from './_components/work-packages-client';

export default async function WorkPackagesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  // Fetch projects for the dropdown
  const projects = await prisma.project.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Fetch team members for assignment
  const teamMembers = await prisma.teamMember.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });

  // Fetch cost codes for linking
  const costCodes = await prisma.costCode.findMany({
    where: { 
      organizationId: session.user.organizationId,
      projectId: null,
      isActive: true
    },
    select: { id: true, code: true, name: true, category: true },
    orderBy: { code: 'asc' }
  });

  return (
    <WorkPackagesClient 
      projects={projects}
      teamMembers={teamMembers.map(tm => ({
        id: tm.user.id,
        name: tm.user.name,
        email: tm.user.email
      }))}
      costCodes={costCodes}
    />
  );
}
