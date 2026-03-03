import { Router } from 'express'
import { mapController } from '../controllers/mapController.js'
import { authenticate } from '../middleware/auth.js'

const router: Router = Router()

// All map routes require authentication
router.use(authenticate)

// Map routes
router.post('/drawings', mapController.uploadDrawing)
router.get('/drawings', mapController.getDrawingMap)
router.delete('/drawings/:drawingId', mapController.deleteDrawingMap)
router.post('/reverse-geocode', mapController.reverseGeocode)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'map routes active', route: '/api/maps' })
})

export { router as mapRouter }

