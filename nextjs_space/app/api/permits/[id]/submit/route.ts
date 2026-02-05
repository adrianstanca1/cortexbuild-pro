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

    const { id } = await params;
    const body = await request.json();
    const { applicationDate, issuingAuthority, fee } = body;

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

    if (existingPermit.status !== 'DRAFT') {
      return NextResponse.json({
        error: `Cannot submit permit with status: ${existingPermit.status}`
      }, { status: 400 });
    }

    // Validate required fields for submission
    if (!issuingAuthority) {
      return NextResponse.json({
        error: 'Issuing authority is required for submission'
      }, { status: 400 });
    }

    // Update permit to submitted and log activity in a single transaction
    const [updatedPermit] = await prisma.$transaction([
      prisma.permit.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
          issuingAuthority,
          fee: fee ? parseFloat(fee) : existingPermit.fee
        },
        include: {
          project: { select: { id: true, name: true } },
          documents: true
        }
      }),
      prisma.activityLog.create({
        data: {
          action: 'submitted',
          entityType: 'permit',
          entityId: id,
          entityName: `${existingPermit.type} - ${existingPermit.title}`,
          userId: session.user.id
        }
      })
    ]);

    // Broadcast real-time event
    broadcastToOrganization(existingPermit.project.organizationId, {
      type: 'permit_submitted',
      payload: {
        id,
        title: existingPermit.title,
        type: existingPermit.type,
        projectId: existingPermit.projectId,
        projectName: existingPermit.project.name
      }
    });

    return NextResponse.json(updatedPermit);
  } catch {
    console.error('Error submitting permit:', error);
    return NextResponse.json({
      error: 'Failed to submit permit'
    }, { status: 500 });
  }
}
