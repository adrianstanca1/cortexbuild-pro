/**
 * ConstructAI SDK
 * Plugin architecture and extensibility framework
 */

export interface PluginConfig {
  id: string
  name: string
  version: string
  description: string
  author: string
  entryPoint: string
  permissions: string[]
  hooks?: {
    [key: string]: Function
  }
}

export interface SDKConfig {
  apiUrl: string
  token?: string
  organizationId?: string
  projectId?: string
}

export class ConstructAISDK {
  private config: SDKConfig
  private plugins: Map<string, PluginConfig> = new Map()

  constructor(config: SDKConfig) {
    this.config = config
  }

  /**
   * Register a plugin
   */
  registerPlugin(plugin: PluginConfig): void {
    this.plugins.set(plugin.id, plugin)
    console.log(`Plugin registered: ${plugin.name} v${plugin.version}`)
  }

  /**
   * Execute a plugin hook
   */
  async executeHook(hookName: string, data: any): Promise<any> {
    const results: any[] = []
    
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks && plugin.hooks[hookName]) {
        try {
          const result = await plugin.hooks[hookName](data, this)
          results.push({ pluginId: plugin.id, result })
        } catch (error) {
          console.error(`Hook ${hookName} failed in plugin ${plugin.id}:`, error)
        }
      }
    }
    
    return results
  }

  /**
   * API client methods
   */
  async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.apiUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.config.token && { Authorization: `Bearer ${this.config.token}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Project methods
  async getProjects() {
    return this.apiRequest('/api/v1/projects')
  }

  async getProject(id: string) {
    return this.apiRequest(`/api/v1/projects/${id}`)
  }

  // Field data methods
  async createFieldData(data: any) {
    return this.apiRequest('/api/v1/field', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Task methods
  async getTasks(filters?: any) {
    const params = new URLSearchParams(filters).toString()
    return this.apiRequest(`/api/v1/tasks?${params}`)
  }

  async createTask(data: any) {
    return this.apiRequest('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // AI Agent methods
  async executeAgent(agentType: string, input: any, context?: any) {
    return this.apiRequest('/api/v1/ai-agents/execute', {
      method: 'POST',
      body: JSON.stringify({
        agentType,
        input,
        context: {
          ...context,
          organizationId: this.config.organizationId,
          projectId: this.config.projectId,
        },
      }),
    })
  }

  // Webhook registration
  async registerWebhook(url: string, events: string[]) {
    return this.apiRequest('/api/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    })
  }

  // Event emitter for plugins
  private events: Map<string, Function[]> = new Map()

  on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(handler)
  }

  emit(event: string, data: any): void {
    const handlers = this.events.get(event) || []
    handlers.forEach((handler) => handler(data))
  }
}

// Export singleton instance
export const sdk = new ConstructAISDK({
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
})
