import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createRFISchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().optional(),
  status: z.string().default('OPEN'),
  projectId: z.string().min(1),
  createdById: z.string().min(1),
  assignedToId: z.string().optional(),
  answeredById: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const rfis = await prisma.rFI.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        answeredBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rfis });
  } catch (error) {
    console.error('Failed to fetch RFIs:', error);
    return NextResponse.json({ error: 'Failed to fetch RFIs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createRFISchema.parse(body);

    const rfi = await prisma.rFI.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        answeredBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ rfi }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create RFI:', error);
    return NextResponse.json({ error: 'Failed to create RFI' }, { status: 500 });
  }
}
