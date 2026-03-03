import { Router } from 'express'
import { locationController } from '../controllers/locationController.js'
import { authenticate } from '../middleware/auth.js'

const router: Router = Router()

// All location routes require authentication
router.use(authenticate)

// Location tracking routes
router.post('/', locationController.updateLocation)
router.get('/active', locationController.getActiveUsers)
router.get('/user/:userId', locationController.getUserLocation)

// Ping endpoint for smoke testing
router.get('/_ping', (_req, res) => {
  res.json({ message: 'location routes active', route: '/api/location' })
})

export { router as locationRouter }

