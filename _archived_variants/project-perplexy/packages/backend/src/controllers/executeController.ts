import { Request, Response, NextFunction } from 'express'
import { codeExecutionService } from '../services/codeExecutionService.js'

export const executeController = {
  async executeCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, filePath, language = 'python' } = req.body
      const result = await codeExecutionService.executeCode(code, filePath, language)
      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async stopExecution(_req: Request, res: Response, next: NextFunction) {
    try {
      await codeExecutionService.stopExecution()
      res.json({ message: 'Execution stopped' })
    } catch (error) {
      next(error)
    }
  },
}

