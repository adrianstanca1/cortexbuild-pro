/**
 * AI Agent Controller
 * Handles AI agent execution requests
 */

import { Request, Response } from 'express'
import { agentOrchestrator } from '../../services/aiAgents/agentOrchestrator.js'
import { AIAgentType } from '../../types/aiAgent.js'
import { ApiError } from '../../utils/errors.js'
import logger from '../../config/logger.js'

export const aiAgentController = {
  async executeAgent(req: Request, res: Response) {
    try {
      const { agentType, context, input } = req.body
      const userData = req.userData!

      const result = await agentOrchestrator.executeAgent({
        agentType: agentType as AIAgentType,
        context: {
          ...context,
          userId: userData.id,
          organizationId: req.scopeFilter?.organizationId,
        },
        input,
        userId: userData.id,
      })

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('AI agent execution failed', { error: error.message })
      throw new ApiError(500, 'AI agent execution failed')
    }
  },

  async getExecutionHistory(req: Request, res: Response) {
    try {
      const { agentType, status, limit } = req.query
      const scopeFilter = req.scopeFilter || {}

      const history = await agentOrchestrator.getExecutionHistory({
        agentType: agentType as AIAgentType,
        organizationId: scopeFilter?.organizationId,
        status: status as any,
        limit: limit ? parseInt(limit as string) : 50,
      })

      res.json({ success: true, history })
    } catch (error: any) {
      logger.error('Get execution history failed', { error: error.message })
      throw new ApiError(500, 'Failed to fetch execution history')
    }
  },

  async getExecutionById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { prisma } = await import('../../config/database.js')

      const execution = await prisma.aIAgentExecution.findUnique({
        where: { id },
      })

      if (!execution) {
        throw new ApiError(404, 'Execution not found')
      }

      res.json({ success: true, execution })
    } catch (error: any) {
      logger.error('Get execution by ID failed', { error: error.message })
      throw error
    }
  },

  async reviewExecution(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { approved, notes } = req.body
      const userData = req.userData!
      const { prisma } = await import('../../config/database.js')

      const execution = await prisma.aIAgentExecution.update({
        where: { id },
        data: {
          reviewedBy: userData.id,
          reviewedAt: new Date(),
          requiresReview: false,
        },
      })

      res.json({ success: true, execution })
    } catch (error: any) {
      logger.error('Review execution failed', { error: error.message })
      throw new ApiError(500, 'Failed to review execution')
    }
  },
}

