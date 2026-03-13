import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));




export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      where: { organizationId },
      select: { id: true }
    });
    const projectIds = projects.map((p: { id: string }) => p.id);

    const submittals = await prisma.submittal.findMany({
      where: {
        projectId: projectId ? { equals: projectId } : { in: projectIds },
        ...(status && { status: status as any })
      },
      include: {
        project: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { attachments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(submittals);
  } catch (error) {
    console.error('Error fetching submittals:', error);
    return NextResponse.json({ error: 'Failed to fetch submittals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, projectId, dueDate, specSection } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and project are required' }, { status: 400 });
    }

    // Get next submittal number for this project
    const lastSubmittal = await prisma.submittal.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' }
    });
    const nextNumber = (lastSubmittal?.number || 0) + 1;

    const submittal = await prisma.submittal.create({
      data: {
        number: nextNumber,
        title,
        description,
        projectId,
        specSection,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'DRAFT'
      },
      include: {
        project: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'created',
        entityType: 'submittal',
        entityId: submittal.id,
        entityName: `Submittal #${submittal.number}: ${submittal.title}`,
        userId: session.user.id,
        projectId
      }
    });

    // Get organization for broadcasting
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });

    if (project?.organizationId) {
      broadcastToOrganization(project.organizationId, {
        type: 'submittal_created',
        payload: {
          ...submittal,
          createdByName: session.user.name
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(submittal, { status: 201 });
  } catch (error) {
    console.error('Error creating submittal:', error);
    return NextResponse.json({ error: 'Failed to create submittal' }, { status: 500 });
  }
}
