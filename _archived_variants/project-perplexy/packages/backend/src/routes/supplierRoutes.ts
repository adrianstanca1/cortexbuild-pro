import { Router } from 'express'
import { supplierController } from '../controllers/supplierController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All supplier routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Supplier CRUD routes
router.get('/', supplierController.getSuppliers)
router.post('/', supplierController.createSupplier)
router.get('/:supplierId', supplierController.getSupplier)
router.put('/:supplierId', supplierController.updateSupplier)
router.delete('/:supplierId', supplierController.deleteSupplier)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'supplier routes active', route: '/api/suppliers' })
})

export { router as supplierRouter }

