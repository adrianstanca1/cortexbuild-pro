/**
 * Field Operations API Routes
 * Mobile data synchronization with conflict resolution
 */

import { Router } from 'express'
import { authenticate, scopeFilter } from '../../middleware/auth.js'
import { fieldController } from '../../controllers/v1/fieldController.js'
import { validateRequest } from '../../middleware/validation.js'
import { z } from 'zod'

const router: Router = Router()

// All routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Field data CRUD
router.get('/', fieldController.getFieldData)
router.get('/:id', fieldController.getFieldDataById)
router.post(
  '/',
  validateRequest({
    body: z.object({
      projectId: z.string(),
      type: z.enum([
        'EQUIPMENT_STATUS',
        'MATERIAL_TRACKING',
        'SAFETY_INCIDENT',
        'DAILY_REPORT',
        'INSPECTION',
        'MEASUREMENT',
        'PHOTO_DOCUMENTATION',
        'VOICE_NOTE',
        'AR_OVERLAY',
        'EMERGENCY_ALERT',
      ]),
      title: z.string(),
      description: z.string().optional(),
      data: z.record(z.any()),
      location: z.string().optional(),
      coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
      images: z.array(z.string()).optional(),
      videos: z.array(z.string()).optional(),
      documents: z.array(z.string()).optional(),
      equipmentId: z.string().optional(),
      materialId: z.string().optional(),
      barcode: z.string().optional(),
      qrCode: z.string().optional(),
      isSafetyIssue: z.boolean().optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      voiceTranscript: z.string().optional(),
      arData: z.record(z.any()).optional(),
      recordedAt: z.string().datetime().optional(),
    }),
  }),
  fieldController.createFieldData
)
router.put('/:id', fieldController.updateFieldData)
router.delete('/:id', fieldController.deleteFieldData)

// Sync operations
router.post('/sync', fieldController.syncFieldData)
router.get('/sync/status', fieldController.getSyncStatus)
router.post('/sync/resolve-conflict', fieldController.resolveConflict)

// Offline queue management
router.get('/offline/queue', fieldController.getOfflineQueue)
router.post('/offline/queue/clear', fieldController.clearOfflineQueue)

// Emergency operations
router.post('/emergency/alert', fieldController.sendEmergencyAlert)

export { router as fieldRouter }

