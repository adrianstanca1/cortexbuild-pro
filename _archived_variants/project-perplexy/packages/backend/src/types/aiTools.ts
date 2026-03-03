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

