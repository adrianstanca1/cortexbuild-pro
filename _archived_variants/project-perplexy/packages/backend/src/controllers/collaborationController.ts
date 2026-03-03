import { Request, Response, NextFunction } from 'express'
import { collaborationService } from '../services/collaborationService.js'
import { ApiError } from '../utils/ApiError.js'

export const collaborationController = {
  async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string | undefined
      const rooms = await collaborationService.getRooms(userId)
      res.json({ success: true, rooms })
    } catch (error) {
      next(error)
    }
  },

  async getRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params
      const room = await collaborationService.getRoom(roomId)
      if (!room) {
        throw new ApiError('Room not found', 404)
      }
      res.json({ success: true, room })
    } catch (error) {
      next(error)
    }
  },

  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || 'anonymous'
      const room = await collaborationService.createRoom(req.body, userId)
      res.json({ success: true, room, msg: 'Room created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params
      const room = await collaborationService.updateRoom(roomId, req.body)
      res.json({ success: true, room, msg: 'Room updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params
      await collaborationService.deleteRoom(roomId)
      res.json({ success: true, message: 'Room deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params
      const messages = await collaborationService.getMessages(roomId)
      res.json({ success: true, messages })
    } catch (error) {
      next(error)
    }
  },

  async createMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await collaborationService.createMessage(req.body)
      res.json({ success: true, message, msg: 'Message sent successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getCollaborationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await collaborationService.getCollaborationStats()
      res.json({ success: true, stats })
    } catch (error) {
      next(error)
    }
  },
}

