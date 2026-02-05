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
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const certification = await prisma.workerCertification.findUnique({
      where: { id: id },
      include: {
        worker: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } }
      }
    });

    if (!certification) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(certification);
  } catch {
    console.error('Error fetching certification:', error);
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

    const existing = await prisma.workerCertification.findUnique({
      where: { id: id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: any = { ...data };

    // Handle verification
    if (data.isVerified && !existing.isVerified) {
      updateData.verifiedById = session.user.id;
      updateData.verifiedAt = new Date();
    }

    if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
    if (data.expiryDate) updateData.expiryDate = new Date(data.expiryDate);

    const certification = await prisma.workerCertification.update({
      where: { id: id },
      data: updateData,
      include: {
        worker: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } }
      }
    });

    broadcastToOrganization(existing.organizationId, {
      type: 'certification_updated',
      data: certification
    });

    return NextResponse.json(certification);
  } catch {
    console.error('Error updating certification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.workerCertification.findUnique({
      where: { id: id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.workerCertification.delete({ where: { id: id } });

    broadcastToOrganization(existing.organizationId, {
      type: 'certification_deleted',
      data: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch {
    console.error('Error deleting certification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
