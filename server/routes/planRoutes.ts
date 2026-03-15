import { Router } from 'express';
import * as planController from '../controllers/planController.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { UserRole } from '../types.js';

const router = Router();

// Plans management requires SUPERADMIN role
router.use(requireRole([UserRole.SUPERADMIN]));

router.get('/', planController.getPlans);
router.post('/', planController.createPlan);
router.put('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);

export default router;
