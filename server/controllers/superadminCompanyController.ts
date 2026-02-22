import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { MODULE_DEFINITIONS, CompanyModule } from '../types/modules.js';

/**
 * Get all companies with statistics (SUPERADMIN only)
 */
export const getAllCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();

        // Get all companies with member counts
        const companies = await db.all(`
            SELECT 
                c.*,
                tr.dbConnectionString,
                c.features,
                COUNT(DISTINCT m.userId) as memberCount,
                COUNT(DISTINCT CASE WHEN m.status = 'active' THEN m.userId END) as activeMemberCount
            FROM companies c
            LEFT JOIN memberships m ON c.id = m.companyId
            LEFT JOIN tenant_registry tr ON c.id = tr.companyId
            GROUP BY c.id
            ORDER BY c.createdAt DESC
        `);

        // Parse JSON fields
        const companiesWithParsedData = companies.map((company) => ({
            ...company,
            settings: company.settings ? JSON.parse(company.settings) : {},
            subscription: company.subscription ? JSON.parse(company.subscription) : { status: 'active', plan: 'free' },
            features: company.features ? JSON.parse(company.features) : [],
            isolationMode: company.dbConnectionString ? 'Dedicated' : 'Shared'
        }));

        res.json(companiesWithParsedData);
    } catch (e) {
        next(e);
    }
};

/**
 * Get company statistics for dashboard (SUPERADMIN only)
 */
export const getCompanyStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();

        const stats = await db.get(`
            SELECT 
                COUNT(*) as totalCompanies,
                COUNT(CASE WHEN status = 'Active' THEN 1 END) as activeCompanies,
                COUNT(CASE WHEN status = 'Suspended' THEN 1 END) as suspendedCompanies,
                SUM(users) as totalUsers,
                SUM(projects) as totalProjects,
                SUM(mrr) as totalMrr
            FROM companies
        `);

        // Get recent companies (last 30 days)
        const date = new Date();
        date.setDate(date.getDate() - 30);
        const thirtyDaysAgo = date.toISOString();

        const recentCompanies = await db.get(
            `
            SELECT COUNT(*) as count
            FROM companies
            WHERE createdAt >= ?
        `,
            [thirtyDaysAgo]
        );

        // Get plan distribution
        const planDistribution = await db.all(`
            SELECT plan, COUNT(*) as count
            FROM companies
            GROUP BY plan
        `);

        res.json({
            ...stats,
            recentCompanies: recentCompanies.count,
            planDistribution
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Suspend a company (SUPERADMIN only)
 */
import { TenantService } from '../services/tenantService.js';
import { companyProvisioningService } from '../services/companyProvisioningService.js';

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            name,
            legalName,
            slug,
            industry,
            region,
            ownerEmail,
            ownerName,
            plan,
            maxUsers,
            maxProjects,
            storageQuotaGB,
            isolationMode,
            initialFeatures
        } = req.body;

        if (!name || !ownerEmail || !ownerName) {
            throw new AppError('Name, Owner Email, and Owner Name are required', 400);
        }

        // 1. Provision Company
        const result = await companyProvisioningService.initiateProvisioning({
            name,
            legalName,
            slug,
            industry,
            region,
            ownerEmail,
            ownerName,
            plan,
            storageQuotaGB: storageQuotaGB ? Number(storageQuotaGB) : undefined,
            isolationMode,
            initialFeatures
        });

        // 2. Update Limits if provided (Optional overrides)
        if (maxUsers || maxProjects) {
            await TenantService.updateTenantLimits(result.companyId, {
                maxUsers: maxUsers ? Number(maxUsers) : undefined,
                maxProjects: maxProjects ? Number(maxProjects) : undefined,
                plan
            });
        }

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Suspend a company (SUPERADMIN only)
 */
export const suspendCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        // userId is available in req from auth middleware if needed for audit inside service

        await TenantService.updateTenantStatus(id, 'suspended', 'Admin action');

        // Audit log allows tracking reason, currently tenantService logs simple message
        // Enhancing tenantService audit later would be ideal, but for now this is cleaner

        res.json({ message: 'Company suspended successfully' });
    } catch (e) {
        next(e);
    }
};

/**
 * Activate a suspended company (SUPERADMIN only)
 */
export const activateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        await TenantService.updateTenantStatus(id, 'active');

        res.json({ message: 'Company activated successfully' });
    } catch (e) {
        next(e);
    }
};

/**
 * Update company resource limits (SUPERADMIN only)
 */
export const updateCompanyLimits = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { maxUsers, maxProjects, plan } = req.body;

        await TenantService.updateTenantLimits(id, {
            maxUsers: maxUsers ? Number(maxUsers) : undefined,
            maxProjects: maxProjects ? Number(maxProjects) : undefined,
            plan
        });

        res.json({ message: 'Company limits updated successfully' });
    } catch (e) {
        next(e);
    }
};

/**
 * Get company activity logs (SUPERADMIN only)
 */
export const getCompanyActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const db = getDb();
        const logs = await db.all(
            `
            SELECT *
            FROM audit_logs
            WHERE companyId = ?
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
        `,
            [id, Number(limit), Number(offset)]
        );

        // Parse JSON fields
        const logsWithParsedData = logs.map((log) => ({
            ...log,
            changes: log.changes ? JSON.parse(log.changes) : null
        }));

        res.json(logsWithParsedData);
    } catch (e) {
        next(e);
    }
};

/**
 * Update company features (SUPERADMIN only)
 */
export const updateCompanyFeatures = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { features } = req.body; // Expecting JSON object
        const db = getDb();

        await db.run(`UPDATE companies SET features = ?, updatedAt = ? WHERE id = ?`, [
            JSON.stringify(features),
            new Date().toISOString(),
            id
        ]);

        res.json({ message: 'Company features updated successfully' });
    } catch (e) {
        next(e);
    }
};

/**
 * Get company features with enabled status (SUPERADMIN only)
 */
export const getCompanyFeatures = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const db = getDb();

        const company = await db.get('SELECT features FROM companies WHERE id = ?', [id]);
        if (!company) throw new AppError('Company not found', 404);

        const enabledFeatures = company.features ? JSON.parse(company.features) : [];

        const features = MODULE_DEFINITIONS.map(def => ({
            name: def.id,
            displayname: def.name,
            description: def.description,
            category: mapCategory(def.category, def.id),
            enabled: enabledFeatures.includes(def.id),
            requiresfeatures: def.dependsOn || []
        }));

        res.json({ features });
    } catch (e) {
        next(e);
    }
};

/**
 * Toggle a single company feature (SUPERADMIN only)
 */
export const toggleCompanyFeature = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, featureName } = req.params;
        const { enabled } = req.body;
        const db = getDb();

        const company = await db.get('SELECT features FROM companies WHERE id = ?', [id]);
        if (!company) throw new AppError('Company not found', 404);

        let enabledFeatures = company.features ? JSON.parse(company.features) : [];

        if (enabled) {
            if (!enabledFeatures.includes(featureName)) {
                enabledFeatures.push(featureName);
            }
        } else {
            enabledFeatures = enabledFeatures.filter((f: string) => f !== featureName);
        }

        await db.run(`UPDATE companies SET features = ?, updatedAt = ? WHERE id = ?`, [
            JSON.stringify(enabledFeatures),
            new Date().toISOString(),
            id
        ]);

        res.json({ success: true, message: `Feature ${featureName} ${enabled ? 'enabled' : 'disabled'}` });
    } catch (e) {
        next(e);
    }
};

/**
 * Map backend categories to frontend expected categories
 */
function mapCategory(cat: string, id: string): string {
    // Specific overrides
    if (id === CompanyModule.AI_TOOLS) return 'AI_FEATURES';
    if (id === CompanyModule.API_ACCESS || id === CompanyModule.WEBHOOKS) return 'INTEGRATIONS';

    switch (cat) {
        case 'core': return 'COLLABORATION';
        case 'project': return 'AUTOMATION';
        case 'financial': return 'BILLING';
        case 'client': return 'COLLABORATION';
        case 'advanced': return 'ANALYTICS';
        case 'security': return 'SECURITY';
        default: return 'GENERAL';
    }
}

/**
 * Get company database and storage control data (SUPERADMIN only)
 */
export const getCompanyDatabaseControl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const db = getDb();

        const registry = await db.get('SELECT * FROM tenant_registry WHERE companyId = ?', [id]);
        const storage = await db.get('SELECT * FROM company_storage WHERE companyId = ?', [id]);
        const usage = await db.get(`
            SELECT * FROM company_usage 
            WHERE companyId = ? 
            ORDER BY month DESC LIMIT 1
        `, [id]);

        res.json({
            registry: registry || { status: 'PENDING', region: 'US' },
            storage: storage || { storageQuota: 10737418240, storageUsed: 0 },
            usage: usage || { apiCalls: 0, storageBytes: 0, activeUsers: 0 }
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Update company database and storage control (SUPERADMIN only)
 */
export const updateCompanyDatabaseControl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { storageQuota, status, dbConnectionString } = req.body;
        const db = getDb();

        const now = new Date().toISOString();

        if (storageQuota !== undefined) {
            await db.run(`
                INSERT INTO company_storage (id, companyId, bucketName, bucketType, storageQuota, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(companyId) DO UPDATE SET 
                    storageQuota = excluded.storageQuota
            `, [
                `store-${uuidv4()}`,
                id,
                `company-${id}`,
                'local',
                storageQuota,
                now
            ]);
        }

        if (status !== undefined || dbConnectionString !== undefined) {
            await db.run(`
                INSERT INTO tenant_registry (companyId, tenantId, dbConnectionString, status, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(companyId) DO UPDATE SET 
                    status = COALESCE(excluded.status, tenant_registry.status),
                    dbConnectionString = COALESCE(excluded.dbConnectionString, tenant_registry.dbConnectionString),
                    updatedAt = excluded.updatedAt
            `, [
                id,
                id,
                dbConnectionString || null,
                status || 'ACTIVE',
                now,
                now
            ]);
        }

        res.json({ success: true, message: 'Database control updated successfully' });
    } catch (e) {
        next(e);
    }
};
