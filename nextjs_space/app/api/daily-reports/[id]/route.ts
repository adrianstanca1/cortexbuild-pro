export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
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

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        photos: true
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
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

    const existing = await prisma.dailyReport.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (existing.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const {
      weather,
      temperature,
      workPerformed,
      materialsUsed,
      equipmentUsed,
      visitors,
      delays,
      safetyNotes,
      manpowerCount
    } = body;

    const report = await prisma.dailyReport.update({
      where: { id },
      data: {
        weather,
        temperature,
        workPerformed,
        materialsUsed,
        equipmentUsed,
        visitors,
        delays,
        safetyNotes,
        manpowerCount
      },
      include: {
        project: { select: { id: true, name: true, organizationId: true } },
        createdBy: { select: { id: true, name: true } },
        photos: true
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(existing.project.organizationId, {
      type: 'daily_report_updated',
      payload: {
        id: report.id,
        reportDate: report.reportDate,
        projectName: report.project.name,
        updatedBy: session.user.name
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating daily report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'PROJECT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.project.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.dailyReport.delete({ where: { id } });

    // Broadcast real-time event
    broadcastToOrganization(report.project.organizationId, {
      type: 'daily_report_deleted',
      payload: {
        id: report.id,
        reportDate: report.reportDate
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting daily report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
