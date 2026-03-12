import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, organizationId: true,
        permissionGrants: { include: { permission: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { permissionIds, role } = body;

    if (role) {
      await prisma.user.update({ where: { id: userId }, data: { role } });
    }

    if (permissionIds !== undefined) {
      await prisma.permissionGrant.deleteMany({ where: { userId: userId } });
      if (permissionIds.length > 0) {
        await prisma.permissionGrant.createMany({
          data: permissionIds.map((pid: string) => ({
            userId: userId,
            permissionId: pid,
            grantedById: session.user.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, permissionGrants: { include: { permission: true } } },
    });
    return NextResponse.json({ user: updated });
  } catch (e) { return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}