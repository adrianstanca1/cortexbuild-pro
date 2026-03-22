import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createEquipmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  status: z.string().default('AVAILABLE'),
  organizationId: z.string().min(1),
  projectId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (organizationId) where.organizationId = organizationId;
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error('Failed to fetch equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createEquipmentSchema.parse(body);

    const equipment = await prisma.equipment.create({
      data,
      include: {
        organization: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create equipment:', error);
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
  }
}
