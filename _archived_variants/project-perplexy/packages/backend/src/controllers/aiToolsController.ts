import { Request, Response, NextFunction } from 'express'
import { aiToolsService } from '../services/aiToolsService.js'
import { ApiError } from '../utils/ApiError.js'

export const aiToolsController = {
  async getAITools(req: Request, res: Response, next: NextFunction) {
    try {
      const tools = await aiToolsService.getAITools()
      res.json({ success: true, tools })
    } catch (error) {
      next(error)
    }
  },

  async getAITool(req: Request, res: Response, next: NextFunction) {
    try {
      const { toolId } = req.params
      const tool = await aiToolsService.getAITool(toolId)
      if (!tool) {
        throw new ApiError('AI Tool not found', 404)
      }
      res.json({ success: true, tool })
    } catch (error) {
      next(error)
    }
  },

  async createAITool(req: Request, res: Response, next: NextFunction) {
    try {
      const tool = await aiToolsService.createAITool(req.body)
      res.json({ success: true, tool, msg: 'AI Tool created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateAITool(req: Request, res: Response, next: NextFunction) {
    try {
      const { toolId } = req.params
      const tool = await aiToolsService.updateAITool(toolId, req.body)
      res.json({ success: true, tool, msg: 'AI Tool updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteAITool(req: Request, res: Response, next: NextFunction) {
    try {
      const { toolId } = req.params
      await aiToolsService.deleteAITool(toolId)
      res.json({ success: true, message: 'AI Tool deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async executeAITool(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await aiToolsService.executeAITool(req.body)
      res.json({ success: true, response })
    } catch (error) {
      next(error)
    }
  },

  async getAIToolStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await aiToolsService.getAIToolStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

