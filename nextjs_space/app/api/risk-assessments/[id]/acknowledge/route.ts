import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signatureData } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const riskAssessment = await prisma.riskAssessment.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!riskAssessment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const acknowledgement = await prisma.rAMSAcknowledgement.upsert({
      where: {
        riskAssessmentId_workerId: {
          riskAssessmentId: id,
          workerId: session.user.id
        }
      },
      create: {
        riskAssessmentId: id,
        workerId: session.user.id,
        workerName: session.user.name || 'Unknown',
        signatureData,
        signatureIp: ip
      },
      update: {
        signatureData,
        signatureIp: ip,
        acknowledgedAt: new Date()
      },
      include: { worker: { select: { id: true, name: true } } }
    });

    broadcastToOrganization(riskAssessment.project.organizationId, {
      type: 'rams_acknowledged',
      data: { riskAssessmentId: id, acknowledgement }
    });

    return NextResponse.json(acknowledgement);
  } catch {
    console.error('Error acknowledging RAMS:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Guest acknowledgement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workerName, company, signatureData } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!workerName || !signatureData) {
      return NextResponse.json({ error: 'Name and signature required' }, { status: 400 });
    }

    const riskAssessment = await prisma.riskAssessment.findUnique({
      where: { id: id },
      include: { project: { select: { organizationId: true } } }
    });

    if (!riskAssessment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const acknowledgement = await prisma.rAMSAcknowledgement.create({
      data: {
        riskAssessmentId: id,
        workerName,
        company,
        signatureData,
        signatureIp: ip
      }
    });

    broadcastToOrganization(riskAssessment.project.organizationId, {
      type: 'rams_acknowledged',
      data: { riskAssessmentId: id, acknowledgement }
    });

    return NextResponse.json(acknowledgement);
  } catch {
    console.error('Error adding guest acknowledgement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
