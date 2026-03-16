import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { DayworkManager } from '@/components/dashboard/DayworkManager';

export default async function DayworksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const organizationId = session.user.organizationId;
  if (!organizationId) redirect('/login');

  // Fetch real projects from the database
  const projects = await prisma.project.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Daywork Manager
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Create and manage daily work reports for your projects
        </p>
      </div>

      {/* Daywork Manager Component */}
      <DayworkManager projects={projects} />
    </div>
  );
}
