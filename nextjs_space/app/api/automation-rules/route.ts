import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId
    };

    if (projectId) {
      where.OR = [
        { projectId },
        { projectId: null }  // Org-wide rules
      ];
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const rules = await prisma.automationRule.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: {
          select: { executionLogs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create rules
    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, description, projectId, triggerType, triggerCondition,
      actions, notifyRoles, notifyUsers, escalationDelay
    } = body;

    if (!name || !triggerType || !triggerCondition || !actions) {
      return NextResponse.json({ error: 'Name, trigger type, condition and actions are required' }, { status: 400 });
    }

    const rule = await prisma.automationRule.create({
      data: {
        name,
        description,
        organizationId: session.user.organizationId,
        projectId: projectId || null,
        triggerType,
        triggerCondition,
        actions,
        notifyRoles: notifyRoles || [],
        notifyUsers: notifyUsers || [],
        escalationDelay,
        createdById: session.user.id
      },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 });
  }
}
