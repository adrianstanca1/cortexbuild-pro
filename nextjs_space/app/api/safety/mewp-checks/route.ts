import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const mewpChecks = await prisma.mEWPCheck.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        operator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ mewpChecks });
  } catch (error) {
    console.error('Failed to fetch MEWP checks:', error);
    return NextResponse.json({ error: 'Failed to fetch MEWP checks' }, { status: 500 });
  }
}
