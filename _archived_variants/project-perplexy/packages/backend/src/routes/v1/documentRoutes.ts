/**
 * Documents API Routes (v1)
 * File management with OCR processing
 */

import { Router } from 'express'
import { authenticate, scopeFilter } from '../../middleware/auth.js'
import { documentController } from '../../controllers/v1/documentController.js'
import { validateRequest } from '../../middleware/validation.js'
import { z } from 'zod'
import multer from 'multer'

const router: Router = Router()
const upload = multer({ dest: 'uploads/' })

// All routes require authentication
router.use(authenticate)
router.use(scopeFilter)

// Document CRUD
router.get('/', documentController.getDocuments)
router.get('/:id', documentController.getDocumentById)
router.post(
  '/',
  upload.single('file'),
  validateRequest({
    body: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.string(),
      category: z.string().optional(),
      projectId: z.string().optional(),
      accessLevel: z.enum(['public', 'organization', 'project', 'private']).optional(),
    }),
  }),
  documentController.createDocument
)
router.put('/:id', documentController.updateDocument)
router.delete('/:id', documentController.deleteDocument)

// OCR processing
router.post('/:id/ocr', documentController.processOCR)

// Categorization
router.post('/:id/categorize', documentController.categorizeDocument)

// Routing
router.post('/:id/route', documentController.routeDocument)

// Metadata extraction
router.post('/:id/extract-metadata', documentController.extractMetadata)

// Version control
router.get('/:id/versions', documentController.getVersions)
router.post('/:id/versions', documentController.createVersion)

export { router as documentRouter }

