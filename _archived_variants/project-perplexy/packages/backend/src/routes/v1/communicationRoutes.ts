/**
 * Communication API Routes (v1)
 * Real-time messaging and collaboration
 */

import { Router } from 'express'
import { authenticate, scopeFilter } from '../../middleware/auth.js'
import { communicationController } from '../../controllers/v1/communicationController.js'
import { validateRequest } from '../../middleware/validation.js'
import { z } from 'zod'

const router: Router = Router()

// All routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Threads
router.get('/threads', communicationController.getThreads)
router.get('/threads/:id', communicationController.getThreadById)
router.post(
  '/threads',
  validateRequest({
    body: z.object({
      title: z.string(),
      type: z.string().optional(),
      projectId: z.string().optional(),
      participants: z.array(z.string()).optional(),
    }),
  }),
  communicationController.createThread
)
router.put('/threads/:id', communicationController.updateThread)
router.delete('/threads/:id', communicationController.deleteThread)

// Messages
router.get('/threads/:threadId/messages', communicationController.getMessages)
router.post(
  '/threads/:threadId/messages',
  validateRequest({
    body: z.object({
      content: z.string(),
      type: z.string().optional(),
      attachments: z.array(z.string()).optional(),
    }),
  }),
  communicationController.sendMessage
)
router.post('/messages/:id/read', communicationController.markAsRead)

export { router as communicationRouter }

