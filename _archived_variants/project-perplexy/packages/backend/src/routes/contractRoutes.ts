import { Router } from 'express'
import { contractController } from '../controllers/contractController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All contract routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Contract CRUD routes
router.get('/', contractController.getContracts)
router.post('/', contractController.createContract)
router.get('/:contractId', contractController.getContract)
router.put('/:contractId', contractController.updateContract)
router.delete('/:contractId', contractController.deleteContract)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'contract routes active', route: '/api/contracts' })
})

export { router as contractRouter }

