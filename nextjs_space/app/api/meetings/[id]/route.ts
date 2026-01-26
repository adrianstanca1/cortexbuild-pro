export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meeting = await prisma.meetingMinutes.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        organizer: { select: { id: true, name: true, email: true } },
        attendees: true,
        actionItems: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.meetingMinutes.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (existing.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { summary, actionItems } = body;

    // Update action items if provided - use parallel operations for better performance
    if (actionItems?.length) {
      const updatePromises = [];
      const createData = [];

      for (const item of actionItems) {
        if (item.id) {
          updatePromises.push(
            prisma.meetingActionItem.update({
              where: { id: item.id },
              data: {
                completed: item.completed,
                completedAt: item.completed ? new Date() : null
              }
            })
          );
        } else if (item.description) {
          createData.push({
            meetingId: id,
            description: item.description,
            assignedTo: item.assignedTo,
            dueDate: item.dueDate ? new Date(item.dueDate) : null
          });
        }
      }

      // Execute updates in parallel
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
      
      // Batch create new items
      if (createData.length > 0) {
        await prisma.meetingActionItem.createMany({
          data: createData,
          skipDuplicates: true
        });
      }
    }

    const updateData: any = {};
    if (summary !== undefined) updateData.summary = summary;

    const meeting = await prisma.meetingMinutes.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        attendees: true,
        actionItems: true
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(existing.project.organizationId, {
      type: 'meeting_updated',
      payload: {
        id: meeting.id,
        title: meeting.title,
        projectName: meeting.project.name
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'COMPANY_OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const meeting = await prisma.meetingMinutes.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.meetingMinutes.delete({ where: { id } });

    // Broadcast real-time event
    broadcastToOrganization(meeting.project.organizationId, {
      type: 'meeting_deleted',
      payload: { id: meeting.id, title: meeting.title }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
