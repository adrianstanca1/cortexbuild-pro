/**
 * Plugin API Routes (v1)
 * Developer ecosystem and extensibility
 */

import { Router } from 'express'
import { authenticate, scopeFilter } from '../../middleware/auth.js'
import { pluginController } from '../../controllers/v1/pluginController.js'
import { validateRequest } from '../../middleware/validation.js'
import { z } from 'zod'
import multer from 'multer'

const router: Router = Router()
const upload = multer({ dest: 'uploads/plugins/' })

// All routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Plugins
router.get('/', pluginController.getPlugins)
router.get('/:id', pluginController.getPluginById)
router.post(
  '/',
  upload.single('plugin'),
  validateRequest({
    body: z.object({
      name: z.string(),
      version: z.string(),
      description: z.string().optional(),
      author: z.string().optional(),
      permissions: z.array(z.string()).optional(),
      hooks: z.array(z.string()).optional(),
    }),
  }),
  pluginController.installPlugin
)
router.put('/:id', pluginController.updatePlugin)
router.delete('/:id', pluginController.uninstallPlugin)
router.post('/:id/toggle', pluginController.togglePlugin)

// Plugin execution
router.post('/:id/execute', pluginController.executePlugin)
router.get('/:id/hooks', pluginController.getPluginHooks)

export { router as pluginRouter }

