import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { CertificationsClient } from './_components/certifications-client';

export default async function CertificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect('/login');
  }

  const [certifications, workers, projects] = await Promise.all([
    prisma.workerCertification.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        worker: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }]
    }),
    prisma.teamMember.findMany({
      where: { organizationId: session.user.organizationId },
      include: { user: { select: { id: true, name: true, email: true } } }
    }),
    prisma.project.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true }
    })
  ]);

  return (
    <CertificationsClient
      certifications={JSON.parse(JSON.stringify(certifications))}
      workers={JSON.parse(JSON.stringify(workers))}
      projects={projects}
    />
  );
}
