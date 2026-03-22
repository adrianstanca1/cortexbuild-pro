import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createDocumentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['PLANS', 'DRAWINGS', 'PERMITS', 'PHOTOS', 'REPORTS', 'SPECIFICATIONS', 'CONTRACTS', 'RAMS', 'OTHER']).default('OTHER'),
  url: z.string().url(),
  size: z.number().optional(),
  projectId: z.string().min(1),
  uploadedById: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (type) where.type = type;

    const documents = await prisma.document.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createDocumentSchema.parse(body);

    const document = await prisma.document.create({
      data: {
        name: data.name,
        type: data.type,
        url: data.url,
        size: data.size,
        projectId: data.projectId,
        uploadedById: data.uploadedById,
      },
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
