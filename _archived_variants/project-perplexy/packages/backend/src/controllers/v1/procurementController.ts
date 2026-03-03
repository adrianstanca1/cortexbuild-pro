/**
 * Procurement Controller (v1)
 */

import { Request, Response } from 'express'
import { procurementService } from '../../services/procurementService.js'
import { procurementAgent } from '../../services/aiAgents/procurementAgent.js'
import { ApiError } from '../../utils/errors.js'
import logger from '../../config/logger.js'

export const procurementController = {
  async getProcurements(req: Request, res: Response) {
    try {
      const { projectId, type, status } = req.query
      const scopeFilter = req.scopeFilter || {}

      const procurements = await procurementService.getProcurements({
        ...scopeFilter,
        projectId: projectId as string,
        type: type as string,
        status: status as string,
      })

      res.json({ success: true, procurements })
    } catch (error: any) {
      logger.error('Get procurements failed', { error: error.message })
      throw new ApiError(500, 'Failed to fetch procurements')
    }
  },

  async getProcurementById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const procurement = await procurementService.getProcurementById(id, scopeFilter)

      if (!procurement) {
        throw new ApiError(404, 'Procurement not found')
      }

      res.json({ success: true, procurement })
    } catch (error: any) {
      logger.error('Get procurement by ID failed', { error: error.message })
      throw error
    }
  },

  async createProcurement(req: Request, res: Response) {
    try {
      const scopeFilter = req.scopeFilter || {}

      const procurement = await procurementService.createProcurement({
        ...req.body,
        organizationId: scopeFilter.organizationId,
        deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      })

      res.status(201).json({ success: true, procurement })
    } catch (error: any) {
      logger.error('Create procurement failed', { error: error.message })
      throw new ApiError(500, 'Failed to create procurement')
    }
  },

  async updateProcurement(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const procurement = await procurementService.updateProcurement(id, req.body, scopeFilter)

      res.json({ success: true, procurement })
    } catch (error: any) {
      logger.error('Update procurement failed', { error: error.message })
      throw error
    }
  },

  async deleteProcurement(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      await procurementService.deleteProcurement(id, scopeFilter)

      res.json({ success: true, message: 'Procurement deleted' })
    } catch (error: any) {
      logger.error('Delete procurement failed', { error: error.message })
      throw error
    }
  },

  async selectVendor(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { requirements, budget, deadline } = req.body
      const scopeFilter = req.scopeFilter || {}

      const procurement = await procurementService.getProcurementById(id, scopeFilter)
      if (!procurement) {
        throw new ApiError(404, 'Procurement not found')
      }

      const result = await procurementAgent.execute(
        {
          type: procurement.type,
          requirements: requirements || [],
          budget: budget || procurement.estimatedValue,
          deadline: deadline ? new Date(deadline) : procurement.deadline,
        },
        scopeFilter
      )

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Select vendor failed', { error: error.message })
      throw new ApiError(500, 'Vendor selection failed')
    }
  },

  async analyzeBids(req: Request, res: Response) {
    try {
      const { bids, criteria } = req.body
      const scopeFilter = req.scopeFilter || {}

      const result = await procurementAgent.execute(
        {
          type: 'MATERIALS',
          requirements: criteria || [],
          bids,
        },
        scopeFilter
      )

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Analyze bids failed', { error: error.message })
      throw new ApiError(500, 'Bid analysis failed')
    }
  },

  async generatePurchaseOrder(req: Request, res: Response) {
    try {
      const { vendorId, requirements, budget } = req.body
      const scopeFilter = req.scopeFilter || {}

      const result = await procurementAgent.execute(
        {
          selectedVendorId: vendorId,
          requirements: requirements || [],
          budget,
        },
        scopeFilter
      )

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Generate PO failed', { error: error.message })
      throw new ApiError(500, 'Purchase order generation failed')
    }
  },
}

