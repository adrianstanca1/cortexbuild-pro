import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { RiskRegisterClient } from './_components/risk-register-client';

export default async function RiskRegisterPage() {
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

  return (
    <RiskRegisterClient 
      projects={projects}
      teamMembers={teamMembers.map(tm => ({
        id: tm.user.id,
        name: tm.user.name,
        email: tm.user.email
      }))}
    />
  );
}
