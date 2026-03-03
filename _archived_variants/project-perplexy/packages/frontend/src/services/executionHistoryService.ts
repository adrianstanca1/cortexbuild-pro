import axios from 'axios'

// Use relative URL when VITE_API_URL is empty (for Docker/nginx proxying)
const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface ExecutionHistory {
  id: string
  code: string
  language: string
  filePath?: string
  output: string
  error?: string
  status: 'success' | 'error' | 'running'
  executionTime?: number
  timestamp: Date
}

export const executionHistoryService = {
  async getExecutionHistory(limit: number = 50): Promise<ExecutionHistory[]> {
    const response = await axios.get(`${API_URL}/api/execution-history`, {
      params: { limit },
    })
    const history = response.data.history || []
    return history.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }))
  },

  async getExecutionById(id: string): Promise<ExecutionHistory> {
    const response = await axios.get(`${API_URL}/api/execution-history/${id}`)
    const execution = response.data.execution
    return {
      ...execution,
      timestamp: new Date(execution.timestamp),
    }
  },

  async clearHistory(): Promise<void> {
    await axios.delete(`${API_URL}/api/execution-history`)
  },
}

