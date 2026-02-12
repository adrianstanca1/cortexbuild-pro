import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CostCodesClient } from './_components/cost-codes-client';

export default async function CostCodesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  // Fetch organization cost codes (library)
  const costCodes = await prisma.costCode.findMany({
    where: { 
      organizationId: session.user.organizationId,
      projectId: null
    },
    include: {
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true, level: true } },
      _count: {
        select: { workPackages: true, costItems: true, budgetLines: true }
      }
    },
    orderBy: { code: 'asc' }
  });

  return <CostCodesClient initialCostCodes={JSON.parse(JSON.stringify(costCodes))} />;
}
