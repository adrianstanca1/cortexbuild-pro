import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'project.created',
    'project.updated',
    'project.deleted',
    'task.created',
    'task.updated',
    'task.completed',
    'rfi.created',
    'rfi.answered',
    'submittal.created',
    'submittal.approved',
    'submittal.rejected',
    'change_order.created',
    'change_order.approved',
    'safety.incident.created',
    'notification',
  ])),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const where: Record<string, unknown> = {};
    if (organizationId) where.organizationId = organizationId;

    const webhooks = await prisma.webhook.findMany({
      where,
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        organizationId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Failed to fetch webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    const webhook = await prisma.webhook.create({
      data: {
        url: data.url,
        events: data.events,
        organizationId: '',
        isActive: true,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        organizationId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create webhook:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
