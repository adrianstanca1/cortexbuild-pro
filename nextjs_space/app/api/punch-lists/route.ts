export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: any = {
      project: { organizationId: session.user.organizationId }
    };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const punchLists = await prisma.punchList.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        photos: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(punchLists);
  } catch (error) {
    console.error('Error fetching punch lists:', error);
    return NextResponse.json({ error: 'Failed to fetch punch lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, description, location, priority, category, dueDate, assignedToId } = body;

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: session.user.organizationId || undefined }
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get next punch list number for project
    const lastPunchList = await prisma.punchList.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' }
    });
    const number = (lastPunchList?.number || 0) + 1;

    const punchList = await prisma.punchList.create({
      data: {
        number,
        title,
        description,
        location,
        priority: priority || 'MEDIUM',
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignedToId: assignedToId || null,
        createdById: session.user.id
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'created',
        entityType: 'punch_list',
        entityId: punchList.id,
        entityName: punchList.title,
        userId: session.user.id,
        projectId
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(session.user.organizationId!, {
      type: 'punch_list_created',
      payload: {
        id: punchList.id,
        title: punchList.title,
        projectName: punchList.project.name
      }
    });

    return NextResponse.json(punchList, { status: 201 });
  } catch (error) {
    console.error('Error creating punch list:', error);
    return NextResponse.json({ error: 'Failed to create punch list' }, { status: 500 });
  }
}
