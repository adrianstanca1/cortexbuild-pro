import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Manually execute a scheduled task
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

    const user = session.user as { id: string; organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const task = await prisma.scheduledTask.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create execution record
    const execution = await prisma.taskExecution.create({
      data: {
        taskId: id,
        status: 'RUNNING',
        triggeredBy: 'MANUAL',
        organizationId: user.organizationId,
        triggeredById: user.id,
      },
    });

    // TODO: Trigger actual task execution asynchronously
    // Update execution status when complete

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    console.error('Execute scheduled task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
