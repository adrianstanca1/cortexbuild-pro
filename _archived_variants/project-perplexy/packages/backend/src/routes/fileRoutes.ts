import { Router } from 'express'
import { fileController } from '../controllers/fileController.js'
import { authenticate } from '../middleware/auth.js'

const router: Router = Router()

// All file routes require authentication
router.use(authenticate)

// File management routes
router.get('/', fileController.listFiles)
router.get('/content', fileController.getFileContent)
router.post('/', fileController.createFile)
router.put('/', fileController.updateFile)
router.delete('/', fileController.deleteFile)
router.post('/upload', fileController.uploadFile)
router.get('/stats', fileController.getFileStats)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'file routes active', route: '/api/files' })
})

export { router as fileRouter }

