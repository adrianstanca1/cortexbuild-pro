import { Request, Response, NextFunction } from 'express'
import { costEstimatorService } from '../services/costEstimatorService.js'
import { ApiError } from '../utils/ApiError.js'

export const costEstimatorController = {
  async getCostEstimates(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.query.projectId as string | undefined
      const estimates = await costEstimatorService.getCostEstimates(projectId)
      res.json({ success: true, estimates })
    } catch (error) {
      next(error)
    }
  },

  async getCostEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const { estimateId } = req.params
      const estimate = await costEstimatorService.getCostEstimate(estimateId)
      if (!estimate) {
        throw new ApiError('Cost estimate not found', 404)
      }
      res.json({ success: true, estimate })
    } catch (error) {
      next(error)
    }
  },

  async createCostEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const estimate = await costEstimatorService.createCostEstimate(req.body)
      res.json({ success: true, estimate, msg: 'Cost estimate created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateCostEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const { estimateId } = req.params
      const estimate = await costEstimatorService.updateCostEstimate(estimateId, req.body)
      res.json({ success: true, estimate, msg: 'Cost estimate updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteCostEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const { estimateId } = req.params
      await costEstimatorService.deleteCostEstimate(estimateId)
      res.json({ success: true, message: 'Cost estimate deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await costEstimatorService.getTemplates()
      res.json({ success: true, templates })
    } catch (error) {
      next(error)
    }
  },

  async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId } = req.params
      const template = await costEstimatorService.getTemplate(templateId)
      if (!template) {
        throw new ApiError('Template not found', 404)
      }
      res.json({ success: true, template })
    } catch (error) {
      next(error)
    }
  },

  async getCostEstimatorStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await costEstimatorService.getCostEstimatorStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

