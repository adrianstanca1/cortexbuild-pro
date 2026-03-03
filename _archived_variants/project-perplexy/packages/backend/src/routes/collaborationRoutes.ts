import { Router } from 'express'
import { collaborationController } from '../controllers/collaborationController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All collaboration routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Collaboration routes
router.get('/rooms', collaborationController.getRooms)
router.post('/rooms', collaborationController.createRoom)
router.get('/rooms/:roomId', collaborationController.getRoom)
router.put('/rooms/:roomId', collaborationController.updateRoom)
router.delete('/rooms/:roomId', collaborationController.deleteRoom)
router.get('/rooms/:roomId/messages', collaborationController.getMessages)
router.post('/rooms/:roomId/messages', collaborationController.createMessage)
router.get('/stats', collaborationController.getCollaborationStats)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'collaboration routes active', route: '/api/collaboration' })
})

export { router as collaborationRouter }

