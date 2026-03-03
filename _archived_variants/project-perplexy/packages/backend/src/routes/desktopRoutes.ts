import { Router } from 'express'
import { desktopController } from '../controllers/desktopController.js'
import { authenticate } from '../middleware/auth.js'

const router: Router = Router()

// All desktop routes require authentication
router.use(authenticate)

// Desktop routes
router.get('/apps', desktopController.getApps)
router.post('/apps/:appId/install', desktopController.installApp)
router.post('/apps/:appId/uninstall', desktopController.uninstallApp)
router.post('/apps/:appId/execute', desktopController.executeApp)
router.put('/window-state', desktopController.updateWindowState)
router.get('/messages', desktopController.getMessages)
router.post('/messages', desktopController.sendMessage)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'desktop routes active', route: '/api/desktop' })
})

export { router as desktopRouter }

