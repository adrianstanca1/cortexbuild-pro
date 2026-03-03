import { ExecutionHistory } from '../types/executionHistory.js'

// In-memory storage for demo (replace with database in production)
const executionHistory: ExecutionHistory[] = []

export const executionHistoryService = {
  /**
   * Add execution to history
   */
  async addExecution(history: Omit<ExecutionHistory, 'id' | 'timestamp'>): Promise<ExecutionHistory> {
    const newHistory: ExecutionHistory = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...history,
      timestamp: new Date(),
    }

    executionHistory.push(newHistory)

    // Keep only last 100 executions
    if (executionHistory.length > 100) {
      executionHistory.shift()
    }

    return newHistory
  },

  /**
   * Get execution history
   */
  async getExecutionHistory(limit: number = 50): Promise<ExecutionHistory[]> {
    return executionHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  },

  /**
   * Get execution by ID
   */
  async getExecutionById(id: string): Promise<ExecutionHistory | null> {
    return executionHistory.find((exec) => exec.id === id) || null
  },

  /**
   * Clear execution history
   */
  async clearHistory(): Promise<void> {
    executionHistory.length = 0
  },
}

