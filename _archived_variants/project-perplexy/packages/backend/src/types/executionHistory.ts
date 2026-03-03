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

