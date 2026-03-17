// =====================================================
// BILLING PAGE - Subscription Management
// =====================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { stripeService, AVAILABLE_PLANS, StripePlan } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// Initialize Stripe (client-side only)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Billing cycle type
type BillingCycle = 'month' | 'year';

// Subscription data
interface SubscriptionData {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('month');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Fetch current subscription
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/billing/subscription');
        if (response.ok) {
          const data = await response.json();
          setCurrentSubscription(data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  // Handle checkout session creation
  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
          if (result.error) {
            toast.error(result.error.message);
          }
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Handle portal session for managing subscription
  const handleManageSubscription = async () => {
    setPortalLoading(true);

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  // Handle cancel subscription
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will have access until the end of your billing period.')) {
      return;
    }

    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      toast.success('Subscription canceled at end of period');
      setCurrentSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    }
  };

  // Handle reactivate subscription
  const handleReactivate = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PUT'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      toast.success('Subscription reactivated');
      setCurrentSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: false } : null);
    } catch (error) {
      console.error('Reactivate error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reactivate subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription, view invoices, and update billing information
          </p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Current Subscription
                <Badge variant={currentSubscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {currentSubscription.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                {AVAILABLE_PLANS.find(p => p.id === currentSubscription.planId)?.name || currentSubscription.planId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Billing Period Ends</p>
                  <p className="font-medium">
                    {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-renewal</p>
                  <p className="font-medium">
                    {currentSubscription.cancelAtPeriodEnd ? 'Canceled' : 'Enabled'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading}>
                {portalLoading && <Loader2 className="mr-2 h-4 w-2 animate-spin" />}
                Manage Subscription
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              {currentSubscription.cancelAtPeriodEnd ? (
                <Button variant="outline" onClick={handleReactivate}>
                  Reactivate
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {/* Available Plans */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Plans</h2>
            <div className="flex gap-2">
              <Button
                variant={billingCycle === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingCycle('month')}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBillingCycle('year')}
              >
                Annual
                <Badge variant="secondary" className="ml-2">Save 2 months</Badge>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {AVAILABLE_PLANS.map((plan) => {
              const price = billingCycle === 'year' ? plan.annualPrice : plan.monthlyPrice;
              const isCurrentPlan = currentSubscription?.planId === plan.id;

              return (
                <Card key={plan.id} className={isCurrentPlan ? 'border-primary' : ''}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">${price / 100}</span>
                      <span className="text-muted-foreground">
                        /{billingCycle === 'year' ? 'year' : 'month'}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleCheckout(plan.id)}
                        disabled={checkoutLoading === plan.id}
                      >
                        {checkoutLoading === plan.id && (
                          <Loader2 className="mr-2 h-4 w-2 animate-spin" />
                        )}
                        {currentSubscription ? 'Change Plan' : 'Get Started'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Invoices Section */}
        {currentSubscription && (
          <InvoicesSection customerId={currentSubscription.id} />
        )}
      </div>
    </div>
  );
}

// Invoice history component
function InvoicesSection({ customerId }: { customerId: string }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const response = await fetch('/api/billing/invoices');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [customerId]);

  if (loading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
        <CardDescription>View and download your past invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground">No invoices yet</p>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">Invoice {invoice.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.created).toLocaleDateString()} - {invoice.status}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-medium">
                    ${(invoice.amountDue / 100).toFixed(2)} {invoice.currency}
                  </p>
                  {invoice.hostedInvoiceUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                        View
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
