import { Router } from 'express'
import { costEstimatorController } from '../controllers/costEstimatorController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All cost estimator routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Cost estimator routes
router.get('/estimates', costEstimatorController.getCostEstimates)
router.post('/estimates', costEstimatorController.createCostEstimate)
router.get('/estimates/:estimateId', costEstimatorController.getCostEstimate)
router.put('/estimates/:estimateId', costEstimatorController.updateCostEstimate)
router.delete('/estimates/:estimateId', costEstimatorController.deleteCostEstimate)
router.get('/templates', costEstimatorController.getTemplates)
router.get('/templates/:templateId', costEstimatorController.getTemplate)
router.get('/stats', costEstimatorController.getCostEstimatorStats)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'cost-estimator routes active', route: '/api/cost-estimator' })
})

export { router as costEstimatorRouter }

