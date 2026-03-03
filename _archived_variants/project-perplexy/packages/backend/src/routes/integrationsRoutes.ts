import { Router } from 'express'
import { integrationsController } from '../controllers/integrationsController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All integrations routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Integrations routes
router.get('/', integrationsController.getIntegrations)
router.get('/stats', integrationsController.getIntegrationsStats)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'integrations routes active', route: '/api/integrations' })
})

export { router as integrationsRouter }

