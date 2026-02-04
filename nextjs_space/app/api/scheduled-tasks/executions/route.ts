import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get execution logs for scheduled tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    const where: any = {};
    if (taskId) {
      where.taskId = taskId;
      // Verify task belongs to user's organization
      const task = await prisma.scheduledTask.findFirst({
        where: { id: taskId, organizationId: user.organizationId },
      });
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
    }

    const executions = await prisma.scheduledTaskExecution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        task: true,
      },
      take: 100,
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error('Get task executions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
