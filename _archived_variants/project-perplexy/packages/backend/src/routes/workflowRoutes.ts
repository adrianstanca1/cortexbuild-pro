import { Router } from 'express'
import { workflowController } from '../controllers/workflowController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All workflow routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Workflow automation routes
router.get('/', workflowController.getWorkflows)
router.get('/stats', workflowController.getWorkflowStats)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'workflow routes active', route: '/api/workflows' })
})

export { router as workflowRouter }

