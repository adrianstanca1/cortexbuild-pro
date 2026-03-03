/**
 * Webhook Service
 * Manages webhook registrations and deliveries
 */

import { prisma } from '../config/database.js'
import logger from '../config/logger.js'
import crypto from 'crypto'

interface CreateWebhookInput {
  organizationId: string
  url: string
  events: string[]
  secret?: string
  active?: boolean
}

class WebhookService {
  private webhooks: Map<string, any> = new Map() // In-memory for now

  async getWebhooks(scopeFilter: any) {
    // In production, would query database
    return Array.from(this.webhooks.values()).filter(
      (w) => w.organizationId === scopeFilter.organizationId
    )
  }

  async getWebhookById(id: string, scopeFilter: any) {
    const webhook = this.webhooks.get(id)
    if (!webhook || webhook.organizationId !== scopeFilter.organizationId) {
      return null
    }
    return webhook
  }

  async createWebhook(input: CreateWebhookInput) {
    const webhook = {
      id: crypto.randomUUID(),
      ...input,
      secret: input.secret || crypto.randomBytes(32).toString('hex'),
      active: input.active !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.webhooks.set(webhook.id, webhook)
    return webhook
  }

  async updateWebhook(id: string, updates: any, scopeFilter: any) {
    const webhook = this.webhooks.get(id)
    if (!webhook || webhook.organizationId !== scopeFilter.organizationId) {
      throw new Error('Webhook not found')
    }

    const updated = {
      ...webhook,
      ...updates,
      updatedAt: new Date(),
    }

    this.webhooks.set(id, updated)
    return updated
  }

  async deleteWebhook(id: string, scopeFilter: any) {
    const webhook = this.webhooks.get(id)
    if (webhook && webhook.organizationId === scopeFilter.organizationId) {
      this.webhooks.delete(id)
    }
  }

  async testWebhook(id: string, scopeFilter: any) {
    const webhook = await this.getWebhookById(id, scopeFilter)
    if (!webhook) {
      throw new Error('Webhook not found')
    }

    try {
      const payload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: { message: 'Test webhook delivery' },
      }

      const signature = this.generateSignature(JSON.stringify(payload), webhook.secret)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'webhook.test',
        },
        body: JSON.stringify(payload),
      })

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      }
    } catch (error: any) {
      logger.error('Webhook test failed', { error: error.message })
      throw error
    }
  }

  async getWebhookDeliveries(id: string, scopeFilter: any) {
    // Placeholder - would query delivery history
    return []
  }

  /**
   * Trigger webhook for an event
   */
  async triggerWebhook(event: string, data: any, organizationId: string) {
    const webhooks = await this.getWebhooks({ organizationId })
    const relevantWebhooks = webhooks.filter(
      (w) => w.active && (w.events.includes(event) || w.events.includes('*'))
    )

    for (const webhook of relevantWebhooks) {
      try {
        const payload = {
          event,
          timestamp: new Date().toISOString(),
          data,
        }

        const signature = this.generateSignature(JSON.stringify(payload), webhook.secret)

        await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
          },
          body: JSON.stringify(payload),
        })

        logger.info(`Webhook delivered: ${webhook.id}`, { event })
      } catch (error: any) {
        logger.error(`Webhook delivery failed: ${webhook.id}`, { error: error.message })
      }
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }
}

export const webhookService = new WebhookService()

