export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      where: { organizationId },
      select: { id: true }
    });
    const projectIds = projects.map((p: { id: string }) => p.id);

    const incidents = await prisma.safetyIncident.findMany({
      where: {
        projectId: projectId ? { equals: projectId } : { in: projectIds },
        ...(status && { status: status as any }),
        ...(severity && { severity: severity as any })
      },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      },
      orderBy: { incidentDate: 'desc' }
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching safety incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      incidentDate,
      location,
      description,
      severity,
      injuryOccurred,
      injuryDescription,
      assignedToId
    } = body;

    if (!projectId || !description || !incidentDate) {
      return NextResponse.json({ error: 'Project, date, and description are required' }, { status: 400 });
    }

    const incident = await prisma.safetyIncident.create({
      data: {
        projectId,
        incidentDate: new Date(incidentDate),
        location: location || null,
        description,
        severity: severity || 'MEDIUM',
        status: 'OPEN',
        injuryOccurred: injuryOccurred || false,
        injuryDescription: injuryDescription || null,
        reportedById: session.user.id,
        assignedToId: assignedToId || null
      },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'reported',
        entityType: 'safety_incident',
        entityId: incident.id,
        entityName: `Safety Incident: ${description.substring(0, 50)}...`,
        userId: session.user.id,
        projectId
      }
    });

    // Get organization for broadcasting
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });

    if (project?.organizationId) {
      broadcastToOrganization(project.organizationId, {
        type: 'safety_incident_reported',
        payload: {
          ...incident,
          reportedByName: session.user.name,
          severity: incident.severity
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Error creating safety incident:', error);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}
