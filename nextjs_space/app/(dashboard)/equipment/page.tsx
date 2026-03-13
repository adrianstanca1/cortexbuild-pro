import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { EquipmentClient } from './_components/equipment-client';

export default async function EquipmentPage() {
  const bigintSafe = (obj: any) => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? Number(v) : v));


  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const [equipment, projects] = await Promise.all([
    prisma.equipment.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        currentProject: { select: { id: true, name: true } },
        _count: { select: { maintenanceLogs: true, usageLogs: true } }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true }
    })
  ]);

  return (
    <EquipmentClient
      equipment={bigintSafe(equipment)}
      projects={projects}
    />
  );
}
