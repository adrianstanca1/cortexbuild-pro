import { Router } from 'express';
import { getAccessLogs, createAccessLog } from '../controllers/accessController.js';

const router = Router();

router.get('/logs', getAccessLogs);
router.post('/logs', createAccessLog);

export default router;
