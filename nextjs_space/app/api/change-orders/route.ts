import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createChangeOrderSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().min(0).default(0),
  status: z.string().default('PENDING'),
  projectId: z.string().min(1),
  requestedById: z.string().min(1),
  approvedById: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const changeOrders = await prisma.changeOrder.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ changeOrders });
  } catch (error) {
    console.error('Failed to fetch change orders:', error);
    return NextResponse.json({ error: 'Failed to fetch change orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createChangeOrderSchema.parse(body);

    const changeOrder = await prisma.changeOrder.create({
      data,
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ changeOrder }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create change order:', error);
    return NextResponse.json({ error: 'Failed to create change order' }, { status: 500 });
  }
}
