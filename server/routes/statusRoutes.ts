import { Router } from 'express';
import * as statusController from '../controllers/statusController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

/**
 * System Status Routes
 * Provides comprehensive system health and status information
 */

// Public health check
router.get('/health', statusController.getDatabaseStatus);

// Protected status endpoints (require authentication + rate limiting)
router.get('/system', apiLimiter, authenticateToken, requireRole(['SUPERADMIN']), statusController.getSystemStatus);
router.get('/websocket', apiLimiter, authenticateToken, requireRole(['SUPERADMIN']), statusController.getWebSocketStatus);
router.get('/database', apiLimiter, authenticateToken, requireRole(['SUPERADMIN']), statusController.getDatabaseStatus);
router.post('/database/test', apiLimiter, authenticateToken, requireRole(['SUPERADMIN']), statusController.testDatabaseConnection);
router.get('/api-metrics', apiLimiter, authenticateToken, requireRole(['SUPERADMIN']), statusController.getApiMetrics);


export default router;
