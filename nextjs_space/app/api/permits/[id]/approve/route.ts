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

    // Only certain roles can approve permits
    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN', 'COMPANY_OWNER', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({
        error: 'Insufficient permissions to approve permits'
      }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { approvalDate, permitNumber, expirationDate, inspectionDate, conditions } = body;

    const existingPermit = await prisma.permit.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        }
      }
    });

    if (!existingPermit) {
      return NextResponse.json({ error: 'Permit not found' }, { status: 404 });
    }

    if (existingPermit.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existingPermit.status)) {
      return NextResponse.json({
        error: `Cannot approve permit with status: ${existingPermit.status}`
      }, { status: 400 });
    }

    // Update permit to approved and log activity in a single transaction
    const [updatedPermit] = await prisma.$transaction([
      prisma.permit.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvalDate: approvalDate ? new Date(approvalDate) : new Date(),
          permitNumber: permitNumber || existingPermit.permitNumber,
          expirationDate: expirationDate ? new Date(expirationDate) : existingPermit.expirationDate,
          inspectionDate: inspectionDate ? new Date(inspectionDate) : existingPermit.inspectionDate,
          conditions: conditions || existingPermit.conditions
        },
        include: {
          project: { select: { id: true, name: true } },
          documents: true
        }
      }),
      prisma.activityLog.create({
        data: {
          action: 'approved',
          entityType: 'permit',
          entityId: id,
          entityName: `${existingPermit.type} - ${existingPermit.title}`,
          userId: session.user.id
        }
      })
    ]);

    // Broadcast real-time event
    broadcastToOrganization(existingPermit.project.organizationId, {
      type: 'permit_approved',
      payload: {
        id,
        title: existingPermit.title,
        type: existingPermit.type,
        permitNumber: updatedPermit.permitNumber,
        projectId: existingPermit.projectId,
        projectName: existingPermit.project.name
      }
    });

    return NextResponse.json(updatedPermit);
  } catch {
    console.error('Error approving permit:', error);
    return NextResponse.json({
      error: 'Failed to approve permit'
    }, { status: 500 });
  }
}
