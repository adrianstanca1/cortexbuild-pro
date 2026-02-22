import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ForecastingClient } from './_components/forecasting-client';

export default async function ForecastingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  // Fetch projects for the dropdown
  const projects = await prisma.project.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true, budget: true, startDate: true, endDate: true },
    orderBy: { name: 'asc' }
  });

  return <ForecastingClient projects={JSON.parse(JSON.stringify(projects))} />;
}
