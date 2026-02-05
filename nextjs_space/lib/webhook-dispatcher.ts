import { prisma } from '@/lib/db';
import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  organizationId: string;
}

// Dispatch webhook to all subscribers for an event
export async function dispatchWebhook(
  organizationId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Find active webhooks for this organization and event
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      organizationId,
    };

    // Send to all webhooks concurrently
    const deliveries = webhooks.map(async (webhook) => {
      const startTime = Date.now();
      let success = false;
      let statusCode = 0;
      let responseBody = '';
      let errorMessage = '';

      try {
        // Create signature if secret is set
        const signature = webhook.secret
          ? crypto
              .createHmac('sha256', webhook.secret)
              .update(JSON.stringify(payload))
              .digest('hex')
          : null;

        // Build headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Timestamp': payload.timestamp,
          ...(signature && { 'X-Webhook-Signature': `sha256=${signature}` }),
          ...((webhook.headers as Record<string, string>) || {}),
        };

        // Send request with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        statusCode = response.status;
        responseBody = await response.text().catch(() => '');
        success = response.ok;

        if (!success) {
          errorMessage = `HTTP ${statusCode}: ${responseBody.substring(0, 500)}`;
        }
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }

      const duration = Date.now() - startTime;

      // Log delivery attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as object,
          statusCode,
          responseBody: responseBody.substring(0, 5000),
          success,
          errorMessage,
          duration,
        },
      });

      // Update webhook last triggered
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggeredAt: new Date(),
          ...(success ? { consecutiveFailures: 0 } : { consecutiveFailures: { increment: 1 } }),
        },
      });

      // Disable webhook after 10 consecutive failures
      if (!success) {
        const updatedWebhook = await prisma.webhook.findUnique({
          where: { id: webhook.id },
          select: { consecutiveFailures: true },
        });
        if (updatedWebhook && updatedWebhook.consecutiveFailures >= 10) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: { isActive: false },
          });
        }
      }
    });

    await Promise.allSettled(deliveries);
  } catch (error) {
    console.error('Webhook dispatch error:', error);
  }
}

// Test webhook endpoint
export async function testWebhook(webhookId: string): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
}> {
  try {
    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook) {
      return { success: false, statusCode: 0, message: 'Webhook not found' };
    }

    const testPayload: WebhookPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { test: true, message: 'This is a test webhook delivery' },
      organizationId: webhook.organizationId,
    };

    const signature = webhook.secret
      ? crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(testPayload))
          .digest('hex')
      : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': 'test',
      'X-Webhook-Timestamp': testPayload.timestamp,
      ...(signature && { 'X-Webhook-Signature': `sha256=${signature}` }),
      ...((webhook.headers as Record<string, string>) || {}),
    };

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
    });

    return {
      success: response.ok,
      statusCode: response.status,
      message: response.ok ? 'Webhook test successful' : `Failed: HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
