import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permit = await prisma.hotWorkPermit.findUnique({
      where: { id: id },
      include: {
        project: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } }
      }
    });

    if (!permit) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(permit);
  } catch (error) {
    console.error('Error fetching hot work permit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const existing = await prisma.hotWorkPermit.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: any = { ...data };

    // Handle approval
    if (data.status === 'APPROVED' && !existing.approvedById) {
      updateData.approvedById = session.user.id;
      updateData.approverSignedAt = new Date();
    }

    // Handle completion
    if (data.status === 'COMPLETED' && !existing.completedById) {
      updateData.completedById = session.user.id;
      updateData.completedAt = new Date();
    }

    // Convert dates if provided
    if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
    if (data.validTo) updateData.validTo = new Date(data.validTo);

    const permit = await prisma.hotWorkPermit.update({
      where: { id: id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: data.status === 'APPROVED' ? 'approved' : 'updated',
        entityType: 'HotWorkPermit',
        entityId: permit.id,
        entityName: `Hot Work Permit #${permit.number}`,
        userId: session.user.id,
        projectId: permit.projectId
      }
    });

    broadcastToOrganization(existing.project.organizationId, {
      type: 'hot_work_permit_updated',
      data: permit
    });

    return NextResponse.json(permit);
  } catch (error) {
    console.error('Error updating hot work permit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
