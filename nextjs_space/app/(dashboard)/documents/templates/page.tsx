import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { DocumentTemplatesClient } from './_components/templates-client';

export const dynamic = 'force-dynamic';

export default async function DocumentTemplatesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const organizationId = session.user.organizationId;
  const userRole = session.user.role;

  // Fetch templates
  const templates = await prisma.documentTemplate.findMany({
    where: {
      OR: [
        { organizationId },
        { isSystemTemplate: true }
      ],
      isActive: true
    },
    include: {
      createdBy: { select: { id: true, name: true } }
    },
    orderBy: [{ isSystemTemplate: 'desc' }, { usageCount: 'desc' }, { createdAt: 'desc' }]
  });

  // Serialize templates with version info
  const serializedTemplates = templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category as string,
    version: t.version || '1.0',
    content: t.content as { title?: string; version?: string; sections?: any[] } | null,
    tags: t.tags,
    usageCount: t.usageCount,
    isSystemTemplate: t.isSystemTemplate,
    isActive: t.isActive,
    thumbnailUrl: t.thumbnailUrl,
    createdAt: t.createdAt.toISOString(),
    createdBy: t.createdBy
  }));

  // Get usage stats
  const stats = {
    total: templates.length,
    system: templates.filter(t => t.isSystemTemplate).length,
    custom: templates.filter(t => !t.isSystemTemplate).length,
    byCategory: templates.reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {})
  };

  return (
    <DocumentTemplatesClient
      templates={serializedTemplates}
      stats={stats}
      userRole={userRole}
    />
  );
}
