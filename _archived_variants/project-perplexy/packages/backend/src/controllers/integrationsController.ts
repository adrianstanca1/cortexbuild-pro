import { Request, Response, NextFunction } from 'express'
import { integrationsService } from '../services/integrationsService.js'
import { ApiError } from '../utils/ApiError.js'

export const integrationsController = {
  async getProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const providers = await integrationsService.getProviders()
      res.json({ success: true, providers })
    } catch (error) {
      next(error)
    }
  },

  async getProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { providerId } = req.params
      const provider = await integrationsService.getProvider(providerId)
      if (!provider) {
        throw new ApiError('Provider not found', 404)
      }
      res.json({ success: true, provider })
    } catch (error) {
      next(error)
    }
  },

  async getIntegrations(req: Request, res: Response, next: NextFunction) {
    try {
      const integrations = await integrationsService.getIntegrations()
      res.json({ success: true, integrations })
    } catch (error) {
      next(error)
    }
  },

  async getIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { integrationId } = req.params
      const integration = await integrationsService.getIntegration(integrationId)
      if (!integration) {
        throw new ApiError('Integration not found', 404)
      }
      res.json({ success: true, integration })
    } catch (error) {
      next(error)
    }
  },

  async createIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const integration = await integrationsService.createIntegration(req.body)
      res.json({ success: true, integration, msg: 'Integration created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { integrationId } = req.params
      const integration = await integrationsService.updateIntegration(integrationId, req.body)
      res.json({ success: true, integration, msg: 'Integration updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { integrationId } = req.params
      await integrationsService.deleteIntegration(integrationId)
      res.json({ success: true, message: 'Integration deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async syncIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { integrationId } = req.params
      const sync = await integrationsService.syncIntegration(integrationId)
      res.json({ success: true, sync })
    } catch (error) {
      next(error)
    }
  },

  async getIntegrationSyncs(req: Request, res: Response, next: NextFunction) {
    try {
      const integrationId = req.query.integrationId as string | undefined
      const syncs = await integrationsService.getIntegrationSyncs(integrationId)
      res.json({ success: true, syncs })
    } catch (error) {
      next(error)
    }
  },

  async getIntegrationsStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await integrationsService.getIntegrationsStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

