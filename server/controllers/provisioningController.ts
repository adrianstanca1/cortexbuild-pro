import { Request, Response, NextFunction } from 'express';
import { companyProvisioningService } from '../services/companyProvisioningService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

/**
 * ProvisioningController - Handles company provisioning API endpoints
 */
export class ProvisioningController {
    /**
     * POST /api/provisioning/companies
     * Create a new company with owner
     */
    async createCompany(req: Request, res: Response, next: NextFunction) {
        try {
            // Support both flat structure (from frontend) and nested structure (legacy/api)
            const body = req.body;

            const companyData = body.company || body;
            const ownerData = body.owner || {
                email: body.ownerEmail,
                name: body.ownerName,
                password: body.ownerPassword
            };

            const name = companyData.name;
            const plan = companyData.plan || body.plan;

            // Validation
            if (!name || !plan) {
                throw new AppError('Company name and plan are required', 400);
            }

            if (!ownerData.email || !ownerData.name) {
                throw new AppError('Owner email and name are required', 400);
            }

            // Create company using the service workflow
            const result = await companyProvisioningService.initiateProvisioning({
                name: name,
                legalName: companyData.legalName || body.legalName,
                slug: companyData.slug || body.slug,
                industry: companyData.industry || body.industry,
                region: companyData.region || body.region,
                ownerEmail: ownerData.email,
                ownerName: ownerData.name,
                ownerPassword: ownerData.password, // Optional password for instant creation
                plan: plan,
                storageQuotaGB: companyData.storageQuotaGB || body.storageQuotaGB,
                selectedModules: companyData.selectedModules || body.selectedModules,
                initialFeatures: companyData.initialFeatures || body.initialFeatures,
            });

            logger.info('Company provisioned successfully', {
                companyId: result.companyId,
                companyName: name,
                status: result.status
            });

            res.status(201).json({
                success: true,
                data: {
                    company: {
                        id: result.companyId,
                        name: name,
                        status: result.status
                    },
                    owner: result.owner ? result.owner : {
                        id: null,
                        email: ownerData.email,
                        name: ownerData.name
                    },
                    invitation: result.invitation
                }
            });

        } catch (error: any) {
            logger.error('Failed to provision company:', error);
            if (error.message.includes('already exists')) {
                return next(new AppError(error.message, 409));
            }
            next(error);
        }
    }

    /**
     * POST /api/provisioning/companies/:id/activate
     * Activate a company (transition from DRAFT to ACTIVE)
     */
    async activateCompany(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const activatedBy = (req as any).context?.userId || 'SYSTEM';

            await companyProvisioningService.activateCompany(id, activatedBy);

            res.json({
                success: true,
                message: `Company ${id} activated successfully`
            });

        } catch (error: any) {
            logger.error('Failed to activate company:', error);
            next(new AppError(error.message, 400));
        }
    }
}

export const provisioningController = new ProvisioningController();
