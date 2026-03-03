import { v4 as uuidv4 } from 'uuid'
import {
  Integration,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  IntegrationProvider,
  IntegrationSync,
} from '../types/integrations.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const integrationProviders: IntegrationProvider[] = [
  {
    id: 'provider-1',
    name: 'Slack',
    description: 'Integrate with Slack for team communication',
    type: 'oauth',
    icon: 'slack',
    category: 'communication',
    configSchema: {
      clientId: { type: 'string', required: true },
      clientSecret: { type: 'string', required: true },
      workspace: { type: 'string', required: true },
    },
  },
  {
    id: 'provider-2',
    name: 'Google Drive',
    description: 'Integrate with Google Drive for file storage',
    type: 'oauth',
    icon: 'google-drive',
    category: 'storage',
    configSchema: {
      clientId: { type: 'string', required: true },
      clientSecret: { type: 'string', required: true },
      folderId: { type: 'string', required: false },
    },
  },
  {
    id: 'provider-3',
    name: 'Stripe',
    description: 'Integrate with Stripe for payments',
    type: 'api',
    icon: 'stripe',
    category: 'payment',
    configSchema: {
      apiKey: { type: 'string', required: true },
      secretKey: { type: 'string', required: true },
      webhookSecret: { type: 'string', required: false },
    },
  },
  {
    id: 'provider-4',
    name: 'Asana',
    description: 'Integrate with Asana for project management',
    type: 'oauth',
    icon: 'asana',
    category: 'project-management',
    configSchema: {
      clientId: { type: 'string', required: true },
      clientSecret: { type: 'string', required: true },
      workspace: { type: 'string', required: true },
    },
  },
]

const integrations: Integration[] = [
  {
    id: 'integration-1',
    name: 'Slack Integration',
    description: 'Slack integration for team notifications',
    type: 'oauth',
    provider: 'Slack',
    status: 'active',
    config: {
      clientId: 'slack-client-id',
      clientSecret: 'slack-client-secret',
      workspace: 'my-workspace',
    },
    lastSync: new Date('2025-10-14'),
    syncCount: 156,
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-10-14'),
  },
  {
    id: 'integration-2',
    name: 'Google Drive Integration',
    description: 'Google Drive integration for file storage',
    type: 'oauth',
    provider: 'Google Drive',
    status: 'active',
    config: {
      clientId: 'google-client-id',
      clientSecret: 'google-client-secret',
      folderId: 'folder-id',
    },
    lastSync: new Date('2025-10-13'),
    syncCount: 89,
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-10-13'),
  },
]

const integrationSyncs: IntegrationSync[] = []

export const integrationsService = {
  async getProviders(): Promise<IntegrationProvider[]> {
    return integrationProviders.sort((a, b) => a.name.localeCompare(b.name))
  },

  async getProvider(providerId: string): Promise<IntegrationProvider | null> {
    return integrationProviders.find((p) => p.id === providerId) || null
  },

  async getIntegrations(): Promise<Integration[]> {
    return integrations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  },

  async getIntegration(integrationId: string): Promise<Integration | null> {
    return integrations.find((i) => i.id === integrationId) || null
  },

  async createIntegration(integration: CreateIntegrationRequest): Promise<Integration> {
    if (!integration.name || !integration.description || !integration.type || !integration.provider || !integration.config) {
      throw new ApiError('Missing required fields', 400)
    }

    const provider = integrationProviders.find((p) => p.name === integration.provider)
    if (!provider) {
      throw new ApiError('Integration provider not found', 404)
    }

    // Validate config schema
    const configSchema = provider.configSchema
    for (const [key, schema] of Object.entries(configSchema)) {
      if (schema.required && !integration.config[key]) {
        throw new ApiError(`Missing required config field: ${key}`, 400)
      }
    }

    const newIntegration: Integration = {
      id: uuidv4(),
      name: integration.name,
      description: integration.description,
      type: integration.type,
      provider: integration.provider,
      status: 'inactive',
      config: integration.config,
      syncCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    integrations.push(newIntegration)
    return newIntegration
  },

  async updateIntegration(integrationId: string, updates: UpdateIntegrationRequest): Promise<Integration> {
    const integration = integrations.find((i) => i.id === integrationId)
    if (!integration) {
      throw new ApiError('Integration not found', 404)
    }

    if (updates.name) integration.name = updates.name
    if (updates.description) integration.description = updates.description
    if (updates.status) integration.status = updates.status
    if (updates.config) {
      // Validate config schema
      const provider = integrationProviders.find((p) => p.name === integration.provider)
      if (provider) {
        const configSchema = provider.configSchema
        for (const [key, schema] of Object.entries(configSchema)) {
          if (schema.required && !updates.config[key]) {
            throw new ApiError(`Missing required config field: ${key}`, 400)
          }
        }
      }
      integration.config = updates.config
    }

    integration.updatedAt = new Date()
    return integration
  },

  async deleteIntegration(integrationId: string): Promise<void> {
    const index = integrations.findIndex((i) => i.id === integrationId)
    if (index === -1) {
      throw new ApiError('Integration not found', 404)
    }
    integrations.splice(index, 1)
    // Also delete all syncs for this integration
    const syncIndices = integrationSyncs
      .map((s, i) => (s.integrationId === integrationId ? i : -1))
      .filter((i) => i !== -1)
      .reverse()
    syncIndices.forEach((i) => integrationSyncs.splice(i, 1))
  },

  async syncIntegration(integrationId: string): Promise<IntegrationSync> {
    const integration = integrations.find((i) => i.id === integrationId)
    if (!integration) {
      throw new ApiError('Integration not found', 404)
    }

    if (integration.status !== 'active') {
      throw new ApiError('Integration is not active', 400)
    }

    const sync: IntegrationSync = {
      id: uuidv4(),
      integrationId,
      status: 'running',
      startedAt: new Date(),
      recordsProcessed: 0,
    }

    integrationSyncs.push(sync)

    try {
      // Simulate sync process
      sync.recordsProcessed = Math.floor(Math.random() * 100) + 1
      sync.status = 'success'
      sync.completedAt = new Date()

      integration.lastSync = new Date()
      integration.syncCount++
      integration.updatedAt = new Date()
    } catch (error) {
      sync.status = 'error'
      sync.error = error instanceof Error ? error.message : 'Unknown error'
      sync.completedAt = new Date()
    }

    return sync
  },

  async getIntegrationSyncs(integrationId?: string): Promise<IntegrationSync[]> {
    let filteredSyncs = integrationSyncs
    if (integrationId) {
      filteredSyncs = integrationSyncs.filter((s) => s.integrationId === integrationId)
    }
    return filteredSyncs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
  },

  async getIntegrationsStats(): Promise<{
    total: number
    active: number
    totalSyncs: number
    successRate: number
  }> {
    const total = integrations.length
    const active = integrations.filter((i) => i.status === 'active').length
    const totalSyncs = integrations.reduce((sum, i) => sum + i.syncCount, 0)
    const successfulSyncs = integrationSyncs.filter((s) => s.status === 'success').length
    const successRate = integrationSyncs.length > 0 ? (successfulSyncs / integrationSyncs.length) * 100 : 0

    return {
      total,
      active,
      totalSyncs,
      successRate,
    }
  },
}

