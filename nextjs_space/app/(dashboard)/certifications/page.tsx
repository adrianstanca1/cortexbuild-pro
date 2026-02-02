import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import CertificationsClient from './_components/certifications-client';

export default async function CertificationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    redirect('/login');
  }

  // Fetch certifications and team members
  const [certifications, teamMembers, stats] = await Promise.all([
    prisma.workerCertification.findMany({
      where: { organizationId },
      include: {
        worker: { select: { id: true, name: true, email: true, avatarUrl: true } },
        verifiedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }]
    }),
    prisma.teamMember.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    }),
    // Get certification stats
    prisma.workerCertification.groupBy({
      by: ['certificationType'],
      where: { organizationId },
      _count: true
    })
  ]);

  // Calculate expiring soon (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringSoon = certifications.filter(
    (c: any) => c.expiryDate && new Date(c.expiryDate) <= thirtyDaysFromNow && new Date(c.expiryDate) >= new Date() && !c.isLifetime
  );

  // Calculate expired
  const expired = certifications.filter(
    (c: any) => c.expiryDate && new Date(c.expiryDate) < new Date() && !c.isLifetime
  );

  // Serialize data for client component
  const serializedData = JSON.parse(JSON.stringify({
    certifications,
    teamMembers,
    stats: {
      total: certifications.length,
      verified: certifications.filter((c: any) => c.isVerified).length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      byType: stats
    }
  }));

  return (
    <CertificationsClient 
      initialCertifications={serializedData.certifications}
      teamMembers={serializedData.teamMembers}
      stats={serializedData.stats}
    />
  );
}
