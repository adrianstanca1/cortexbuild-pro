import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const template = await prisma.documentTemplate.findUnique({
      where: { id: id },
      include: { createdBy: { select: { id: true, name: true } }, organization: { select: { id: true, name: true } } },
    });
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ template });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const template = await prisma.documentTemplate.update({
      where: { id: id },
      data: { name: body.name, description: body.description, content: body.content, isActive: body.isActive },
    });
    return NextResponse.json({ template });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await prisma.documentTemplate.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}