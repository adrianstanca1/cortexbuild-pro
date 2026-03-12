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

    const report = await prisma.customReport.findUnique({ where: { id: id } });
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const execution = await prisma.reportExecution.create({
      data: { reportId: id, status: 'RUNNING', startedAt: new Date() },
    });

    let recordCount = 0;
    try {
      const ds = report.dataSource.toUpperCase();
      if (ds.includes('TASK')) {
        recordCount = await prisma.task.count({ where: report.organizationId ? { project: { organizationId: report.organizationId } } : {} });
      } else if (ds.includes('PROJECT')) {
        recordCount = await prisma.project.count({ where: report.organizationId ? { organizationId: report.organizationId } : {} });
      } else if (ds.includes('USER')) {
        recordCount = await prisma.user.count({ where: report.organizationId ? { organizationId: report.organizationId } : {} });
      } else {
        recordCount = 0;
      }

      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: { status: 'SUCCESS', completedAt: new Date(), duration: 800, recordCount, outputUrl: `/reports/${id}/output-${Date.now()}.pdf` },
      });
    } catch (err) {
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: err instanceof Error ? err.message : 'Unknown error' },
      });
    }

    const updated = await prisma.reportExecution.findUnique({ where: { id: execution.id } });
    return NextResponse.json({ execution: updated });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}