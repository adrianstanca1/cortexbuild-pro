import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  organizationId: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { organizationId },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    if (!subscription) {
      return NextResponse.json({ 
        subscription: null,
        entitlements: getEntitlements('FREE'),
      });
    }

    return NextResponse.json({
      subscription,
      entitlements: getEntitlements(subscription.plan),
    });
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createSubscriptionSchema.parse(body);

    const existing = await prisma.subscription.findFirst({
      where: { organizationId: data.organizationId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Organization already has a subscription' }, { status: 409 });
    }

    const subscription = await prisma.subscription.create({
      data: {
        plan: data.plan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        organizationId: data.organizationId,
      },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

function getEntitlements(plan: string) {
  const entitlements = {
    FREE: {
      projects: 1,
      users: 2,
      storage: 1,
      apiAccess: false,
      analytics: false,
      prioritySupport: false,
      customBranding: false,
      advancedSecurity: false,
    },
    STARTER: {
      projects: 5,
      users: 10,
      storage: 10,
      apiAccess: true,
      analytics: false,
      prioritySupport: false,
      customBranding: false,
      advancedSecurity: false,
    },
    PROFESSIONAL: {
      projects: -1,
      users: 50,
      storage: 100,
      apiAccess: true,
      analytics: true,
      prioritySupport: true,
      customBranding: true,
      advancedSecurity: false,
    },
    ENTERPRISE: {
      projects: -1,
      users: -1,
      storage: 1000,
      apiAccess: true,
      analytics: true,
      prioritySupport: true,
      customBranding: true,
      advancedSecurity: true,
    },
  };
  return entitlements[plan as keyof typeof entitlements] || entitlements.FREE;
}
