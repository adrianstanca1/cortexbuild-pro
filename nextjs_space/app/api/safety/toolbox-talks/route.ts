import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
    }

    const toolboxTalks = await prisma.toolboxTalk.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        presenter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ toolboxTalks });
  } catch (error) {
    console.error('Failed to fetch toolbox talks:', error);
    return NextResponse.json({ error: 'Failed to fetch toolbox talks' }, { status: 500 });
  }
}
