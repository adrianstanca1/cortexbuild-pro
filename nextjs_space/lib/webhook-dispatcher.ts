import { prisma } from "@/lib/db";
import crypto from "crypto";
import { createLogger } from "./logger";

const logger = createLogger("webhook-dispatcher");

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
  data: Record<string, unknown>,
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

    // Fire-and-forget: Send to all webhooks without blocking
    // This improves API response time by not waiting for webhook deliveries
    webhooks.forEach((webhook) => {
      // Each webhook delivery runs independently in the background
      (async () => {
        const startTime = Date.now();
        let success = false;
        let statusCode = 0;
        let responseBody = "";
        let errorMessage = "";

        try {
          // Create signature if secret is set
          const signature = webhook.secret
            ? crypto
                .createHmac("sha256", webhook.secret)
                .update(JSON.stringify(payload))
                .digest("hex")
            : null;

          // Build headers
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Webhook-Event": event,
            "X-Webhook-Timestamp": payload.timestamp,
            ...(signature && { "X-Webhook-Signature": `sha256=${signature}` }),
            ...((webhook.headers as Record<string, string>) || {}),
          };

          // Send request with timeout
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);

          const response = await fetch(webhook.url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          statusCode = response.status;
          responseBody = await response.text().catch(() => "");
          success = response.ok;

          if (!success) {
            errorMessage = `HTTP ${statusCode}: ${responseBody.substring(0, 500)}`;
          }
        } catch (error) {
          errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        }

        const duration = Date.now() - startTime;

        try {
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

          // Use atomic update to handle consecutive failures and disabling
          // This prevents race conditions when multiple deliveries happen simultaneously
          const updatedWebhook = await prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              lastTriggeredAt: new Date(),
              ...(success
                ? { consecutiveFailures: 0 }
                : { consecutiveFailures: { increment: 1 } }),
              // Disable webhook if it reaches 10 consecutive failures
              ...(!success &&
                webhook.consecutiveFailures + 1 >= 10 && { isActive: false }),
            },
            select: { consecutiveFailures: true, isActive: true },
          });

          // Log if webhook was disabled
          if (!updatedWebhook.isActive && !webhook.isActive) {
            console.warn(
              `Webhook ${webhook.id} disabled after ${updatedWebhook.consecutiveFailures} consecutive failures`,
            );
          }
        } catch (dbError) {
          console.error(
            "Webhook delivery logging error (non-blocking):",
            dbError,
          );
        }
      })().catch((error) => {
        // Catch any unhandled errors from the async function
        console.error("Webhook delivery error (non-blocking):", error);
      });
    });

    // Return immediately without waiting for webhook deliveries
  } catch (error) {
    logger.error("Webhook dispatch error:", error);
  }
}

// Test webhook endpoint
export async function testWebhook(webhookId: string): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
}> {
  try {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });
    if (!webhook) {
      return { success: false, statusCode: 0, message: "Webhook not found" };
    }

    const testPayload: WebhookPayload = {
      event: "test",
      timestamp: new Date().toISOString(),
      data: { test: true, message: "This is a test webhook delivery" },
      organizationId: webhook.organizationId,
    };

    const signature = webhook.secret
      ? crypto
          .createHmac("sha256", webhook.secret)
          .update(JSON.stringify(testPayload))
          .digest("hex")
      : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": "test",
      "X-Webhook-Timestamp": testPayload.timestamp,
      ...(signature && { "X-Webhook-Signature": `sha256=${signature}` }),
      ...((webhook.headers as Record<string, string>) || {}),
    };

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
    });

    return {
      success: response.ok,
      statusCode: response.status,
      message: response.ok
        ? "Webhook test successful"
        : `Failed: HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
