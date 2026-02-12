import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    // Get recent activities as notifications
    const projects = await prisma.project.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true }
    });

    const activities = await prisma.activityLog.findMany({
      where: {
        OR: [
          { projectId: { in: projects.map(p => p.id) } },
          { userId: session.user.id }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true }
        },
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Transform activities into notifications format
    const notifications = activities.map(activity => ({
      id: activity.id,
      type: activity.entityType,
      action: activity.action,
      entityName: activity.entityName,
      message: `${activity.user.name} ${activity.action} ${activity.entityType}${activity.entityName ? ` "${activity.entityName}"` : ''}`,
      projectName: activity.project?.name,
      userId: activity.userId,
      userName: activity.user.name,
      userAvatar: activity.user.avatarUrl,
      createdAt: activity.createdAt,
      read: false // In a real app, you'd track read status in DB
    }));

    return NextResponse.json({
      notifications,
      unreadCount: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
