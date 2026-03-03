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

export interface IntegrationProvider {
  id: string
  name: string
  description: string
  type: 'api' | 'webhook' | 'oauth' | 'sdk'
  icon?: string
  category: 'communication' | 'storage' | 'analytics' | 'payment' | 'project-management' | 'other'
  configSchema: Record<string, any>
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

