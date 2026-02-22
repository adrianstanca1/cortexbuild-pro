import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { MaintenanceLogsManager } from '../_components/maintenance-logs-manager';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EquipmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const { id } = await params;

  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      currentProject: { select: { id: true, name: true } }
    }
  });

  if (!equipment) {
    redirect('/equipment');
  }

  if (equipment.organizationId !== session.user.organizationId) {
    redirect('/equipment');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/equipment">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Equipment
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{equipment.name}</h1>
        <p className="text-gray-500">Equipment #{equipment.equipmentNumber}</p>
      </div>

      <MaintenanceLogsManager 
        equipmentId={equipment.id} 
        equipmentName={equipment.name}
      />
    </div>
  );
}
