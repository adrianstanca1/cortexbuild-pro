export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { broadcastToOrganization } from '@/lib/realtime-clients';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('workerId');
    const type = searchParams.get('type');
    const expiringSoon = searchParams.get('expiringSoon');

    const where: Prisma.WorkerCertificationWhereInput = {
      organizationId: session.user.organizationId ?? undefined
    };
    
    if (workerId) {
      where.workerId = workerId;
    }
    
    if (type) {
      where.certificationType = type as any;
    }

    // Get certs expiring in next 30 days
    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = {
        lte: thirtyDaysFromNow,
        gte: new Date()
      };
      where.isLifetime = false;
    }

    const certifications = await prisma.workerCertification.findMany({
      where,
      include: {
        worker: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }]
    });

    return NextResponse.json(certifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
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

    const certification = await prisma.workerCertification.create({
      data: {
        workerId: data.workerId,
        certificationType: data.certificationType,
        certificationName: data.certificationName,
        cardNumber: data.cardNumber,
        issuingBody: data.issuingBody,
        issueDate: new Date(data.issueDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        isLifetime: data.isLifetime || false,
        documentUrl: data.documentUrl,
        notes: data.notes,
        organizationId: session.user.organizationId!
      },
      include: {
        worker: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'created',
        entityType: 'WorkerCertification',
        entityId: certification.id,
        entityName: `${data.certificationName} for ${certification.worker.name}`,
        userId: session.user.id
      }
    });

    broadcastToOrganization(session.user.organizationId!, {
      type: 'certification_created',
      data: certification
    });

    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error('Error creating certification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
