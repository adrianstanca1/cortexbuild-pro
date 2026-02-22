import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';
import * as superadminCompanyController from '../controllers/superadminCompanyController.js';
import { requireSuperAdmin } from '../middleware/rbacMiddleware.js';
import { trialService } from '../services/trialService.js';

const router = Router();

// GET /companies - Get companies accessible to current user
router.get('/', async (req: any, res: any, next: any) => {
    try {
        // If SuperAdmin, return all companies
        if (req.context?.role === 'SUPERADMIN' || req.user?.role === 'SUPERADMIN') {
            return superadminCompanyController.getAllCompanies(req, res, next);
        }

        // For regular users, return companies they are members of
        const db = await import('../database.js').then(m => m.getDb());
        const userId = req.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const companies = await db.all(`
            SELECT DISTINCT c.*
            FROM companies c
            INNER JOIN memberships m ON c.id = m.companyId
            WHERE m.userId = ? AND m.status = 'active'
            ORDER BY c.createdAt DESC
        `, [userId]);

        // Parse JSON fields
        const companiesWithParsedData = companies.map((company: any) => ({
            ...company,
            settings: company.settings ? JSON.parse(company.settings) : {},
            subscription: company.subscription ? JSON.parse(company.subscription) : { status: 'active', plan: 'free' },
            features: company.features ? JSON.parse(company.features) : []
        }));

        res.json(companiesWithParsedData);
    } catch (error) {
        next(error);
    }
});

// SUPERADMIN routes for company management
router.get('/all', requireSuperAdmin, superadminCompanyController.getAllCompanies);
router.get('/stats', requireSuperAdmin, superadminCompanyController.getCompanyStats);
router.post('/', requireSuperAdmin, superadminCompanyController.createCompany);
router.post('/:id/suspend', requireSuperAdmin, superadminCompanyController.suspendCompany);
router.post('/:id/activate', requireSuperAdmin, superadminCompanyController.activateCompany);
router.put('/:id/limits', requireSuperAdmin, superadminCompanyController.updateCompanyLimits);
router.get('/:id/features', requireSuperAdmin, superadminCompanyController.getCompanyFeatures);
router.patch('/:id/features/:featureName', requireSuperAdmin, superadminCompanyController.toggleCompanyFeature);
router.get('/:id/database-control', requireSuperAdmin, superadminCompanyController.getCompanyDatabaseControl);
router.patch('/:id/database-control', requireSuperAdmin, superadminCompanyController.updateCompanyDatabaseControl);
router.put('/:id/features', requireSuperAdmin, superadminCompanyController.updateCompanyFeatures);
router.get('/:id/activity', requireSuperAdmin, superadminCompanyController.getCompanyActivity);

// Company member management routes (nested under /api/companies/:companyId)
router.put('/my-company', companyController.updateMyCompany);
router.get('/:companyId/details', companyController.getCompanyDetails);
router.post('/:companyId/admins', companyController.inviteCompanyAdmin);
router.get('/:companyId/members', companyController.getCompanyMembers);
router.put('/:companyId/members/:userId/role', companyController.updateMemberRole);
router.delete('/:companyId/members/:userId', companyController.removeMember);

// Trial System Routes
router.get('/:companyId/trial-status', async (req: any, res: any, next: any) => {
    try {
        const { companyId } = req.params;
        const status = await trialService.getTrialStatus(companyId);
        res.json(status);
    } catch (error) {
        next(error);
    }
});

router.get('/:companyId/storage-usage', async (req: any, res: any, next: any) => {
    try {
        const { companyId } = req.params;
        const fileStorage = await trialService.getStorageQuota(companyId);

        // For now, database storage is same as file storage quota
        // In production, calculate actual database size
        const databaseStorage = { ...fileStorage };

        res.json({
            fileStorage,
            databaseStorage
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:companyId/upgrade', async (req: any, res: any, next: any) => {
    try {
        const { companyId } = req.params;
        const { planId } = req.body;
        const userId = req.userId || req.user?.id;

        await trialService.upgradeToPaid(companyId, planId, userId);

        res.json({
            success: true,
            message: `Successfully upgraded to ${planId} plan`
        });
    } catch (error) {
        next(error);
    }
});

// SuperAdmin trial management
router.post('/admin/companies/:companyId/extend-trial', requireSuperAdmin, async (req: any, res: any, next: any) => {
    try {
        const { companyId } = req.params;
        const { days } = req.body;

        const db = await import('../database.js').then(m => m.getDb());
        const company = await db.get('SELECT trialEndsAt FROM companies WHERE id = ?', [companyId]);

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const currentEnd = new Date(company.trialEndsAt);
        const newEnd = new Date(currentEnd);
        newEnd.setDate(newEnd.getDate() + days);

        await db.run(
            'UPDATE companies SET trialEndsAt = ?, updatedAt = datetime("now") WHERE id = ?',
            [newEnd.toISOString(), companyId]
        );

        res.json({
            success: true,
            newTrialEndDate: newEnd.toISOString()
        });
    } catch (error) {
        next(error);
    }
});

router.post('/admin/companies/:companyId/expire-trial', requireSuperAdmin, async (req: any, res: any, next: any) => {
    try {
        const { companyId } = req.params;
        await trialService.expireTrial(companyId);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;