import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    getWebhooks,
    createWebhook,
    deleteWebhook
} from '../controllers/webhookController.js';

const router = Router();

// All webhook routes require authentication
router.use(authenticateToken);

/**
 * GET /api/webhooks
 * List all webhooks for the authenticated company
 */
router.get('/', getWebhooks);

/**
 * POST /api/webhooks
 * Create a new webhook
 * Body: { name: string, url: string, events: string[] }
 */
router.post('/', createWebhook);

/**
 * DELETE /api/webhooks/:id
 * Delete a specific webhook
 */
router.delete('/:id', deleteWebhook);

export default router;
