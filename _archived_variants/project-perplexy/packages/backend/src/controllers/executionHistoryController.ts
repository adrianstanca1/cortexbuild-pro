import { Request, Response, NextFunction } from 'express'
import { executionHistoryService } from '../services/executionHistoryService.js'
import { ApiError } from '../utils/ApiError.js'

export const executionHistoryController = {
  async getExecutionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50
      const history = await executionHistoryService.getExecutionHistory(limit)
      res.json({
        success: true,
        history,
      })
    } catch (error) {
      next(error)
    }
  },

  async getExecutionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const execution = await executionHistoryService.getExecutionById(id)

      if (!execution) {
        throw new ApiError('Execution not found', 404)
      }

      res.json({
        success: true,
        execution,
      })
    } catch (error) {
      next(error)
    }
  },

  async clearHistory(_req: Request, res: Response, next: NextFunction) {
    try {
      await executionHistoryService.clearHistory()
      res.json({
        success: true,
        message: 'Execution history cleared',
      })
    } catch (error) {
      next(error)
    }
  },
}

