/**
 * Plugin Controller (v1)
 */

import { Request, Response } from 'express'
import { pluginService } from '../../services/pluginService.js'
import { ApiError } from '../../utils/errors.js'
import logger from '../../config/logger.js'

export const pluginController = {
  async getPlugins(req: Request, res: Response) {
    try {
      const scopeFilter = req.scopeFilter || {}
      const plugins = await pluginService.getPlugins(scopeFilter)

      res.json({ success: true, plugins })
    } catch (error: any) {
      logger.error('Get plugins failed', { error: error.message })
      throw new ApiError(500, 'Failed to fetch plugins')
    }
  },

  async getPluginById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const plugin = await pluginService.getPluginById(id, scopeFilter)

      if (!plugin) {
        throw new ApiError(404, 'Plugin not found')
      }

      res.json({ success: true, plugin })
    } catch (error: any) {
      logger.error('Get plugin by ID failed', { error: error.message })
      throw error
    }
  },

  async installPlugin(req: Request, res: Response) {
    try {
      const file = req.file
      if (!file) {
        throw new ApiError(400, 'Plugin file is required')
      }

      const scopeFilter = req.scopeFilter || {}
      const plugin = await pluginService.installPlugin({
        ...req.body,
        file,
        organizationId: scopeFilter.organizationId,
      })

      res.status(201).json({ success: true, plugin })
    } catch (error: any) {
      logger.error('Install plugin failed', { error: error.message })
      throw error
    }
  },

  async updatePlugin(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const plugin = await pluginService.updatePlugin(id, req.body, scopeFilter)

      res.json({ success: true, plugin })
    } catch (error: any) {
      logger.error('Update plugin failed', { error: error.message })
      throw error
    }
  },

  async uninstallPlugin(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      await pluginService.uninstallPlugin(id, scopeFilter)

      res.json({ success: true, message: 'Plugin uninstalled' })
    } catch (error: any) {
      logger.error('Uninstall plugin failed', { error: error.message })
      throw error
    }
  },

  async togglePlugin(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { enabled } = req.body
      const scopeFilter = req.scopeFilter || {}

      const plugin = await pluginService.togglePlugin(id, enabled, scopeFilter)

      res.json({ success: true, plugin })
    } catch (error: any) {
      logger.error('Toggle plugin failed', { error: error.message })
      throw error
    }
  },

  async executePlugin(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { action, data } = req.body
      const scopeFilter = req.scopeFilter || {}

      const result = await pluginService.executePlugin(id, action, data, scopeFilter)

      res.json({ success: true, result })
    } catch (error: any) {
      logger.error('Execute plugin failed', { error: error.message })
      throw new ApiError(500, 'Plugin execution failed')
    }
  },

  async getPluginHooks(req: Request, res: Response) {
    try {
      const { id } = req.params
      const scopeFilter = req.scopeFilter || {}

      const hooks = await pluginService.getPluginHooks(id, scopeFilter)

      res.json({ success: true, hooks })
    } catch (error: any) {
      logger.error('Get plugin hooks failed', { error: error.message })
      throw error
    }
  },
}

