export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getFileUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cloud_storage_path, isPublic = false } = await request.json();

    if (!cloud_storage_path) {
      return NextResponse.json({ error: 'cloud_storage_path is required' }, { status: 400 });
    }

    const url = await getFileUrl(cloud_storage_path, isPublic);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('File URL error:', error);
    return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 });
  }
}
