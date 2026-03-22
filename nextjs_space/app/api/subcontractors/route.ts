import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { subcontractorSchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const trade = searchParams.get('trade');

    const where: Record<string, string> = {};
    if (organizationId) where.organizationId = organizationId;
    if (trade) where.trade = trade;

    const subcontractors = await prisma.subcontractor.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(subcontractors);
  } catch (error) {
    console.error('Error fetching subcontractors:', error);
    return NextResponse.json({ error: 'Failed to fetch subcontractors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subcontractorSchema.parse(body);

    const subcontractor = await prisma.subcontractor.create({
      data: {
        name: validated.name,
        trade: validated.trade,
        email: validated.email,
        phone: validated.phone,
        organizationId: validated.organizationId,
      },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(subcontractor, { status: 201 });
  } catch (error) {
    if ((error as { name: string }).name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    console.error('Error creating subcontractor:', error);
    return NextResponse.json({ error: 'Failed to create subcontractor' }, { status: 500 });
  }
}
