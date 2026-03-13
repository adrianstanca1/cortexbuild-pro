import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const bigintSafe = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));




export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const costCode = await prisma.costCode.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
            budgetAmount: true,
            actualAmount: true
          }
        },
        workPackages: {
          select: { id: true, name: true, number: true, status: true }
        },
        budgetLines: {
          select: {
            id: true,
            originalBudget: true,
            revisedBudget: true,
            committed: true,
            actual: true,
            variance: true
          }
        }
      }
    });

    if (!costCode) {
      return NextResponse.json({ error: 'Cost code not found' }, { status: 404 });
    }

    return NextResponse.json(costCode);
  } catch (error) {
    console.error('Error fetching cost code:', error);
    return NextResponse.json({ error: 'Failed to fetch cost code' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.costCode.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cost code not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'description', 'category', 'budgetAmount', 'committedAmount',
      'actualAmount', 'forecastAmount', 'varianceThreshold', 'isActive'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const costCode = await prisma.costCode.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, code: true, name: true } },
        children: { select: { id: true, code: true, name: true } }
      }
    });

    return NextResponse.json(costCode);
  } catch (error) {
    console.error('Error updating cost code:', error);
    return NextResponse.json({ error: 'Failed to update cost code' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.costCode.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId
      },
      include: {
        _count: {
          select: { children: true, workPackages: true, costItems: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cost code not found' }, { status: 404 });
    }

    // Check for dependencies
    if (existing._count.children > 0 || existing._count.workPackages > 0 || existing._count.costItems > 0) {
      return NextResponse.json(bigintSafe({ 
        error: 'Cannot delete cost code with children, work packages or cost items' 
      }, { status: 400 }));
    }

    await prisma.costCode.delete({ where: { id } });

    return NextResponse.json(bigintSafe({ success: true }));
  } catch (error) {
    console.error('Error deleting cost code:', error);
    return NextResponse.json({ error: 'Failed to delete cost code' }, { status: 500 });
  }
}
