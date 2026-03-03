import { Router } from 'express'
import { executeController } from '../controllers/executeController.js'
import { authenticate } from '../middleware/auth.js'

const router: Router = Router()

// All execute routes require authentication
router.use(authenticate)

// Code execution routes
router.post('/', executeController.executeCode)
router.post('/stop', executeController.stopExecution)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'execute routes active', route: '/api/execute' })
})

export { router as executeRouter }

