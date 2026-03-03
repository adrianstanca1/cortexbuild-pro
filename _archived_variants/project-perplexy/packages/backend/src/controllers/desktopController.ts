import { Request, Response, NextFunction } from 'express'
import { desktopService } from '../services/desktopService.js'
import { ApiError } from '../utils/ApiError.js'

export const desktopController = {
  async getApps(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || 'anonymous'
      const apps = await desktopService.getInstalledApps(userId)
      res.json({ success: true, apps })
    } catch (error) {
      next(error)
    }
  },

  async installApp(req: Request, res: Response, next: NextFunction) {
    try {
      const { appId, name, code, language } = req.body
      const userId = (req as any).user?.id || 'anonymous'

      if (!appId || !name || !code || !language) {
        throw new ApiError('Missing required fields', 400)
      }

      const app = await desktopService.installApp(userId, { appId, name, code, language })
      res.json({ success: true, app, message: 'App installed successfully' })
    } catch (error) {
      next(error)
    }
  },

  async uninstallApp(req: Request, res: Response, next: NextFunction) {
    try {
      const { appId } = req.params
      const userId = (req as any).user?.id || 'anonymous'

      await desktopService.uninstallApp(userId, appId)
      res.json({ success: true, message: 'App uninstalled successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateWindowState(req: Request, res: Response, next: NextFunction) {
    try {
      const { appId } = req.params
      const state = req.body
      const userId = (req as any).user?.id || 'anonymous'

      await desktopService.updateWindowState(userId, appId, state)
      res.json({ success: true, message: 'Window state updated' })
    } catch (error) {
      next(error)
    }
  },

  async executeApp(req: Request, res: Response, next: NextFunction) {
    try {
      const { appId } = req.params
      const { data } = req.body
      const userId = (req as any).user?.id || 'anonymous'

      const result = await desktopService.executeApp(userId, appId, data)
      res.json({ success: true, result })
    } catch (error) {
      next(error)
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || 'anonymous'
      const messages = await desktopService.getMessages(userId)
      res.json({ success: true, messages })
    } catch (error) {
      next(error)
    }
  },

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, subject, content } = req.body
      const userId = (req as any).user?.id || 'anonymous'

      if (!from || !to || !subject || !content) {
        throw new ApiError('Missing required fields', 400)
      }

      const message = await desktopService.sendMessage({
        from: from || userId,
        to,
        subject,
        content,
      })
      res.json({ success: true, message, msg: 'Message sent successfully' })
    } catch (error) {
      next(error)
    }
  },

  async markMessageAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params
      await desktopService.markMessageAsRead(messageId)
      res.json({ success: true, message: 'Message marked as read' })
    } catch (error) {
      next(error)
    }
  },
}

