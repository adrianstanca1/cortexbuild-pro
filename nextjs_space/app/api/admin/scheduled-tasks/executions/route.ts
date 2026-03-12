import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const where = taskId ? { taskId } : {};
    const [executions, total] = await Promise.all([
      prisma.scheduledTaskExecution.findMany({
        where,
        include: { task: { select: { id: true, name: true, taskType: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scheduledTaskExecution.count({ where }),
    ]);
    return NextResponse.json({ executions, total, page, limit });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}