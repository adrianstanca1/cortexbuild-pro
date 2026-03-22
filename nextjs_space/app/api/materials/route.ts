import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { materialSchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, string> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const materials = await prisma.material.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = materialSchema.parse(body);

    const material = await prisma.material.create({
      data: {
        name: validated.name,
        quantity: validated.quantity,
        unit: validated.unit,
        status: validated.status,
        projectId: validated.projectId,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    if ((error as { name: string }).name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    console.error('Error creating material:', error);
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 });
  }
}
