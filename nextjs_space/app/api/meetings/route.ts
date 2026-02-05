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
    const meetingType = searchParams.get('meetingType');

    const where: any = {
      project: { organizationId: session.user.organizationId }
    };
    if (projectId) where.projectId = projectId;
    if (meetingType) where.meetingType = meetingType;

    const meetings = await prisma.meetingMinutes.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true } },
        _count: { select: { attendees: true, actionItems: true } }
      },
      orderBy: { meetingDate: 'desc' }
    });

    return NextResponse.json(meetings);
  } catch {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, meetingType, meetingDate, location, duration, summary, attendees, actionItems } = body;

    // Verify project belongs to user's organization
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: session.user.organizationId || undefined }
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const meeting = await prisma.meetingMinutes.create({
      data: {
        title,
        meetingType: meetingType || 'PROGRESS',
        meetingDate: new Date(meetingDate),
        location,
        duration,
        summary,
        projectId,
        organizerId: session.user.id,
        attendees: attendees?.length ? {
          create: attendees.map((a: any) => ({
            name: a.name,
            company: a.company,
            email: a.email,
            attended: a.attended ?? true
          }))
        } : undefined,
        actionItems: actionItems?.length ? {
          create: actionItems.map((item: any) => ({
            description: item.description,
            assignedTo: item.assignedTo,
            dueDate: item.dueDate ? new Date(item.dueDate) : null
          }))
        } : undefined
      },
      include: {
        project: { select: { id: true, name: true } },
        organizer: { select: { id: true, name: true } },
        attendees: true,
        actionItems: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'recorded',
        entityType: 'meeting',
        entityId: meeting.id,
        entityName: meeting.title,
        userId: session.user.id,
        projectId
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(session.user.organizationId!, {
      type: 'meeting_recorded',
      payload: {
        id: meeting.id,
        title: meeting.title,
        type: meeting.meetingType,
        projectName: meeting.project.name
      }
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
