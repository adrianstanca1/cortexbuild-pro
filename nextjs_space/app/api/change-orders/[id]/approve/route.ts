import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has approval permissions
    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN', 'COMPANY_OWNER', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to approve change orders' 
      }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { comments } = body;

    const existingCO = await prisma.changeOrder.findUnique({
      where: { id },
      include: { 
        project: { 
          select: { 
            id: true, 
            name: true, 
            organizationId: true, 
            budget: true 
          } 
        },
        requestedBy: { select: { name: true, email: true } }
      }
    });

    if (!existingCO) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    if (existingCO.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (existingCO.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ 
        error: `Cannot approve change order with status: ${existingCO.status}` 
      }, { status: 400 });
    }

    // Update change order to approved
    const updatedCO = await prisma.$transaction(async (tx) => {
      const co = await tx.changeOrder.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedById: session.user.id
        },
        include: {
          project: { select: { id: true, name: true, organizationId: true, budget: true } },
          requestedBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } }
        }
      });

      // Update project budget if there's a cost change
      if (existingCO.costChange !== 0) {
        await tx.project.update({
          where: { id: existingCO.projectId },
          data: { budget: (existingCO.project.budget || 0) + existingCO.costChange }
        });
      }

      // Create version record for audit trail
      await tx.changeOrderVersion.create({
        data: {
          changeOrderId: id,
          version: existingCO.currentVersion + 1,
          title: existingCO.title,
          description: existingCO.description,
          reason: existingCO.reason,
          costChange: existingCO.costChange,
          scheduleChange: existingCO.scheduleChange,
          status: 'APPROVED',
          createdById: session.user.id,
          approvedById: session.user.id,
          approvedAt: new Date(),
          approvalComments: comments || null
        }
      });

      // Update version number
      await tx.changeOrder.update({
        where: { id },
        data: { currentVersion: existingCO.currentVersion + 1 }
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          action: 'approved',
          entityType: 'change_order',
          entityId: id,
          entityName: `CO-${existingCO.number}: ${existingCO.title}`,
          userId: session.user.id
        }
      });

      return co;
    });

    // Broadcast real-time event
    broadcastToOrganization(existingCO.project.organizationId, {
      type: 'change_order_approved',
      payload: {
        id,
        number: existingCO.number,
        title: existingCO.title,
        projectId: existingCO.projectId,
        projectName: existingCO.project.name,
        approvedBy: session.user.name
      }
    });

    return NextResponse.json(updatedCO);
  } catch (error) {
    console.error('Error approving change order:', error);
    return NextResponse.json({ 
      error: 'Failed to approve change order' 
    }, { status: 500 });
  }
}
