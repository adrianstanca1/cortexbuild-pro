import { Router } from 'express'
import { executionHistoryController } from '../controllers/executionHistoryController.js'
import { authenticate } from '../middleware/auth.js'

const router: Router = Router()

// All execution history routes require authentication
router.use(authenticate)

// Execution history routes
router.get('/', executionHistoryController.getExecutionHistory)
router.get('/:executionId', executionHistoryController.getExecutionById)
router.delete('/', executionHistoryController.clearHistory)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'execution-history routes active', route: '/api/execution-history' })
})

export { router as executionHistoryRouter }

