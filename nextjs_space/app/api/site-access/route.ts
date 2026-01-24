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
    const date = searchParams.get('date');
    const accessType = searchParams.get('accessType');
    const onSite = searchParams.get('onSite');

    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    } else if (session.user.organizationId) {
      const projects = await prisma.project.findMany({
        where: { organizationId: session.user.organizationId },
        select: { id: true }
      });
      where.projectId = { in: projects.map(p => p.id) };
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.accessTime = { gte: startOfDay, lte: endOfDay };
    }

    if (accessType) {
      where.accessType = accessType;
    }

    const logs = await prisma.siteAccessLog.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        recordedBy: { select: { id: true, name: true } },
        entryLog: { select: { id: true, accessTime: true, personName: true } }
      },
      orderBy: { accessTime: 'desc' },
      take: 500
    });

    // If onSite=true, filter to show only people currently on site (have entry but no exit)
    if (onSite === 'true') {
      const entryIds = logs.filter(l => l.accessType === 'ENTRY').map(l => l.id);
      const exitEntryIds = logs.filter(l => l.accessType === 'EXIT' && l.entryLogId).map(l => l.entryLogId);
      const currentlyOnSite = logs.filter(l => 
        l.accessType === 'ENTRY' && !exitEntryIds.includes(l.id)
      );
      return NextResponse.json(currentlyOnSite);
    }

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching site access logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const log = await prisma.siteAccessLog.create({
      data: {
        accessType: data.accessType || 'ENTRY',
        accessTime: data.accessTime ? new Date(data.accessTime) : new Date(),
        userId: data.userId || null,
        personName: data.personName,
        company: data.company,
        role: data.role,
        phone: data.phone,
        vehicleReg: data.vehicleReg,
        purpose: data.purpose,
        personVisiting: data.personVisiting,
        inductionCompleted: data.inductionCompleted || false,
        inductionDate: data.inductionDate ? new Date(data.inductionDate) : null,
        ppeProvided: data.ppeProvided || false,
        briefingGiven: data.briefingGiven || false,
        badgeNumber: data.badgeNumber,
        signatureData: data.signatureData,
        signatureIp: data.signatureData ? ip : null,
        entryLogId: data.entryLogId || null,
        projectId: data.projectId,
        recordedById: session.user.id,
        notes: data.notes
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        user: { select: { id: true, name: true } },
        recordedBy: { select: { id: true, name: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: data.accessType === 'EXIT' ? 'signed_out' : 'signed_in',
        entityType: 'SiteAccess',
        entityId: log.id,
        entityName: `${data.personName} - ${data.accessType}`,
        userId: session.user.id,
        projectId: data.projectId
      }
    });

    broadcastToOrganization(log.project.organizationId, {
      type: data.accessType === 'EXIT' ? 'site_exit' : 'site_entry',
      data: log
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating site access log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
