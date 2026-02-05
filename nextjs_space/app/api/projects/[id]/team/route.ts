export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

// Get project team members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Verify project
    const project = await prisma.project.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const teamMembers = await prisma.projectTeamMember.findMany({
      where: { projectId: id },
      include: {
        teamMember: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
          },
        },
      },
    });

    const formattedTeam = teamMembers.map(tm => ({
      id: tm.id,
      assignedAt: tm.assignedAt,
      teamMember: {
        id: tm.teamMember.id,
        jobTitle: tm.teamMember.jobTitle,
        department: tm.teamMember.department,
        user: tm.teamMember.user,
      },
    }));

    return NextResponse.json(formattedTeam);
  } catch (error) {
    console.error('Get project team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add team member to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string; name?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Only admins/PMs can add team members
    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const project = await prisma.project.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { teamMemberId } = body;

    if (!teamMemberId) {
      return NextResponse.json({ error: 'Team member ID required' }, { status: 400 });
    }

    // Check if already on project
    const existing = await prisma.projectTeamMember.findFirst({
      where: { projectId: id, teamMemberId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Member already on project' }, { status: 409 });
    }

    const projectTeamMember = await prisma.projectTeamMember.create({
      data: {
        projectId: id,
        teamMemberId,
      },
      include: {
        teamMember: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'team_member_added',
        entityType: 'project_team',
        entityId: projectTeamMember.id,
        entityName: projectTeamMember.teamMember.user.name,
        details: `${projectTeamMember.teamMember.user.name} added to project`,
        userId: user.id,
        projectId: id,
      },
    });

    broadcastToOrganization(user.organizationId, {
      type: 'team_member_added',
      payload: {
        projectId: id,
        projectName: project.name,
        memberName: projectTeamMember.teamMember.user.name,
        addedBy: user.name,
      },
    });

    return NextResponse.json(projectTeamMember, { status: 201 });
  } catch (error) {
    console.error('Add project team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove team member from project
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const projectTeamMember = await prisma.projectTeamMember.findFirst({
      where: { projectId: id, id: memberId },
      include: { project: true, teamMember: { include: { user: { select: { name: true } } } } },
    });

    if (!projectTeamMember) {
      return NextResponse.json({ error: 'Team member not found on project' }, { status: 404 });
    }

    await prisma.projectTeamMember.delete({ where: { id: memberId } });

    broadcastToOrganization(user.organizationId, {
      type: 'team_member_removed',
      payload: {
        projectId: id,
        projectName: projectTeamMember.project.name,
        memberName: projectTeamMember.teamMember.user.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove project team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
