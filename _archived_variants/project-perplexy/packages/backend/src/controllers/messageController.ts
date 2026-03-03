import { Request, Response, NextFunction } from 'express'
import { messageService } from '../services/messageService.js'
import { ApiError } from '../utils/ApiError.js'

export const messageController = {
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string | undefined
      const messages = await messageService.getMessages(userId)
      res.json({ success: true, messages })
    } catch (error) {
      next(error)
    }
  },

  async getMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params
      const message = await messageService.getMessage(messageId)
      if (!message) {
        throw new ApiError('Message not found', 404)
      }
      res.json({ success: true, message })
    } catch (error) {
      next(error)
    }
  },

  async createMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || 'anonymous'
      const message = await messageService.createMessage({
        ...req.body,
        from: req.body.from || userId,
      })
      res.json({ success: true, message, msg: 'Message sent successfully' })
    } catch (error) {
      next(error)
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params
      await messageService.markAsRead(messageId)
      res.json({ success: true, message: 'Message marked as read' })
    } catch (error) {
      next(error)
    }
  },

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params
      await messageService.deleteMessage(messageId)
      res.json({ success: true, message: 'Message deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getMessageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string | undefined
      const stats = await messageService.getMessageStats(userId)
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

