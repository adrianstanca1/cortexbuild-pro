/**
 * Safety API Routes (v1)
 * Incident management and analysis
 */

import { Router } from 'express'
import { authenticate, scopeFilter } from '../../middleware/auth.js'
import { safetyController } from '../../controllers/v1/safetyController.js'
import { validateRequest } from '../../middleware/validation.js'
import { z } from 'zod'

const router: Router = Router()

// All routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Safety incidents
router.get('/', safetyController.getIncidents)
router.get('/:id', safetyController.getIncidentById)
router.post(
  '/',
  validateRequest({
    body: z.object({
      projectId: z.string(),
      title: z.string(),
      description: z.string(),
      type: z.enum([
        'INJURY',
        'NEAR_MISS',
        'PROPERTY_DAMAGE',
        'ENVIRONMENTAL',
        'EQUIPMENT_FAILURE',
        'FIRE',
        'FALL',
        'STRIKE',
        'OTHER',
      ]),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      location: z.string().optional(),
      coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
      images: z.array(z.string()).optional(),
      videos: z.array(z.string()).optional(),
      documents: z.array(z.string()).optional(),
      occurredAt: z.string().datetime(),
    }),
  }),
  safetyController.createIncident
)
router.put('/:id', safetyController.updateIncident)
router.delete('/:id', safetyController.deleteIncident)

// AI analysis
router.post('/:id/analyze', safetyController.analyzeIncident)
router.post('/predict-risks', safetyController.predictRisks)
router.post('/analyze-hazard', safetyController.analyzeHazard)

// Investigation
router.post('/:id/investigate', safetyController.startInvestigation)
router.put('/:id/investigation', safetyController.updateInvestigation)
router.post('/:id/resolve', safetyController.resolveIncident)

export { router as safetyRouter }

