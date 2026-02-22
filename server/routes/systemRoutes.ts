import { Router } from 'express';
import * as platformController from '../controllers/platformController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

// These should be protected by SUPERADMIN check ideally
// requirePermission('system', 'manage') could map to SuperAdmin role
router.get('/settings', platformController.getSystemConfig);
router.post('/settings', platformController.updateSystemConfig);
router.get('/logs', platformController.getPlatformLogs);
router.post('/broadcast', platformController.broadcastMessage);

export default router;
