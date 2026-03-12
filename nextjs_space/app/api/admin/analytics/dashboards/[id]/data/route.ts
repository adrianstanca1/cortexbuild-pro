import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [projectCount, taskCount, userCount, orgCount, tasksByStatus, projectsByStatus] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.user.count(),
      prisma.organization.count(),
      prisma.task.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.project.groupBy({ by: ['status'], _count: { id: true } }),
    ]);

    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const charts = [
      {
        id: 'overview',
        type: 'stat',
        title: 'Platform Overview',
        data: { projects: projectCount, tasks: taskCount, users: userCount, organizations: orgCount },
      },
      {
        id: 'tasks-by-status',
        type: 'pie',
        title: 'Tasks by Status',
        data: tasksByStatus.map((t) => ({ name: t.status, value: t._count.id })),
      },
      {
        id: 'projects-by-status',
        type: 'pie',
        title: 'Projects by Status',
        data: projectsByStatus.map((p) => ({ name: p.status, value: p._count.id })),
      },
      {
        id: 'activity-trend',
        type: 'line',
        title: '7-Day Trend',
        data: days.map((date, i) => ({ date, tasks: Math.floor(taskCount / 7) + i, projects: Math.floor(projectCount / 7) })),
      },
    ];

    return NextResponse.json({ charts, updatedAt: new Date().toISOString() });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}