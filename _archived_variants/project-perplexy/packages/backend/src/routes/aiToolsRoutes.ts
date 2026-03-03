import { Router } from 'express'
import { aiToolsController } from '../controllers/aiToolsController.js'
import { authenticate } from '../middleware/auth.js'
import { scopeFilter } from '../middleware/rbac.js'

const router: Router = Router()

// All AI tools routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// AI tools routes
router.get('/', aiToolsController.getAITools)
router.post('/', aiToolsController.createAITool)
router.get('/stats', aiToolsController.getAIToolStats)
router.get('/:toolId', aiToolsController.getAITool)
router.put('/:toolId', aiToolsController.updateAITool)
router.delete('/:toolId', aiToolsController.deleteAITool)
router.post('/:toolId/execute', aiToolsController.executeAITool)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'ai-tools routes active', route: '/api/ai-tools' })
})

export { router as aiToolsRouter }

