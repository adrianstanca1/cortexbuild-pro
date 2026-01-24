export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const attachments = await prisma.rFIAttachment.findMany({
      where: { rfiId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error fetching RFI attachments:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, cloud_storage_path, fileSize, mimeType } = await request.json();

    if (!name || !cloud_storage_path) {
      return NextResponse.json({ error: 'name and cloud_storage_path required' }, { status: 400 });
    }

    // Verify RFI exists and belongs to user's organization
    const rfi = await prisma.rFI.findFirst({
      where: {
        id,
        project: { organizationId: session.user.organizationId }
      }
    });

    if (!rfi) {
      return NextResponse.json({ error: 'RFI not found' }, { status: 404 });
    }

    const attachment = await prisma.rFIAttachment.create({
      data: {
        name,
        cloudStoragePath: cloud_storage_path,
        fileSize,
        mimeType,
        rfiId: id
      }
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error creating RFI attachment:', error);
    return NextResponse.json({ error: 'Failed to create attachment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId required' }, { status: 400 });
    }

    const attachment = await prisma.rFIAttachment.findFirst({
      where: {
        id: attachmentId,
        rfi: {
          id,
          project: { organizationId: session.user.organizationId }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Delete from S3
    try {
      await deleteFile(attachment.cloudStoragePath);
    } catch (e) {
      console.warn('Failed to delete file from S3:', e);
    }

    await prisma.rFIAttachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting RFI attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
