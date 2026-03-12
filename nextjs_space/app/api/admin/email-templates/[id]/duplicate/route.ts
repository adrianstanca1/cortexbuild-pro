import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const original = await prisma.documentTemplate.findUnique({ where: { id: id } });
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const duplicate = await prisma.documentTemplate.create({
      data: {
        organizationId: original.organizationId,
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        content: original.content as object,
        isActive: true,
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ template: duplicate }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}