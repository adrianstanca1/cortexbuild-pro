import { Router } from 'express'
import { tenderController } from '../controllers/tenderController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All tender routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Tender CRUD routes
router.get('/', tenderController.getTenders)
router.post('/', tenderController.createTender)
router.get('/:tenderId', tenderController.getTender)
router.put('/:tenderId', tenderController.updateTender)
router.delete('/:tenderId', tenderController.deleteTender)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'tender routes active', route: '/api/tenders' })
})

export { router as tenderRouter }

