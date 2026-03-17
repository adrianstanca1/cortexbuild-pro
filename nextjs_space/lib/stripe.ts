// =====================================================
// STRIPE SERVICE - BILLING & SUBSCRIPTION MANAGEMENT
// Follows existing service-registry pattern
// =====================================================

import Stripe from 'stripe';
import { getServiceCredentials, ServiceEnvironment } from './service-registry';
import { prisma } from './db';

// Stripe plan/price definitions
export interface StripePlan {
  id: string;
  name: string;
  description: string;
  stripePriceId: string; // Stripe Price ID
  stripeProductId: string; // Stripe Product ID
  monthlyPrice: number; // in cents
  annualPrice: number; // in cents
  features: string[];
  limits: {
    maxUsers: number;
    maxProjects: number;
    storageGB: number;
    maxOrganizations?: number; // For reseller plans
  };
  isCustom?: boolean;
}

// Subscription status types
export type SubscriptionStatus = 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'paused' | 'trialing' | 'unpaid';

// Subscription data for organization
export interface OrganizationSubscription {
  id: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  quantity: number;
  organizationId: string;
}

// Checkout session options
export interface CreateCheckoutSessionOptions {
  organizationId: string;
  planId: string;
  billingCycle: 'month' | 'year';
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}

// Customer portal options
export interface CreatePortalSessionOptions {
  organizationId: string;
  customerId: string;
  returnUrl: string;
}

// Invoice data
export interface InvoiceData {
  id: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  created: Date;
  invoiceUrl?: string;
  hostedInvoiceUrl?: string;
}

// Available plans - configure based on your Stripe products
export const AVAILABLE_PLANS: StripePlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Essential features for small teams',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID || '',
    monthlyPrice: 4900, // $49/month
    annualPrice: 49000, // $490/year (2 months free)
    features: [
      'Up to 10 projects',
      'Up to 5 team members',
      '10 GB storage',
      'Basic reporting',
      'Email support'
    ],
    limits: {
      maxUsers: 5,
      maxProjects: 10,
      storageGB: 10
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced features for growing companies',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
    stripeProductId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID || '',
    monthlyPrice: 9900, // $99/month
    annualPrice: 99000, // $990/year
    features: [
      'Unlimited projects',
      'Up to 50 team members',
      '100 GB storage',
      'Advanced reporting & analytics',
      'Priority support',
      'API access',
      'Custom workflows'
    ],
    limits: {
      maxUsers: 50,
      maxProjects: 100,
      storageGB: 100
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full platform access for large organizations',
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID || '',
    monthlyPrice: 24900, // $249/month
    annualPrice: 249000, // $2,490/year
    features: [
      'Everything in Professional',
      'Unlimited team members',
      '1 TB storage',
      'White-label options',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'Advanced security'
    ],
    limits: {
      maxUsers: 1000,
      maxProjects: 1000,
      storageGB: 1000
    }
  }
];

// Get plan by ID
export function getPlanById(planId: string): StripePlan | undefined {
  return AVAILABLE_PLANS.find(p => p.id === planId);
}

// Stripe SDK client - lazily initialized
let stripeClient: Stripe | null = null;

async function getStripeClient(): Promise<Stripe | null> {
  if (stripeClient) {
    return stripeClient;
  }

  const credentials = await getServiceCredentials('stripe', 'PRODUCTION');
  if (!credentials) {
    return null;
  }

  const { secretKey } = credentials.credentials;
  if (!secretKey) {
    return null;
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia'
  });

  return stripeClient;
}

// =====================================================
// STRIPE SERVICE CLASS
// =====================================================

export class StripeService {
  private environment: ServiceEnvironment;

  constructor(environment: ServiceEnvironment = 'PRODUCTION') {
    this.environment = environment;
  }

  // Get or create Stripe customer for organization
  async getOrCreateCustomer(organizationId: string, userEmail: string, userName?: string): Promise<string | null> {
    try {
      // Check if we have an existing customer ID stored
      const subscription = await prisma.subscription.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      });

      if (subscription?.stripeCustomerId) {
        return subscription.stripeCustomerId;
      }

      const stripe = await getStripeClient();
      if (!stripe) {
        console.error('Stripe not configured');
        return null;
      }

      // Search for existing customer by email
      const existingCustomers = await stripe.customers.search({
        query: `email:'${userEmail}'`
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0].id;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName,
        metadata: {
          organizationId
        }
      });

      return customer.id;
    } catch (error) {
      console.error('Error getting/creating Stripe customer:', error);
      return null;
    }
  }

  // Create checkout session for new subscription
  async createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<{ url?: string; sessionId?: string; error?: string }> {
    try {
      const stripe = await getStripeClient();
      if (!stripe) {
        return { error: 'Stripe is not configured' };
      }

      const plan = getPlanById(options.planId);
      if (!plan) {
        return { error: 'Invalid plan ID' };
      }

      const priceId = options.billingCycle === 'year'
        ? plan.stripePriceId // You would typically have separate price IDs for monthly/annual
        : plan.stripePriceId;

      // Get or create customer
      const org = await prisma.organization.findUnique({
        where: { id: options.organizationId }
      });

      if (!org) {
        return { error: 'Organization not found' };
      }

      const owner = await prisma.user.findFirst({
        where: { organizationId: options.organizationId, role: 'COMPANY_OWNER' }
      });

      if (!owner) {
        return { error: 'Organization owner not found' };
      }

      const customerId = options.customerId || await this.getOrCreateCustomer(
        options.organizationId,
        owner.email,
        owner.name
      );

      if (!customerId) {
        return { error: 'Failed to create Stripe customer' };
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        metadata: {
          organizationId: options.organizationId,
          planId: options.planId,
          billingCycle: options.billingCycle
        },
        allow_promotion_codes: true,
        automatic_tax: { enabled: true }
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { error: error instanceof Error ? error.message : 'Failed to create checkout session' };
    }
  }

  // Create customer portal session for managing subscriptions
  async createPortalSession(options: CreatePortalSessionOptions): Promise<{ url?: string; error?: string }> {
    try {
      const stripe = await getStripeClient();
      if (!stripe) {
        return { error: 'Stripe is not configured' };
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: options.customerId,
        return_url: options.returnUrl
      });

      return { url: session.url };
    } catch (error) {
      console.error('Error creating portal session:', error);
      return { error: error instanceof Error ? error.message : 'Failed to create portal session' };
    }
  }

  // Get subscription status for organization
  async getOrganizationSubscription(organizationId: string): Promise<OrganizationSubscription | null> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { organizationId, status: { in: ['active', 'trialing'] } },
        orderBy: { createdAt: 'desc' }
      });

      if (!subscription) {
        return null;
      }

      return {
        id: subscription.id,
        stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
        stripeCustomerId: subscription.stripeCustomerId || undefined,
        planId: subscription.planId,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        quantity: subscription.quantity,
        organizationId: subscription.organizationId
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  // Get invoices for organization
  async getInvoices(customerId: string, limit: number = 10): Promise<InvoiceData[]> {
    try {
      const stripe = await getStripeClient();
      if (!stripe) {
        return [];
      }

      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit
      });

      return invoices.data.map(inv => ({
        id: inv.id,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        currency: inv.currency.toUpperCase(),
        status: inv.status,
        created: new Date(inv.created * 1000),
        invoiceUrl: inv.hosted_invoice_url,
        hostedInvoiceUrl: inv.hosted_invoice_url
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  // Cancel subscription at period end
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = await getStripeClient();
      if (!stripe) {
        return { success: false, error: 'Stripe is not configured' };
      }

      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription?.stripeSubscriptionId) {
        return { success: false, error: 'Stripe subscription ID not found' };
      }

      // Update to cancel at period end (don't cancel immediately)
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { cancelAtPeriodEnd: true }
      });

      return { success: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' };
    }
  }

  // Reactivate subscription (undo cancel at period end)
  async reactivateSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = await getStripeClient();
      if (!stripe) {
        return { success: false, error: 'Stripe is not configured' };
      }

      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription?.stripeSubscriptionId) {
        return { success: false, error: 'Stripe subscription ID not found' };
      }

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { cancelAtPeriodEnd: false }
      });

      return { success: true };
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to reactivate subscription' };
    }
  }

  // Update subscription plan/quantity
  async updateSubscription(subscriptionId: string, newPriceId: string, quantity?: number): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = await getStripeClient();
      if (!stripe) {
        return { success: false, error: 'Stripe is not configured' };
      }

      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription?.stripeSubscriptionId) {
        return { success: false, error: 'Stripe subscription ID not found' };
      }

      const items = await stripe.subscriptionItems.list({
        subscription: subscription.stripeSubscriptionId
      });

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{
          id: items.data[0].id,
          price: newPriceId,
          quantity: quantity || 1
        }],
        proration_behavior: 'create_prorations'
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update subscription' };
    }
  }

  // Test connection (for service registry)
  async testConnection(): Promise<{ success: boolean; message?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      const stripe = await getStripeClient();
      if (!stripe) {
        return { success: false, message: 'Stripe is not configured' };
      }

      // Test by fetching balance
      await stripe.balance.retrieve();

      return {
        success: true,
        message: 'Stripe connection successful',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        responseTime: Date.now() - startTime
      };
    }
  }
}

// =====================================================
// WEBHOOK SIGNATURE VERIFICATION
// Uses existing encryption.ts for HMAC verification
// =====================================================

export async function verifyStripeWebhookSignature(
  payload: Buffer,
  signature: string | null,
  webhookSecret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  const crypto = require('crypto');

  // Stripe sends signatures in format: t=timestamp,v1=signature
  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.substring(2);
  const signatures = parts.filter(p => p.startsWith('v1=')).map(p => p.substring(3));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // Check timestamp tolerance (5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // Create expected signature
  const signedPayload = `${timestamp}.${payload.toString()}`;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures
  return signatures.some(sig => crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  ));
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const stripeService = new StripeService('PRODUCTION');
