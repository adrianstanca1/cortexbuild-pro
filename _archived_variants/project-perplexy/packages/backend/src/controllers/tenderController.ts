import { Request, Response, NextFunction } from 'express'
import { tenderService } from '../services/tenderService.js'
import { ApiError } from '../utils/ApiError.js'

export const tenderController = {
  async getTenders(req: Request, res: Response, next: NextFunction) {
    try {
      const tenders = await tenderService.getTenders()
      res.json({ success: true, tenders })
    } catch (error) {
      next(error)
    }
  },

  async getTender(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenderId } = req.params
      const tender = await tenderService.getTender(tenderId)
      if (!tender) {
        throw new ApiError('Tender not found', 404)
      }
      res.json({ success: true, tender })
    } catch (error) {
      next(error)
    }
  },

  async createTender(req: Request, res: Response, next: NextFunction) {
    try {
      const tender = await tenderService.createTender(req.body)
      res.json({ success: true, tender, message: 'Tender created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateTender(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenderId } = req.params
      const tender = await tenderService.updateTender(tenderId, req.body)
      res.json({ success: true, tender, message: 'Tender updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteTender(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenderId } = req.params
      await tenderService.deleteTender(tenderId)
      res.json({ success: true, message: 'Tender deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getTenderStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await tenderService.getTenderStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

