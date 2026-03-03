import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface AITool {
  id: string
  name: string
  description: string
  category: 'text' | 'image' | 'code' | 'analysis' | 'automation'
  status: 'active' | 'inactive' | 'pending'
  usage: number
  lastUsed?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AIToolRequest {
  toolId: string
  input: string
  options?: Record<string, any>
}

export interface AIToolResponse {
  id: string
  toolId: string
  input: string
  output: string
  status: 'success' | 'error' | 'processing'
  error?: string
  createdAt: Date
}

export interface CreateAIToolRequest {
  name: string
  description: string
  category: 'text' | 'image' | 'code' | 'analysis' | 'automation'
}

export interface UpdateAIToolRequest {
  name?: string
  description?: string
  category?: 'text' | 'image' | 'code' | 'analysis' | 'automation'
  status?: 'active' | 'inactive' | 'pending'
}

export interface AIToolStats {
  total: number
  active: number
  totalUsage: number
  byCategory: Record<string, number>
}

function parseAITool(tool: any): AITool {
  return {
    ...tool,
    lastUsed: tool.lastUsed ? new Date(tool.lastUsed) : undefined,
    createdAt: new Date(tool.createdAt),
    updatedAt: new Date(tool.updatedAt),
  }
}

function parseAIToolResponse(response: any): AIToolResponse {
  return {
    ...response,
    createdAt: new Date(response.createdAt),
  }
}

export const aiToolsService = {
  async getAITools(): Promise<AITool[]> {
    const response = await axios.get(`${API_URL}/api/ai-tools`)
    return response.data.tools.map(parseAITool)
  },

  async getAITool(toolId: string): Promise<AITool> {
    const response = await axios.get(`${API_URL}/api/ai-tools/${toolId}`)
    return parseAITool(response.data.tool)
  },

  async createAITool(tool: CreateAIToolRequest): Promise<AITool> {
    const response = await axios.post(`${API_URL}/api/ai-tools`, tool)
    return parseAITool(response.data.tool)
  },

  async updateAITool(toolId: string, updates: UpdateAIToolRequest): Promise<AITool> {
    const response = await axios.put(`${API_URL}/api/ai-tools/${toolId}`, updates)
    return parseAITool(response.data.tool)
  },

  async deleteAITool(toolId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/ai-tools/${toolId}`)
  },

  async executeAITool(request: AIToolRequest): Promise<AIToolResponse> {
    const response = await axios.post(`${API_URL}/api/ai-tools/execute`, request)
    return parseAIToolResponse(response.data.response)
  },

  async getAIToolStats(): Promise<AIToolStats> {
    const response = await axios.get(`${API_URL}/api/ai-tools/stats`)
    return response.data.stats
  },
}

