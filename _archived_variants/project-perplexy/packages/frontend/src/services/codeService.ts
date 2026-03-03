import axios from 'axios'

// Use relative URL when VITE_API_URL is empty (for Docker/nginx proxying)
// If VITE_API_URL is explicitly set to empty string, use relative URLs
// Otherwise, default to localhost for development
const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface ExecutionResult {
  output: string
  error?: string
  status: 'success' | 'error' | 'running'
  executionTime?: number
}

export const codeService = {
  async executeCode(code: string, filePath?: string, language?: string): Promise<ExecutionResult> {
    const response = await axios.post(`${API_URL}/api/execute`, {
      code,
      filePath,
      language: language || 'python',
    })
    return response.data
  },

  async stopExecution(): Promise<void> {
    await axios.post(`${API_URL}/api/execute/stop`)
  },
}

