import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ activities: [], total: 0 });
    }

    const where: Record<string, unknown> = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else {
      // Get activities for all projects in the organization
      const projects = await prisma.project.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true }
      });
      where.OR = [
        { projectId: { in: projects.map((p: { id: string }) => p.id) } },
        { userId: session.user.id }
      ];
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          },
          project: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.activityLog.count({ where })
    ]);

    return NextResponse.json({ activities, total });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as { organizationId?: string })?.organizationId;
    const body = await request.json();
    const { action, entityType, entityId, entityName, details, projectId } = body;

    const activity = await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        details,
        userId: session.user.id,
        projectId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });

    // Broadcast activity event to organization
    if (organizationId) {
      broadcastToOrganization(organizationId, {
        type: 'activity_logged',
        timestamp: new Date().toISOString(),
        payload: {
          activity: {
            id: activity.id,
            action: activity.action,
            entityType: activity.entityType,
            entityName: activity.entityName,
            userName: activity.user?.name,
            projectName: activity.project?.name,
            createdAt: activity.createdAt
          }
        }
      });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
