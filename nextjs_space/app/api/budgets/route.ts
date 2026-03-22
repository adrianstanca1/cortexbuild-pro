import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { costItemSchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;

    const costItems = await prisma.costItem.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { code: 'asc' },
    });

    const totalBudget = costItems.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);

    return NextResponse.json({
      costItems,
      totalBudget,
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = costItemSchema.parse(body);

    const costItem = await prisma.costItem.create({
      data: {
        code: validated.code,
        description: validated.description,
        amount: validated.amount,
        category: validated.category,
        projectId: validated.projectId,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(costItem, { status: 201 });
  } catch (error) {
    if ((error as { name: string }).name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    console.error('Error creating budget item:', error);
    return NextResponse.json({ error: 'Failed to create budget item' }, { status: 500 });
  }
}
