import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Generate a custom report
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

    const report = await prisma.customReport.findFirst({
      where: { id: id, organizationId: user.organizationId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const body = await request.json();
    const { parameters } = body;

    // Create execution record
    const execution = await prisma.reportExecution.create({
      data: {
        reportId: id,
        status: 'PROCESSING',
        parameters: parameters || {},
        organizationId: user.organizationId,
        triggeredById: user.id,
      },
    });

    // TODO: Trigger actual report generation asynchronously
    // Update execution status and result when complete

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
