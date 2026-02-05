import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const parentId = searchParams.get('parentId');
    const includeProjectOverrides = searchParams.get('includeProjectOverrides') === 'true';

    const where: Record<string, unknown> = {
      organizationId: session.user.organizationId
    };

    if (projectId && includeProjectOverrides) {
      where.OR = [
        { projectId: null },  // Organization library
        { projectId }          // Project-specific
      ];
    } else if (projectId) {
      where.projectId = projectId;
    } else {
      where.projectId = null;  // Only org library
    }

    if (parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    const costCodes = await prisma.costCode.findMany({
      where,
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true, level: true } },
        _count: {
          select: {
            workPackages: true,
            costItems: true,
            budgetLines: true
          }
        }
      },
      orderBy: { code: 'asc' }
    });

    return NextResponse.json(costCodes);
  } catch {
    console.error('Error fetching cost codes:', error);
    return NextResponse.json({ error: 'Failed to fetch cost codes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, description, parentId, category, budgetAmount, projectId, varianceThreshold } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
    }

    // Calculate level based on parent
    let level = 1;
    if (parentId) {
      const parent = await prisma.costCode.findUnique({ where: { id: parentId } });
      if (parent) {
        level = parent.level + 1;
      }
    }

    const costCode = await prisma.costCode.create({
      data: {
        code,
        name,
        description,
        parentId: parentId || null,
        level,
        category: category || 'OTHER',
        budgetAmount: budgetAmount || 0,
        varianceThreshold: varianceThreshold || 10,
        organizationId: session.user.organizationId,
        projectId: projectId || null
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true } }
      }
    });

    return NextResponse.json(costCode, { status: 201 });
  } catch {
    console.error('Error creating cost code:', error);
    return NextResponse.json({ error: 'Failed to create cost code' }, { status: 500 });
  }
}
