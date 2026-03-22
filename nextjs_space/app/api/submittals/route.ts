import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createSubmittalSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default('PENDING'),
  projectId: z.string().min(1),
  submittedById: z.string().min(1),
  reviewedById: z.string().optional(),
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

    const submittals = await prisma.submittal.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ submittals });
  } catch (error) {
    console.error('Failed to fetch submittals:', error);
    return NextResponse.json({ error: 'Failed to fetch submittals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createSubmittalSchema.parse(body);

    const submittal = await prisma.submittal.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ submittal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create submittal:', error);
    return NextResponse.json({ error: 'Failed to create submittal' }, { status: 500 });
  }
}
