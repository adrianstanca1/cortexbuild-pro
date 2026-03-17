// =====================================================
// BILLING API - Get Invoices
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { stripeService } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { organizationId?: string };
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Get current subscription to find customer ID
    const subscription = await prisma.subscription.findFirst({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json([]);
    }

    // Fetch invoices from database (synced via webhooks)
    const invoices = await prisma.invoice.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // If no invoices in DB, try to fetch from Stripe
    if (invoices.length === 0) {
      const stripeInvoices = await stripeService.getInvoices(subscription.stripeCustomerId, 10);
      return NextResponse.json(stripeInvoices);
    }

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
