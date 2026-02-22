
import { Router } from 'express';
import * as automationController from '../controllers/automationController.js';

const router = Router();

router.get('/', automationController.getAutomations);
router.post('/', automationController.createAutomation);
router.put('/:id', automationController.updateAutomation);
router.delete('/:id', automationController.deleteAutomation);
router.post('/:id/execute', automationController.executeAutomation);

export default router;
