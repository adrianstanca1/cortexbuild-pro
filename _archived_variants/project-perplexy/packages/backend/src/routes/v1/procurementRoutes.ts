/**
 * Procurement API Routes (v1)
 * Vendor and purchase order management
 */

import { Router } from 'express'
import { authenticate, scopeFilter } from '../../middleware/auth.js'
import { procurementController } from '../../controllers/v1/procurementController.js'
import { validateRequest } from '../../middleware/validation.js'
import { z } from 'zod'

const router: Router = Router()

// All routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Procurement requests
router.get('/', procurementController.getProcurements)
router.get('/:id', procurementController.getProcurementById)
router.post(
  '/',
  validateRequest({
    body: z.object({
      projectId: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(['MATERIALS', 'EQUIPMENT', 'SERVICES', 'LABOR', 'SUBCONTRACTOR']),
      vendorId: z.string().optional(),
      estimatedValue: z.number(),
      currency: z.string().optional(),
      deadline: z.string().datetime().optional(),
    }),
  }),
  procurementController.createProcurement
)
router.put('/:id', procurementController.updateProcurement)
router.delete('/:id', procurementController.deleteProcurement)

// AI-powered vendor selection
router.post('/:id/select-vendor', procurementController.selectVendor)
router.post('/analyze-bids', procurementController.analyzeBids)
router.post('/generate-po', procurementController.generatePurchaseOrder)

export { router as procurementRouter }

