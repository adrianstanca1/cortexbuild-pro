import { Router, Request, Response, NextFunction } from 'express';
import { procoreService } from '../services/procoreService.js';
import { IntegrationService } from '../services/integrationService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/permissionMiddleware.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Get Procore OAuth authorization URL
 * GET /api/integrations/procore/auth
 */
router.get('/auth', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!procoreService.isEnabled()) {
      throw new AppError('Procore integration not configured', 503);
    }

    const companyId = (req as any).companyId;
    const state = Buffer.from(JSON.stringify({ companyId, timestamp: Date.now() })).toString('base64');
    const authUrl = procoreService.getAuthorizationUrl(state);

    res.json({
      message: 'Navigate to the provided URL to connect Procore',
      authUrl,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Procore OAuth callback
 * GET /api/integrations/procore/callback
 */
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      throw new AppError(`OAuth error: ${error}`, 400);
    }

    if (!code) {
      throw new AppError('Authorization code not provided', 400);
    }

    // Exchange code for tokens
    const tokens = await procoreService.exchangeCodeForTokens(code as string);
    
    // Parse state to get companyId
    let companyId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      companyId = stateData.companyId;
    } catch {
      throw new AppError('Invalid state parameter', 400);
    }

    // Save integration
    await IntegrationService.connectIntegration(companyId, 'procore', {
      access: tokens.access_token,
      refresh: tokens.refresh_token,
    });

    // Redirect to frontend
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${redirectUrl}/settings/integrations?procore=connected`);
  } catch (error) {
    logger.error('Procore OAuth callback error:', error);
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${redirectUrl}/settings/integrations?procore=error`);
  }
});

/**
 * Get Procore integration status
 * GET /api/integrations/procore/status
 */
router.get('/status', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).companyId;
    const integration = await IntegrationService.getIntegration(companyId, 'procore');

    res.json({
      enabled: procoreService.isEnabled(),
      connected: integration?.status === 'connected',
      lastSyncedAt: integration?.lastSyncedAt,
      status: integration?.status || 'disconnected',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Disconnect Procore integration
 * DELETE /api/integrations/procore/disconnect
 */
router.delete('/disconnect', authenticateToken, requirePermission('integrations.manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).companyId;
    const db = (await import('../database.js')).getDb();
    
    await db.run(
      'UPDATE integrations SET status = ?, accessToken = NULL, refreshToken = NULL WHERE companyId = ? AND type = ?',
      ['disconnected', companyId, 'procore']
    );

    res.json({ message: 'Procore integration disconnected successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * Sync projects from Procore
 * POST /api/integrations/procore/sync/projects
 */
router.post('/sync/projects', authenticateToken, requirePermission('projects.manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).companyId;
    const integration = await IntegrationService.getIntegration(companyId, 'procore');

    if (!integration || integration.status !== 'connected') {
      throw new AppError('Procore not connected', 400);
    }

    const result = await procoreService.syncProjects(companyId, integration.accessToken);

    res.json({
      message: 'Projects synced successfully',
      synced: result.synced,
      projects: result.projects,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Procore projects
 * GET /api/integrations/procore/projects
 */
router.get('/projects', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).companyId;
    const integration = await IntegrationService.getIntegration(companyId, 'procore');

    if (!integration || integration.status !== 'connected') {
      throw new AppError('Procore not connected', 400);
    }

    const procoreCompanyId = await procoreService.getCompanyId(integration.accessToken);
    const projects = await procoreService.getProjects(integration.accessToken, procoreCompanyId);

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

/**
 * Get documents for a Procore project
 * GET /api/integrations/procore/projects/:projectId/documents
 */
router.get('/projects/:projectId/documents', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).companyId;
    const { projectId } = req.params;
    const integration = await IntegrationService.getIntegration(companyId, 'procore');

    if (!integration || integration.status !== 'connected') {
      throw new AppError('Procore not connected', 400);
    }

    const documents = await procoreService.getDocuments(integration.accessToken, parseInt(projectId));

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

/**
 * Import document from Procore
 * POST /api/integrations/procore/documents/:documentId/import
 */
router.post('/documents/:documentId/import', authenticateToken, requirePermission('documents.create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).companyId;
    const { documentId } = req.params;
    const { projectId } = req.body;
    const integration = await IntegrationService.getIntegration(companyId, 'procore');

    if (!integration || integration.status !== 'connected') {
      throw new AppError('Procore not connected', 400);
    }

    // Download document from Procore
    const fileBuffer = await procoreService.downloadDocument(integration.accessToken, projectId, parseInt(documentId));
    
    // TODO: Save to local storage and create document record
    // This would integrate with your existing document management system

    res.json({
      message: 'Document imported successfully',
      documentId,
      size: fileBuffer.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Test Procore connection
 * POST /api/integrations/procore/test
 */
router.post('/test', authenticateToken, requirePermission('integrations.manage'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).companyId;
    const integration = await IntegrationService.getIntegration(companyId, 'procore');

    if (!integration || integration.status !== 'connected') {
      throw new AppError('Procore not connected', 400);
    }

    const result = await procoreService.testConnection(integration.accessToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Procore webhook handler
 * POST /api/integrations/procore/webhook
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-procore-signature'] as string;
    const result = await procoreService.handleWebhook(req.body, signature);

    res.json({ received: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
