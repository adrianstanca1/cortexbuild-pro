import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface IntegrationProvider {
  id: string
  name: string
  description: string
  type: 'api' | 'webhook' | 'oauth' | 'sdk'
  icon?: string
  category: 'communication' | 'storage' | 'analytics' | 'payment' | 'project-management' | 'other'
  configSchema: Record<string, any>
}

export interface Integration {
  id: string
  name: string
  description: string
  type: 'api' | 'webhook' | 'oauth' | 'sdk'
  provider: string
  status: 'active' | 'inactive' | 'error'
  config: Record<string, any>
  lastSync?: Date
  syncCount: number
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateIntegrationRequest {
  name: string
  description: string
  type: 'api' | 'webhook' | 'oauth' | 'sdk'
  provider: string
  config: Record<string, any>
}

export interface UpdateIntegrationRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive' | 'error'
  config?: Record<string, any>
}

export interface IntegrationSync {
  id: string
  integrationId: string
  status: 'success' | 'error' | 'running'
  startedAt: Date
  completedAt?: Date
  recordsProcessed: number
  error?: string
}

export interface IntegrationsStats {
  total: number
  active: number
  totalSyncs: number
  successRate: number
}

function parseIntegration(integration: any): Integration {
  return {
    ...integration,
    lastSync: integration.lastSync ? new Date(integration.lastSync) : undefined,
    createdAt: new Date(integration.createdAt),
    updatedAt: new Date(integration.updatedAt),
  }
}

function parseIntegrationSync(sync: any): IntegrationSync {
  return {
    ...sync,
    startedAt: new Date(sync.startedAt),
    completedAt: sync.completedAt ? new Date(sync.completedAt) : undefined,
  }
}

export const integrationsService = {
  async getProviders(): Promise<IntegrationProvider[]> {
    const response = await axios.get(`${API_URL}/api/integrations/providers`)
    return response.data.providers
  },

  async getProvider(providerId: string): Promise<IntegrationProvider> {
    const response = await axios.get(`${API_URL}/api/integrations/providers/${providerId}`)
    return response.data.provider
  },

  async getIntegrations(): Promise<Integration[]> {
    const response = await axios.get(`${API_URL}/api/integrations`)
    return response.data.integrations.map(parseIntegration)
  },

  async getIntegration(integrationId: string): Promise<Integration> {
    const response = await axios.get(`${API_URL}/api/integrations/${integrationId}`)
    return parseIntegration(response.data.integration)
  },

  async createIntegration(integration: CreateIntegrationRequest): Promise<Integration> {
    const response = await axios.post(`${API_URL}/api/integrations`, integration)
    return parseIntegration(response.data.integration)
  },

  async updateIntegration(integrationId: string, updates: UpdateIntegrationRequest): Promise<Integration> {
    const response = await axios.put(`${API_URL}/api/integrations/${integrationId}`, updates)
    return parseIntegration(response.data.integration)
  },

  async deleteIntegration(integrationId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/integrations/${integrationId}`)
  },

  async syncIntegration(integrationId: string): Promise<IntegrationSync> {
    const response = await axios.post(`${API_URL}/api/integrations/${integrationId}/sync`)
    return parseIntegrationSync(response.data.sync)
  },

  async getIntegrationSyncs(integrationId?: string): Promise<IntegrationSync[]> {
    const params = integrationId ? { integrationId } : {}
    const response = await axios.get(`${API_URL}/api/integrations/syncs`, { params })
    return response.data.syncs.map(parseIntegrationSync)
  },

  async getIntegrationsStats(): Promise<IntegrationsStats> {
    const response = await axios.get(`${API_URL}/api/integrations/stats`)
    return response.data.stats
  },
}

