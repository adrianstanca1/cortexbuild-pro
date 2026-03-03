import { Request, Response, NextFunction } from 'express'
import { calendarService } from '../services/calendarService.js'
import { ApiError } from '../utils/ApiError.js'

export const calendarController = {
  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined
      const events = await calendarService.getEvents(startDate, endDate)
      res.json({ success: true, events })
    } catch (error) {
      next(error)
    }
  },

  async getEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params
      const event = await calendarService.getEvent(eventId)
      if (!event) {
        throw new ApiError('Event not found', 404)
      }
      res.json({ success: true, event })
    } catch (error) {
      next(error)
    }
  },

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await calendarService.createEvent(req.body)
      res.json({ success: true, event, message: 'Event created successfully' })
    } catch (error) {
      next(error)
    }
  },

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params
      const event = await calendarService.updateEvent(eventId, req.body)
      res.json({ success: true, event, message: 'Event updated successfully' })
    } catch (error) {
      next(error)
    }
  },

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params
      await calendarService.deleteEvent(eventId)
      res.json({ success: true, message: 'Event deleted successfully' })
    } catch (error) {
      next(error)
    }
  },

  async getUpcomingEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30
      const events = await calendarService.getUpcomingEvents(days)
      res.json({ success: true, events })
    } catch (error) {
      next(error)
    }
  },
}

