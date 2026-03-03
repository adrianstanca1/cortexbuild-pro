import { v4 as uuidv4 } from 'uuid'
import { AITool, CreateAIToolRequest, UpdateAIToolRequest, AIToolRequest, AIToolResponse } from '../types/aiTools.js'
import { ApiError } from '../utils/ApiError.js'

// In-memory storage for demo (replace with database in production)
// Initialize with sample data
const aiTools: AITool[] = [
  {
    id: 'ai-tool-1',
    name: 'Text Summarizer',
    description: 'Summarize long texts into concise summaries',
    category: 'text',
    status: 'active',
    usage: 150,
    lastUsed: new Date('2025-10-14'),
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-10-14'),
  },
  {
    id: 'ai-tool-2',
    name: 'Code Generator',
    description: 'Generate code snippets from natural language descriptions',
    category: 'code',
    status: 'active',
    usage: 89,
    lastUsed: new Date('2025-10-13'),
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-10-13'),
  },
  {
    id: 'ai-tool-3',
    name: 'Data Analyzer',
    description: 'Analyze and visualize data from various sources',
    category: 'analysis',
    status: 'active',
    usage: 234,
    lastUsed: new Date('2025-10-14'),
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-10-14'),
  },
]

const aiToolResponses: AIToolResponse[] = []

export const aiToolsService = {
  async getAITools(): Promise<AITool[]> {
    return aiTools.sort((a, b) => b.usage - a.usage)
  },

  async getAITool(toolId: string): Promise<AITool | null> {
    return aiTools.find((t) => t.id === toolId) || null
  },

  async createAITool(tool: CreateAIToolRequest): Promise<AITool> {
    if (!tool.name || !tool.description || !tool.category) {
      throw new ApiError('Missing required fields', 400)
    }

    const newTool: AITool = {
      id: uuidv4(),
      name: tool.name,
      description: tool.description,
      category: tool.category,
      status: 'pending',
      usage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    aiTools.push(newTool)
    return newTool
  },

  async updateAITool(toolId: string, updates: UpdateAIToolRequest): Promise<AITool> {
    const tool = aiTools.find((t) => t.id === toolId)
    if (!tool) {
      throw new ApiError('AI Tool not found', 404)
    }

    if (updates.name) tool.name = updates.name
    if (updates.description) tool.description = updates.description
    if (updates.category) tool.category = updates.category
    if (updates.status) tool.status = updates.status

    tool.updatedAt = new Date()
    return tool
  },

  async deleteAITool(toolId: string): Promise<void> {
    const index = aiTools.findIndex((t) => t.id === toolId)
    if (index === -1) {
      throw new ApiError('AI Tool not found', 404)
    }
    aiTools.splice(index, 1)
  },

  async executeAITool(request: AIToolRequest): Promise<AIToolResponse> {
    const tool = aiTools.find((t) => t.id === request.toolId)
    if (!tool) {
      throw new ApiError('AI Tool not found', 404)
    }

    if (tool.status !== 'active') {
      throw new ApiError('AI Tool is not active', 400)
    }

    // Simulate AI processing
    let output = ''
    let status: 'success' | 'error' | 'processing' = 'success'
    let error: string | undefined

    try {
      // Placeholder for AI processing
      switch (tool.category) {
        case 'text':
          output = `Summary: ${request.input.substring(0, 100)}...`
          break
        case 'code':
          output = `// Generated code for: ${request.input}\nfunction example() {\n  return "${request.input}";\n}`
          break
        case 'analysis':
          output = JSON.stringify({ analysis: 'Data analyzed successfully', input: request.input })
          break
        default:
          output = `Processed: ${request.input}`
      }

      // Update tool usage
      tool.usage++
      tool.lastUsed = new Date()
    } catch (err) {
      status = 'error'
      error = err instanceof Error ? err.message : 'Unknown error'
    }

    const response: AIToolResponse = {
      id: uuidv4(),
      toolId: request.toolId,
      input: request.input,
      output,
      status,
      error,
      createdAt: new Date(),
    }

    aiToolResponses.push(response)
    return response
  },

  async getAIToolStats(): Promise<{
    total: number
    active: number
    totalUsage: number
    byCategory: Record<string, number>
  }> {
    const total = aiTools.length
    const active = aiTools.filter((t) => t.status === 'active').length
    const totalUsage = aiTools.reduce((sum, t) => sum + t.usage, 0)
    const byCategory: Record<string, number> = {}

    aiTools.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1
    })

    return {
      total,
      active,
      totalUsage,
      byCategory,
    }
  },
}

