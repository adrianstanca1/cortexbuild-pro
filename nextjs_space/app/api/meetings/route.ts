import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { meetingMinutesSchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;

    const meetings = await prisma.meetingMinutes.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = meetingMinutesSchema.parse(body);

    const meeting = await prisma.meetingMinutes.create({
      data: {
        title: validated.title,
        date: new Date(validated.date),
        attendees: validated.attendees,
        notes: validated.notes,
        actionItems: validated.actionItems,
        projectId: validated.projectId,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    if ((error as { name: string }).name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
