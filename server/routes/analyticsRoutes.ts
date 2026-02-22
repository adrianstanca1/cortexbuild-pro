import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateActiveMembership } from '../middleware/apiValidationMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken, validateActiveMembership);

// Metrics Recording
router.post('/metrics', analyticsController.recordMetric);

// Queries
router.get('/metrics/query', requirePermission('reports', 'read'), analyticsController.queryMetrics);
router.get('/metrics/statistics', requirePermission('reports', 'read'), analyticsController.getStatistics);

// Data export (tenant-scoped)
router.get('/export', analyticsController.exportTenantData);

// Dashboard Specific
router.get('/financial/trends', requirePermission('financials', 'read'), analyticsController.getFinancialTrends);
router.get('/financial/variance', requirePermission('financials', 'read'), analyticsController.getCostVarianceTrend);
router.get('/executive/kpis', requirePermission('reports', 'read'), analyticsController.getExecutiveKPIs);
router.get('/projects/progress', requirePermission('projects', 'read'), analyticsController.getProjectProgress);
router.get('/projects/:projectId/health', requirePermission('projects', 'read'), analyticsController.getProjectHealth);
router.get('/resources/utilization', requirePermission('projects', 'read'), analyticsController.getResourceUtilization);
router.get('/safety/metrics', requirePermission('safety', 'read'), analyticsController.getSafetyMetrics);

// Custom Reporting
router.get('/custom', requirePermission('reports', 'read'), analyticsController.getCustomReport);

export default router;
