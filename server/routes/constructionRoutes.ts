import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as pcoController from '../controllers/pcoController.js';
import * as changeOrderController from '../controllers/changeOrderController.js';
import * as ncrController from '../controllers/ncrController.js';
import * as inspectionController from '../controllers/inspectionController.js';
import * as submittalsController from '../controllers/submittalsController.js';

import * as materialController from '../controllers/construction/MaterialController.js';
import * as concreteController from '../controllers/construction/ConcreteController.js';
import * as weatherController from '../controllers/construction/WeatherController.js';
import * as photoController from '../controllers/construction/ProgressPhotoController.js';
import * as subcontractorController from '../controllers/construction/SubcontractorController.js';
import * as qualityController from '../controllers/construction/QualityIssueController.js';

const router = Router();

// ============================================
// POTENTIAL CHANGE ORDERS (PCOs)
// ============================================
router.post('/pcos', authenticateToken, pcoController.createPCO);
router.get('/pcos', authenticateToken, pcoController.getPCOs);
router.get('/pcos/:id', authenticateToken, pcoController.getPCOById);
router.patch('/pcos/:id', authenticateToken, pcoController.updatePCO);
router.post('/pcos/:id/convert', authenticateToken, pcoController.convertPCOToChangeOrder);
router.delete('/pcos/:id', authenticateToken, pcoController.deletePCO);

// ============================================
// CHANGE ORDERS (Enhanced)
// ============================================
router.post('/change-orders', authenticateToken, changeOrderController.createChangeOrder);
router.get('/change-orders', authenticateToken, changeOrderController.getChangeOrders);
router.get('/change-orders/:id', authenticateToken, changeOrderController.getChangeOrderById);
router.post('/change-orders/:id/approve', authenticateToken, changeOrderController.approveChangeOrder);
router.post('/change-orders/:id/reject', authenticateToken, changeOrderController.rejectChangeOrder);
router.post('/change-orders/:id/execute', authenticateToken, changeOrderController.executeChangeOrder);

// ============================================
// NON-CONFORMANCE REPORTS (NCRs)
// ============================================
router.post('/ncrs', authenticateToken, ncrController.createNCR);
router.get('/ncrs', authenticateToken, ncrController.getNCRs);
router.get('/ncrs/:id', authenticateToken, ncrController.getNCRById);
router.patch('/ncrs/:id', authenticateToken, ncrController.updateNCR);
router.post('/ncrs/:id/resolve', authenticateToken, ncrController.resolveNCR);
router.post('/ncrs/:id/close', authenticateToken, ncrController.closeNCR);
router.delete('/ncrs/:id', authenticateToken, ncrController.deleteNCR);

// ============================================
// INSPECTIONS (Enhanced)
// ============================================
router.post('/inspections', authenticateToken, inspectionController.createInspection);
router.get('/inspections', authenticateToken, inspectionController.getInspections);
router.get('/inspections/:id', authenticateToken, inspectionController.getInspectionById);
router.patch('/inspections/:id', authenticateToken, inspectionController.updateInspection);
router.post('/inspections/:id/complete', authenticateToken, inspectionController.completeInspection);
router.get('/inspection-templates', authenticateToken, inspectionController.getInspectionTemplates);
router.post('/inspection-templates', authenticateToken, inspectionController.createInspectionTemplate);

// ============================================
// SUBMITTALS
// ============================================
router.get('/submittals', authenticateToken, submittalsController.getSubmittals);
router.get('/submittals/:id', authenticateToken, submittalsController.getSubmittal);
router.post('/submittals', authenticateToken, submittalsController.createSubmittal);
router.put('/submittals/:id', authenticateToken, submittalsController.updateSubmittal);
router.post('/submittals/:id/submit', authenticateToken, submittalsController.submitForReview);
router.post('/submittals/:id/review', authenticateToken, submittalsController.reviewSubmittal);
router.get('/submittals/:submittalId/revisions', authenticateToken, submittalsController.getRevisions);
router.delete('/submittals/:id', authenticateToken, submittalsController.deleteSubmittal);

// ============================================
// MATERIAL MANAGEMENT
// ============================================
router.get('/materials/deliveries', authenticateToken, materialController.getDeliveries);
router.post('/materials/deliveries', authenticateToken, materialController.createDelivery);

router.get('/materials/inventory', authenticateToken, materialController.getInventory);
// Uses upsertInventory to handle create/update logic (matching legacy behavior)
router.post('/materials/inventory', authenticateToken, materialController.upsertInventory);
router.put('/materials/inventory/:id', authenticateToken, materialController.updateInventory);

router.get('/materials/requisitions', authenticateToken, materialController.getRequisitions);
router.post('/materials/requisitions', authenticateToken, materialController.createRequisition);


// ============================================
// PROGRESS PHOTOS
// ============================================
router.get('/progress-photos', authenticateToken, photoController.getPhotos);
router.post('/progress-photos', authenticateToken, photoController.uploadPhoto);

// ============================================
// WEATHER DELAYS
// ============================================
router.get('/weather/delays', authenticateToken, weatherController.getWeatherDelays);
router.post('/weather/delays', authenticateToken, weatherController.logWeatherDelay);

// ============================================
// CONCRETE MANAGEMENT
// ============================================
router.get('/concrete/pours', authenticateToken, concreteController.getPours);
router.post('/concrete/pours', authenticateToken, concreteController.createPour);

router.get('/concrete/tests', authenticateToken, concreteController.getTests);
router.post('/concrete/tests', authenticateToken, concreteController.createTest);

// Matches concreteApi.ts: api.get('/concrete/pours/${pourId}/strength-curve')
router.get('/concrete/pours/:pourId/strength-curve', authenticateToken, concreteController.getStrengthCurve);

// ============================================
// SUBCONTRACTOR ENHANCEMENTS
// ============================================
router.get('/subcontractors/insurance', authenticateToken, subcontractorController.getInsurance);
router.post('/subcontractors/insurance', authenticateToken, subcontractorController.addInsurance);

router.get('/subcontractors/payment-applications', authenticateToken, subcontractorController.getPaymentApplications);
router.post('/subcontractors/payment-applications', authenticateToken, subcontractorController.submitPaymentApplication);
router.put('/subcontractors/payment-applications/:id', authenticateToken, subcontractorController.updatePaymentApplication);

// ============================================
// QUALITY ISSUES (NEW)
// ============================================
router.get('/quality-issues', authenticateToken, qualityController.getQualityIssues);
router.post('/quality-issues', authenticateToken, qualityController.createQualityIssue);
router.patch('/quality-issues/:id', authenticateToken, qualityController.updateQualityIssue);

export default router;
