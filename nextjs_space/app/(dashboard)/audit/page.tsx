import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { AuditLogViewer } from './_components/audit-log-viewer';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userRole = session.user.role;
  const organizationId = session.user.organizationId;

  // Only admins and super admins can access audit logs
  const allowedRoles = ['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'COMPANY_ADMIN'];
  if (!allowedRoles.includes(userRole)) {
    redirect('/dashboard');
  }

  // Fetch initial audit logs
  const where: Record<string, unknown> = {};
  if (organizationId && userRole !== 'SUPER_ADMIN') {
    where.user = { organizationId };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });

  const total = await prisma.auditLog.count({ where });

  // Get entity types and action types for filters
  const entityTypes = await prisma.auditLog.groupMany({
    by: ['entity'],
    _count: true,
    orderBy: { _count: { entity: 'desc' } },
    take: 20,
  });

  const actionTypes = await prisma.auditLog.groupMany({
    by: ['action'],
    _count: true,
    orderBy: { _count: { action: 'desc' } },
    take: 20,
  });

  return (
    <AuditLogViewer
      initialLogs={JSON.parse(JSON.stringify(logs))}
      initialTotal={total}
      entityTypes={JSON.parse(JSON.stringify(entityTypes))}
      actionTypes={JSON.parse(JSON.stringify(actionTypes))}
      userRole={userRole}
    />
  );
}
