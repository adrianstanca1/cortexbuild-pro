import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const task = await prisma.scheduledTask.findUnique({ where: { id: id } });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const execution = await prisma.scheduledTaskExecution.create({
      data: { taskId: id, status: 'RUNNING', startedAt: new Date() },
    });

    // Simulate async completion
    setTimeout(async () => {
      try {
        await prisma.scheduledTaskExecution.update({
          where: { id: execution.id },
          data: { status: 'SUCCESS', completedAt: new Date(), duration: 1200, output: JSON.stringify({ message: 'Task completed successfully' }) },
        });
        await prisma.scheduledTask.update({
          where: { id: id },
          data: { lastRunAt: new Date(), lastStatus: 'SUCCESS' },
        });
      } catch {}
    }, 1200);

    return NextResponse.json({ execution, message: 'Task execution started' });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}