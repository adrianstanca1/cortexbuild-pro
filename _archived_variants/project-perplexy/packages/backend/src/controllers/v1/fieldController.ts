/**
 * Field Operations Controller
 * Handles mobile field data synchronization
 */

import { Request, Response } from 'express'
import { fieldService } from '../../services/fieldService.js'
import { ApiError } from '../../utils/errors.js'
import logger from '../../config/logger.js'

export const fieldController = {
  async getFieldData(req: Request, res: Response) {
    try {
      const { projectId, type, syncStatus } = req.query
      const scopeFilter = req.scopeFilter || {}

      const data = await fieldService.getFieldData({
        ...scopeFilter,
        projectId: projectId as string,
        type: type as string,
        syncStatus: syncStatus as string,
      })

      res.json({ success: true, data })
    } catch (error: any) {
      logger.error('Get field data failed', { error: error.message })
      throw new ApiError(500, 'Failed to fetch field data')
    }
  },

  async getFieldDataById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const data = await fieldService.getFieldDataById(id, scopeFilter)

      if (!data) {
        throw new ApiError(404, 'Field data not found')
      }

      res.json({ success: true, data })
    } catch (error: any) {
      logger.error('Get field data by ID failed', { error: error.message })
      throw error
    }
  },

  async createFieldData(req: Request, res: Response) {
    try {
      const userData = req.userData!
      const scopeFilter = req.scopeFilter || {}

      const fieldData = await fieldService.createFieldData({
        ...req.body,
        userId: userData.id,
        organizationId: scopeFilter.organizationId,
        syncStatus: 'synced',
      })

      res.status(201).json({ success: true, data: fieldData })
    } catch (error: any) {
      logger.error('Create field data failed', { error: error.message })
      throw new ApiError(500, 'Failed to create field data')
    }
  },

  async updateFieldData(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const data = await fieldService.updateFieldData(id, req.body, scopeFilter)

      res.json({ success: true, data })
    } catch (error: any) {
      logger.error('Update field data failed', { error: error.message })
      throw error
    }
  },

  async deleteFieldData(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      await fieldService.deleteFieldData(id, scopeFilter)

      res.json({ success: true, message: 'Field data deleted' })
    } catch (error: any) {
      logger.error('Delete field data failed', { error: error.message })
      throw error
    }
  },

  async syncFieldData(req: Request, res: Response) {
    try {
      const { pendingData } = req.body
      const userData = req.userData!

      const result = await fieldService.syncFieldData(pendingData, userData.id)

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Sync field data failed', { error: error.message })
      throw new ApiError(500, 'Failed to sync field data')
    }
  },

  async getSyncStatus(req: Request, res: Response) {
    try {
      const userData = req.userData!
      const status = await fieldService.getSyncStatus(userData.id)

      res.json({ success: true, status })
    } catch (error: any) {
      logger.error('Get sync status failed', { error: error.message })
      throw new ApiError(500, 'Failed to get sync status')
    }
  },

  async resolveConflict(req: Request, res: Response) {
    try {
      const { conflictId, resolution } = req.body
      const result = await fieldService.resolveConflict(conflictId, resolution)

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Resolve conflict failed', { error: error.message })
      throw new ApiError(500, 'Failed to resolve conflict')
    }
  },

  async getOfflineQueue(req: Request, res: Response) {
    try {
      const userData = req.userData!
      const queue = await fieldService.getOfflineQueue(userData.id)

      res.json({ success: true, queue })
    } catch (error: any) {
      logger.error('Get offline queue failed', { error: error.message })
      throw new ApiError(500, 'Failed to get offline queue')
    }
  },

  async clearOfflineQueue(req: Request, res: Response) {
    try {
      const userData = req.userData!
      await fieldService.clearOfflineQueue(userData.id)

      res.json({ success: true, message: 'Offline queue cleared' })
    } catch (error: any) {
      logger.error('Clear offline queue failed', { error: error.message })
      throw new ApiError(500, 'Failed to clear offline queue')
    }
  },

  async sendEmergencyAlert(req: Request, res: Response) {
    try {
      const userData = req.userData!
      const { location, coordinates, message } = req.body

      const alert = await fieldService.sendEmergencyAlert({
        userId: userData.id,
        location,
        coordinates,
        message,
      })

      res.status(201).json({ success: true, alert })
    } catch (error: any) {
      logger.error('Send emergency alert failed', { error: error.message })
      throw new ApiError(500, 'Failed to send emergency alert')
    }
  },
}

