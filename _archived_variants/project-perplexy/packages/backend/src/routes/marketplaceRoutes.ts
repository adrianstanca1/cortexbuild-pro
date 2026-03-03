import { Router } from 'express'
import { marketplaceController } from '../controllers/marketplaceController.js'
import { authenticate } from '../middleware/auth.js'

const router: Router = Router()

// All marketplace routes require authentication
router.use(authenticate)

// Marketplace routes
router.get('/apps', marketplaceController.getApps)
router.get('/apps/:appId', marketplaceController.getApp)
router.post('/apps/:appId/install', marketplaceController.installApp)
router.post('/apps/:appId/uninstall', marketplaceController.uninstallApp)
router.get('/my-apps', marketplaceController.getMyApps)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'marketplace routes active', route: '/api/marketplace' })
})

export { router as marketplaceRouter }

