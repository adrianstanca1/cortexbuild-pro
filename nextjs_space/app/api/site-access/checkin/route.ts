import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



// Public endpoint for site check-in (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      personName,
      company,
      role,
      phone,
      vehicleReg,
      purpose,
      personVisiting,
      accessType = 'ENTRY',
      inductionCompleted = false,
      ppeProvided = false,
      briefingGiven = false
    } = body;

    if (!projectId || !personName) {
      return NextResponse.json(
        { error: 'Project ID and person name are required' },
        { status: 400 }
      );
    }

    // Verify project exists and get organization
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        organizationId: true,
        organization: { select: { name: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create site access log
    const accessLog = await prisma.siteAccessLog.create({
      data: {
        projectId,
        personName,
        company: company || null,
        role: role || 'Visitor',
        phone: phone || null,
        vehicleReg: vehicleReg || null,
        purpose: purpose || null,
        personVisiting: personVisiting || null,
        accessType: accessType as 'ENTRY' | 'EXIT',
        inductionCompleted,
        ppeProvided,
        briefingGiven,
        accessTime: new Date()
      }
    });

    // Broadcast real-time event
    broadcastToOrganization(project.organizationId, {
      type: accessType === 'ENTRY' ? 'site_entry' : 'site_exit',
      data: {
        accessLogId: accessLog.id,
        personName,
        projectId,
        projectName: project.name,
        accessType,
        timestamp: accessLog.accessTime
      }
    });

    return NextResponse.json({
      success: true,
      message: accessType === 'ENTRY' 
        ? `Welcome to ${project.name}! You have been checked in.`
        : `Thank you for visiting ${project.name}. You have been checked out.`,
      accessLog: {
        id: accessLog.id,
        accessTime: accessLog.accessTime,
        projectName: project.name,
        organizationName: project.organization.name
      }
    });
  } catch {
    console.error('Site check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    );
  }
}

// Get recent check-ins for a project (public, limited info)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Get current on-site count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entries = await prisma.siteAccessLog.count({
      where: {
        projectId,
        accessType: 'ENTRY',
        accessTime: { gte: today }
      }
    });

    const exits = await prisma.siteAccessLog.count({
      where: {
        projectId,
        accessType: 'EXIT',
        accessTime: { gte: today }
      }
    });

    const onSiteCount = Math.max(0, entries - exits);

    return NextResponse.json({
      onSiteCount,
      todayEntries: entries,
      todayExits: exits
    });
  } catch {
    console.error('Site access stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site access stats' },
      { status: 500 }
    );
  }
}
