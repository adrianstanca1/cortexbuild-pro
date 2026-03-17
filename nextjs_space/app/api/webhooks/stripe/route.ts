// =====================================================
// STRIPE WEBHOOK HANDLER
// Handles Stripe events for subscription management
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { getServiceCredentials } from '@/lib/service-registry';
import { verifyStripeWebhookSignature } from '@/lib/stripe';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Stripe event types we handle
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.upcoming',
  'payment_intent.succeeded',
  'payment_intent.payment_failed'
];

// Get Stripe webhook secret from service credentials
async function getWebhookSecret(): Promise<string | null> {
  const credentials = await getServiceCredentials('stripe', 'PRODUCTION');
  if (!credentials) {
    return null;
  }
  return credentials.credentials.webhookSecret || null;
}

// Initialize Stripe client
async function getStripeClient(): Promise<Stripe | null> {
  const credentials = await getServiceCredentials('stripe', 'PRODUCTION');
  if (!credentials) {
    return null;
  }

  const { secretKey } = credentials.credentials;
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia'
  });
}

// Parse Stripe event
async function parseStripeEvent(payload: Buffer, signature: string | null): Promise<Stripe.Event | null> {
  const webhookSecret = await getWebhookSecret();
  if (!webhookSecret) {
    console.error('[Stripe Webhook] No webhook secret configured');
    return null;
  }

  // Verify signature
  const isValid = await verifyStripeWebhookSignature(payload, signature, webhookSecret);
  if (!isValid) {
    console.error('[Stripe Webhook] Invalid signature');
    return null;
  }

  // Parse event
  try {
    const event = Stripe.constructEvent(payload.toString(), signature!, webhookSecret);
    return event;
  } catch (error) {
    console.error('[Stripe Webhook] Error parsing event:', error);
    return null;
  }
}

// =====================================================
// EVENT HANDLERS
// =====================================================

// Handle checkout.session.completed - New subscription created
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  console.log('[Stripe Webhook] Checkout session completed:', session.id);

  const { organizationId, planId, billingCycle } = session.metadata || {};

  if (!organizationId || !planId) {
    console.error('[Stripe Webhook] Missing metadata in checkout session');
    return;
  }

  // Retrieve subscription details from Stripe
  const stripe = await getStripeClient();
  if (!stripe) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Create or update subscription in database
    await prisma.subscription.upsert({
      where: {
        stripeSubscriptionId: subscription.id
      },
      update: {
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        quantity: subscription.items.data[0]?.quantity || 1
      },
      create: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        organizationId,
        planId,
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        quantity: subscription.items.data[0]?.quantity || 1,
        metadata: {
          billingCycle,
          checkoutSessionId: session.id
        }
      }
    });

    // Create subscription item record
    const items = subscription.items.data;
    for (const item of items) {
      await prisma.subscriptionItem.upsert({
        where: { stripeItemId: item.id },
        update: {
          quantity: item.quantity || 1,
          stripePriceId: item.price.id
        },
        create: {
          subscriptionId: organizationId, // This needs to be the actual subscription ID
          stripeItemId: item.id,
          stripePriceId: item.price.id,
          quantity: item.quantity || 1
        }
      });
    }

    console.log('[Stripe Webhook] Subscription created/updated for organization:', organizationId);
  } catch (error) {
    console.error('[Stripe Webhook] Error handling checkout session:', error);
  }
}

// Handle customer.subscription.created
async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log('[Stripe Webhook] Subscription created:', subscription.id);

  const organizationId = subscription.metadata?.organizationId;
  const planId = subscription.metadata?.planId;

  if (!organizationId || !planId) {
    console.error('[Stripe Webhook] Missing metadata in subscription');
    return;
  }

  try {
    await prisma.subscription.create({
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        organizationId,
        planId,
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        quantity: subscription.items.data[0]?.quantity || 1,
        metadata: {
          billingCycle: subscription.metadata?.billingCycle
        }
      }
    });

    console.log('[Stripe Webhook] Subscription record created:', subscription.id);
  } catch (error) {
    console.error('[Stripe Webhook] Error creating subscription:', error);
  }
}

// Handle customer.subscription.updated
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log('[Stripe Webhook] Subscription updated:', subscription.id);

  try {
    const existing = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (!existing) {
      // If subscription doesn't exist in DB, create it
      const organizationId = subscription.metadata?.organizationId;
      const planId = subscription.metadata?.planId;

      if (!organizationId || !planId) {
        console.error('[Stripe Webhook] Missing metadata for new subscription');
        return;
      }

      await prisma.subscription.create({
        data: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          organizationId,
          planId,
          status: mapStripeStatus(subscription.status),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          quantity: subscription.items.data[0]?.quantity || 1
        }
      });
      return;
    }

    // Update existing subscription
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        quantity: subscription.items.data[0]?.quantity || 1
      }
    });

    console.log('[Stripe Webhook] Subscription updated:', subscription.id);
  } catch (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error);
  }
}

// Handle customer.subscription.deleted
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  console.log('[Stripe Webhook] Subscription deleted:', subscription.id);

  try {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: false
      }
    });

    console.log('[Stripe Webhook] Subscription marked as canceled:', subscription.id);
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription deletion:', error);
  }
}

// Handle invoice.paid
async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  console.log('[Stripe Webhook] Invoice paid:', invoice.id);

  const organizationId = invoice.metadata?.organizationId;
  if (!organizationId) {
    // Try to get from subscription
    if (invoice.subscription) {
      const sub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription as string }
      });
      if (sub) {
        await createOrUpdateInvoice(invoice, sub.organizationId);
      }
    }
    return;
  }

  await createOrUpdateInvoice(invoice, organizationId);
}

// Handle invoice.payment_failed
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  console.log('[Stripe Webhook] Invoice payment failed:', invoice.id);

  // Update invoice status
  if (invoice.subscription) {
    const sub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string }
    });

    if (sub) {
      await prisma.invoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        update: {
          status: invoice.status
        },
        create: {
          stripeInvoiceId: invoice.id,
          stripeCustomerId: invoice.customer as string,
          organizationId: sub.organizationId,
          subscriptionId: sub.id,
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          billingReason: invoice.billing_reason
        }
      });

      // Update subscription status if past due
      if (invoice.billing_reason === 'subscription_cycle') {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'PAST_DUE'
          }
        });
      }
    }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Map Stripe status to our enum
function mapStripeStatus(status: string): 'ACTIVE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAST_DUE' | 'PAUSED' | 'TRIALING' | 'UNPAID' {
  switch (status) {
    case 'active': return 'ACTIVE';
    case 'canceled': return 'CANCELED';
    case 'incomplete': return 'INCOMPLETE';
    case 'incomplete_expired': return 'INCOMPLETE_EXPIRED';
    case 'past_due': return 'PAST_DUE';
    case 'paused': return 'PAUSED';
    case 'trialing': return 'TRIALING';
    case 'unpaid': return 'UNPAID';
    default: return 'ACTIVE';
  }
}

// Create or update invoice record
async function createOrUpdateInvoice(invoice: Stripe.Invoice, organizationId: string) {
  const sub = invoice.subscription ? await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string }
  }) : null;

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: {
      amountPaid: invoice.amount_paid,
      status: invoice.status
    },
    create: {
      stripeInvoiceId: invoice.id,
      stripeCustomerId: invoice.customer as string,
      organizationId,
      subscriptionId: sub?.id,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      billingReason: invoice.billing_reason
    }
  });
}

// =====================================================
// MAIN WEBHOOK HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  try {
    // Get raw body
    const rawBody = await request.arrayBuffer();
    const payload = Buffer.from(rawBody);

    // Parse and verify event
    const event = await parseStripeEvent(payload, signature);
    if (!event) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('[Stripe Webhook] Received event:', event.type);

    // Only handle known events
    if (!HANDLED_EVENTS.includes(event.type)) {
      console.log('[Stripe Webhook] Event type not handled:', event.type);
      return NextResponse.json({ received: true });
    }

    // Route to appropriate handler
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;
      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
