import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createDailyReportSchema = z.object({
  date: z.string().datetime(),
  weather: z.string().optional(),
  temperature: z.string().optional(),
  workforceCount: z.number().int().min(0).default(0),
  workPerformed: z.string().min(1),
  notes: z.string().optional(),
  projectId: z.string().min(1),
  createdById: z.string().min(1),
});

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

    const dailyReports = await prisma.dailyReport.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ dailyReports });
  } catch (error) {
    console.error('Failed to fetch daily reports:', error);
    return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createDailyReportSchema.parse(body);

    const dailyReport = await prisma.dailyReport.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ dailyReport }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create daily report:', error);
    return NextResponse.json({ error: 'Failed to create daily report' }, { status: 500 });
  }
}
