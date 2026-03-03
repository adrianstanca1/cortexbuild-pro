import { Router } from 'express'
import { calendarController } from '../controllers/calendarController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All calendar routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Calendar event routes
router.get('/', calendarController.getEvents)
router.post('/', calendarController.createEvent)
router.get('/:eventId', calendarController.getEvent)
router.put('/:eventId', calendarController.updateEvent)
router.delete('/:eventId', calendarController.deleteEvent)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'calendar routes active', route: '/api/calendar' })
})

export { router as calendarRouter }

