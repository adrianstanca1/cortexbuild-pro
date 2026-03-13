import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const where: Record<string, unknown> = {};
    if (resource) where.resource = resource;
    const permissions = await prisma.permission.findMany({
      where,
      include: { _count: { select: { grants: true } } },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    return NextResponse.json(bigintSafe({ permissions }));
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, resource, action, conditions, description } = body;
    if (!resource || !action) {
      return NextResponse.json({ error: 'resource and action are required' }, { status: 400 });
    }
    const permName = name || `${resource}:${action}`;
    const permission = await prisma.permission.create({
      data: { name: permName, resource, action, conditions: conditions || null, description: description || null, isSystem: false },
    });
    return NextResponse.json(bigintSafe({ permission }), { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
