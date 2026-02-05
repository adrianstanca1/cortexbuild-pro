import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



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

    const rfis = await prisma.rFI.findMany({
      where: {
        projectId: projectId ? { equals: projectId } : { in: projectIds },
        ...(status && { status: status as any })
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { attachments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(rfis);
  } catch (error) {
    console.error('Error fetching RFIs:', error);
    return NextResponse.json({ error: 'Failed to fetch RFIs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, question, projectId, dueDate, assignedToId, specSection, drawingRef, costImpact, scheduleImpact } = body;

    if (!subject || !question || !projectId) {
      return NextResponse.json({ error: 'Subject, question and project are required' }, { status: 400 });
    }

    // Get next RFI number for this project
    const lastRFI = await prisma.rFI.findFirst({
      where: { projectId },
      orderBy: { number: 'desc' }
    });
    const nextNumber = (lastRFI?.number || 0) + 1;

    const rfi = await prisma.rFI.create({
      data: {
        number: nextNumber,
        subject,
        question,
        projectId,
        createdById: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        specSection: specSection || null,
        drawingRef: drawingRef || null,
        costImpact: costImpact || false,
        scheduleImpact: scheduleImpact || false,
        status: 'OPEN',
        ballInCourt: assignedToId ? 'Architect' : 'Internal'
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'created',
        entityType: 'rfi',
        entityId: rfi.id,
        entityName: `RFI #${rfi.number}: ${rfi.subject}`,
        userId: session.user.id,
        projectId
      }
    });

    // Get organization ID for broadcasting
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });

    if (project?.organizationId) {
      broadcastToOrganization(project.organizationId, {
        type: 'rfi_created',
        payload: {
          ...rfi,
          createdByName: session.user.name
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(rfi, { status: 201 });
  } catch (error) {
    console.error('Error creating RFI:', error);
    return NextResponse.json({ error: 'Failed to create RFI' }, { status: 500 });
  }
}
