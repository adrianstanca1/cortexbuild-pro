import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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

    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: id,
        OR: [
          { organizationId: session.user.organizationId },
          { isSystemTemplate: true }
        ]
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
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

    const body = await request.json();
    const { name, description, category, tags, version, content } = body;

    // Check if template exists and user has access
    const existing = await prisma.documentTemplate.findFirst({
      where: {
        id: id,
        OR: [
          { organizationId: session.user.organizationId },
          { isSystemTemplate: true, createdById: session.user.id }
        ]
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 });
    }

    // System templates can only be edited by super admins
    if (existing.isSystemTemplate && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'COMPANY_OWNER') {
      return NextResponse.json({ error: 'Cannot edit system templates' }, { status: 403 });
    }

    const template = await prisma.documentTemplate.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category: category as any }),
        ...(tags && { tags }),
        ...(version && { version }),
        ...(content && { content })
      },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
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

    // Check if template exists and user has access
    const existing = await prisma.documentTemplate.findFirst({
      where: {
        id: id,
        OR: [
          { organizationId: session.user.organizationId },
          { isSystemTemplate: true }
        ]
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // System templates can only be deleted by super admins
    if (existing.isSystemTemplate && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'COMPANY_OWNER') {
      return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
    }

    await prisma.documentTemplate.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
