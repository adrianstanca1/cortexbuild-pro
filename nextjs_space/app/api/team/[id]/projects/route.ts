export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (currentUser?.role === 'FIELD_WORKER') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { projectId } = body;

    // Check if assignment already exists
    const existing = await prisma.projectTeamMember.findUnique({
      where: {
        projectId_teamMemberId: {
          projectId,
          teamMemberId: id
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Already assigned to this project' }, { status: 400 });
    }

    const assignment = await prisma.projectTeamMember.create({
      data: {
        projectId,
        teamMemberId: id
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    // Log activity
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      include: { user: { select: { name: true } } }
    });

    await prisma.activityLog.create({
      data: {
        action: 'assigned to project',
        entityType: 'team_member',
        entityId: id,
        entityName: teamMember?.user.name,
        userId: session.user.id,
        projectId
      }
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error assigning to project:', error);
    return NextResponse.json({ error: 'Failed to assign to project' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    await prisma.projectTeamMember.delete({
      where: {
        projectId_teamMemberId: {
          projectId,
          teamMemberId: id
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from project:', error);
    return NextResponse.json({ error: 'Failed to remove from project' }, { status: 500 });
  }
}
