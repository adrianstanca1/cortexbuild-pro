import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        checklistItems: { orderBy: { order: 'asc' } },
        photos: true
      }
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    if (inspection.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 });
  }
}

export async function PATCH(
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

    const existing = await prisma.inspection.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    if (existing.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { status, scheduledDate, completedDate, result, deficiencies, checklistItems } = body;

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'PASSED' || status === 'FAILED') {
        updateData.completedDate = new Date();
      }
    }
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (completedDate !== undefined) updateData.completedDate = completedDate ? new Date(completedDate) : null;
    if (result !== undefined) updateData.result = result;
    if (deficiencies !== undefined) updateData.deficiencies = deficiencies;

    // Update checklist items if provided
    if (checklistItems?.length) {
      for (const item of checklistItems) {
        if (item.id) {
          await prisma.inspectionChecklistItem.update({
            where: { id: item.id },
            data: { passed: item.passed, notes: item.notes }
          });
        }
      }
    }

    const inspection = await prisma.inspection.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        checklistItems: { orderBy: { order: 'asc' } }
      }
    });

    // Broadcast real-time event
    const eventType = status === 'PASSED' ? 'inspection_passed' : status === 'FAILED' ? 'inspection_failed' : 'inspection_updated';
    broadcastToOrganization(existing.project.organizationId, {
      type: eventType,
      payload: {
        id: inspection.id,
        title: inspection.title,
        status: inspection.status,
        projectName: inspection.project.name
      }
    });

    return NextResponse.json(inspection);
  } catch (error) {
    console.error('Error updating inspection:', error);
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'COMPANY_OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    if (inspection.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.inspection.delete({ where: { id } });

    // Broadcast real-time event
    broadcastToOrganization(inspection.project.organizationId, {
      type: 'inspection_deleted',
      payload: { id: inspection.id, title: inspection.title }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
