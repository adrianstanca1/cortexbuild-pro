import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { timeEntrySchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = timeEntrySchema.parse(body);

    const timeEntry = await prisma.timeEntry.create({
      data: {
        hours: validated.hours,
        description: validated.description,
        date: new Date(validated.date),
        projectId: validated.projectId,
        userId: validated.userId,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    if ((error as { name: string }).name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    console.error('Error creating time entry:', error);
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
  }
}
