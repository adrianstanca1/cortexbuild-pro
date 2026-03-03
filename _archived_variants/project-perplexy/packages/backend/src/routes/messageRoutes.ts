import { Router } from 'express'
import { messageController } from '../controllers/messageController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All message routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Message routes
router.get('/', messageController.getMessages)
router.post('/', messageController.createMessage)
router.get('/:messageId', messageController.getMessage)
router.put('/:messageId/read', messageController.markAsRead)
router.delete('/:messageId', messageController.deleteMessage)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'message routes active', route: '/api/messages' })
})

export { router as messageRouter }

