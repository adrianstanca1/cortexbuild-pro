import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';



// Get all webhooks for organization
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Only admins can manage webhooks
    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; organizationId?: string; role?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, url, events, secret, headers } = body;

    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json({ error: 'Name, URL, and at least one event are required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events,
        secret: secret || null,
        headers: headers || {},
        organizationId: user.organizationId,
        createdById: user.id,
        isActive: true,
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
