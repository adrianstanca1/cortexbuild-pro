import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



// Generate QR code data for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project belongs to user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user?.organizationId || undefined
      },
      select: {
        id: true,
        name: true,
        location: true,
        organizationId: true,
        organization: {
          select: { name: true }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate QR code URL - this will point to the public check-in page
    const baseUrl = process.env.NEXTAUTH_URL || 'https://cortexbuildpro.com';
    const checkInUrl = `${baseUrl}/site-checkin/${projectId}`;

    // QR code data
    const qrData = {
      checkInUrl,
      projectId: project.id,
      projectName: project.name,
      location: project.location,
      organizationName: project.organization.name,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(qrData);
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
