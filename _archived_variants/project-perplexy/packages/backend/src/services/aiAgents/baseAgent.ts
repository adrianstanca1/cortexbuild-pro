/**
 * Base AI Agent Class
 * Provides common functionality for all AI agents
 */

import { AgentContext, AgentResult } from '../../types/aiAgent.js'
import logger from '../../config/logger.js'

export abstract class BaseAgent {
  protected agentName: string
  protected defaultConfidence: number = 0.8

  constructor(agentName: string) {
    this.agentName = agentName
  }

  /**
   * Execute the agent's main logic
   */
  abstract execute(input: Record<string, any>, context: AgentContext): Promise<AgentResult>

  /**
   * Validate input data
   */
  protected validateInput(input: Record<string, any>, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!input[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
  }

  /**
   * Calculate confidence score
   */
  protected calculateConfidence(factors: {
    dataQuality?: number
    completeness?: number
    consistency?: number
  }): number {
    const { dataQuality = 1, completeness = 1, consistency = 1 } = factors
    return Math.min(1, (dataQuality + completeness + consistency) / 3)
  }

  /**
   * Log agent activity
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    logger[level](`[${this.agentName}] ${message}`, data)
  }

  /**
   * Estimate token usage (placeholder - integrate with actual LLM API)
   */
  protected estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
}

