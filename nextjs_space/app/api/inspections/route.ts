import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inspectionSchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const inspections = await prisma.inspection.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = inspectionSchema.parse(body);

    const inspection = await prisma.inspection.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        projectId: validated.projectId,
        assigneeId: validated.assigneeId,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    if ((error as { name: string }).name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    console.error('Error creating inspection:', error);
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 });
  }
}
