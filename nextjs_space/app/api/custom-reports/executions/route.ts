import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get report execution history
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

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    const where: any = { organizationId: user.organizationId };
    if (reportId) {
      where.reportId = reportId;
    }

    const executions = await prisma.reportExecution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        report: true,
      },
      take: 100,
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error('Get report executions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
