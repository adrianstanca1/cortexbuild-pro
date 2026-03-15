import { Router } from 'express';
import { setupSuperadmin } from '../controllers/setupController.js';

const router = Router();

// One-time bootstrap endpoint (protected by SETUP_SECRET if configured)
router.post('/superadmin', setupSuperadmin);

export default router;
