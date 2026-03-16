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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const incident = await prisma.safetyIncident.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 });
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

    const existing = await prisma.safetyIncident.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (existing.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const {
      status,
      severity,
      assignedToId,
      rootCause,
      correctiveAction,
      preventiveAction,
      injuryDescription
    } = body;

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      }
    }
    if (severity !== undefined) updateData.severity = severity;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (rootCause !== undefined) updateData.rootCause = rootCause || null;
    if (correctiveAction !== undefined) updateData.correctiveAction = correctiveAction || null;
    if (preventiveAction !== undefined) updateData.preventiveAction = preventiveAction || null;
    if (injuryDescription !== undefined) updateData.injuryDescription = injuryDescription || null;

    const incident = await prisma.safetyIncident.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'updated',
        entityType: 'safety_incident',
        entityId: incident.id,
        entityName: `Safety Incident`,
        details: status ? `Status changed to ${status}` : 'Investigation updated',
        userId: session.user.id,
        projectId: incident.projectId
      }
    });

    // Broadcast real-time event
    const eventType = (status === 'RESOLVED' || status === 'CLOSED') 
      ? 'safety_incident_resolved' 
      : 'safety_incident_updated';
    
    broadcastToOrganization(existing.project.organizationId, {
      type: eventType,
      payload: {
        id: incident.id,
        severity: incident.severity,
        status: incident.status,
        projectName: incident.project.name,
        updatedBy: session.user.name
      }
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
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

    const incident = await prisma.safetyIncident.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true, name: true } } }
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.safetyIncident.delete({ where: { id } });

    // Broadcast real-time event
    broadcastToOrganization(incident.project.organizationId, {
      type: 'safety_incident_deleted',
      payload: {
        id: incident.id,
        severity: incident.severity,
        projectName: incident.project.name
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}
