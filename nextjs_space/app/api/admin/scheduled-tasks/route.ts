import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const where = organizationId ? { organizationId } : {};
    const tasks = await prisma.scheduledTask.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        _count: { select: { executions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ tasks });
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
    const { organizationId, name, description, taskType, schedule, timezone, payload, timeout, retryAttempts } = body;
    if (!name || !taskType) {
      return NextResponse.json({ error: 'name and taskType are required' }, { status: 400 });
    }
    const task = await prisma.scheduledTask.create({
      data: {
        organizationId: organizationId || null,
        name,
        description: description || null,
        taskType: taskType || 'CUSTOM_SCRIPT',
        schedule: schedule || '0 0 * * *',
        timezone: timezone || 'UTC',
        payload: payload || {},
        timeout: timeout || 300,
        retryAttempts: retryAttempts || 3,
        status: 'ACTIVE',
      },
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}