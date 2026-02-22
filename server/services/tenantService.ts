// Tenant service file with proper exports
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { auditService } from './auditService.js';

export interface TenantPlan {
    id: string;
    name: string;
    maxUsers: number;
    maxProjects: number;
    maxStorage: number;
    features: string[];
    price: number;
}

export interface Tenant {
    id: string;
    name: string;
    domain?: string;
    planId: string;
    status: 'active' | 'suspended' | 'pending';
    settings: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    adminUserId: string;
    subscription?: Record<string, any>;
    features?: string[] | Record<string, any>;
    total_users?: number;
    active_users?: number;
    total_projects?: number;
    total_budget?: number;
    total_spent?: number;
    total_storage_mb?: number;
    projects_last_30_days?: number;
}

export interface ProvisioningStep {
    step: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    message?: string;
    error?: string;
}

export interface SystemMetrics {
    totalCompanies: number;
    activeCompanies: number;
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    storageUsed: number;
    apiRequests: number;
    errorRate: number;
    activeTenants: number;
    suspendedTenants: number;
    systemLoad: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
    };
    recentActivity?: any[];
}

export interface SystemAlert {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error';
}

export class TenantService {
    /**
     * Get all tenant plans
     */
    static async getPlans(): Promise<TenantPlan[]> {
        const db = getDb();
        const plans = await db.all('SELECT * FROM tenant_plans ORDER BY price');
        return plans;
    }

    /**
     * Get tenant analytics
     */
    static async getTenantAnalytics(tenantId: string): Promise<any> {
        const db = getDb();
        const analytics = await db.get(
            `
            SELECT 
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT p.id) as total_projects,
                COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN u.id END) as active_users,
                COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
                COALESCE(SUM(CAST(p.budget AS DECIMAL)), 0) as total_budget,
                COALESCE(SUM(CAST(p.actual_cost AS DECIMAL)), 0) as total_spent,
                COUNT(DISTINCT CASE WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN p.id END) as projects_last_30_days
            FROM users u
            LEFT JOIN projects p ON u.tenant_id = p.tenant_id
            WHERE u.tenant_id = ?
        `,
            [tenantId]
        );

        return analytics;
    }

    /**
     * Log resource usage
     */
    static async logUsage(tenantId: string, resourceType: string, resourceId: string, details?: any): Promise<void> {
        const db = getDb();
        await db.run(
            `
            INSERT INTO resource_usage (tenant_id, resource_type, resource_id, details, created_at)
            VALUES (?, ?, ?, ?, ?)
        `,
            [tenantId, resourceType, resourceId, JSON.stringify(details || {}), new Date().toISOString()]
        );
    }

    /**
     * Check tenant limits
     */
    static async checkTenantLimits(tenantId: string): Promise<any> {
        const db = getDb();

        // Get tenant plan limits first
        const planLimits = await db.get(
            `SELECT tl.max_users, tl.max_projects, tl.max_storage_mb
             FROM tenant_limits tl
             LEFT JOIN tenants t ON tl.plan_id = t.plan_id
             WHERE t.id = ?`,
            [tenantId]
        );

        if (!planLimits) {
            return {
                max_users: 100,
                max_projects: 100,
                max_storage_mb: 1000,
                current_users: 0,
                current_projects: 0,
                current_storage: 0
            };
        }

        // Get current usage counts separately for better performance
        const [userCount, projectCount, storageUsed] = await Promise.all([
            db.get('SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND isActive = 1', [tenantId]),
            db.get('SELECT COUNT(*) as count FROM projects WHERE tenantId = ?', [tenantId]),
            db.get('SELECT COALESCE(SUM(storage_bytes), 0) as total FROM projects WHERE tenantId = ?', [tenantId])
        ]);

        return {
            ...planLimits,
            current_users: userCount?.count || 0,
            current_projects: projectCount?.count || 0,
            current_storage: storageUsed?.total || 0
        };
    }

    /**
     * Update tenant resource limits
     */
    static async updateTenantLimits(tenantId: string, limits: { maxUsers?: number; maxProjects?: number; plan?: string }): Promise<void> {
        const db = getDb();
        const updates: string[] = [];
        const params: any[] = [];

        if (limits.maxUsers !== undefined) {
            updates.push('maxUsers = ?');
            params.push(limits.maxUsers);
        }
        if (limits.maxProjects !== undefined) {
            updates.push('maxProjects = ?');
            params.push(limits.maxProjects);
        }
        if (limits.plan !== undefined) {
            updates.push('plan = ?');
            params.push(limits.plan);
        }

        if (updates.length === 0) return;

        params.push(new Date().toISOString(), tenantId);
        await db.run(
            `UPDATE companies SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`,
            params
        );
        logger.info(`Updated limits for tenant ${tenantId}`, limits);
    }

    /**
     * Get tenant usage
     */
    static async getTenantUsage(tenantId: string): Promise<any> {
        const db = getDb();
        const usage = await db.get(
            `
            SELECT
                COUNT(DISTINCT CASE WHEN action = 'LOGIN' THEN 1 END) as logins_last_30_days,
                COUNT(DISTINCT CASE WHEN action = 'LOGIN_FAILED' THEN 1 END) as failed_logins_last_30_days,
                COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_last_30_days,
                COALESCE(SUM(api_calls), 0) as api_calls_last_30_days,
                COALESCE(SUM(storage_bytes), 0) as storage_used_mb
            FROM audit_logs
            WHERE tenant_id = ? 
              AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `,
            [tenantId]
        );

        return usage;
    }

    /**
     * Get all tenants for admin dashboard
     */
    static async getAllTenants(): Promise<any[]> {
        const db = getDb();
        const tenants = await db.all(`
            SELECT 
                c.*,
                COALESCE(COUNT(DISTINCT u.id), 0) as total_users,
                COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN u.id END) as active_users,
                COUNT(DISTINCT p.id) as total_projects,
                COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
                COALESCE(SUM(CAST(p.budget AS DECIMAL)), 0) as total_budget,
                COALESCE(SUM(CAST(p.actual_cost AS DECIMAL)), 0) as total_spent,
                COUNT(DISTINCT CASE WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN p.id END) as projects_last_30_days
            FROM companies c
            LEFT JOIN users u ON c.tenant_id = u.tenant_id
            LEFT JOIN projects p ON c.tenant_id = p.tenant_id
            WHERE c.is_active = 1
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        return tenants.map((tenant) => ({
            ...tenant,
            stats: {
                totalUsers: tenant.total_users || 0,
                activeUsers: tenant.active_users || 0,
                totalProjects: tenant.total_projects || 0,
                totalBudget: tenant.total_budget || 0,
                totalSpent: tenant.total_spent || 0,
                activeProjects: tenant.active_projects || 0,
                totalStorageUsed: 0
            }
        }));
    }

    /**
     * Update tenant status
     */
    static async updateTenantStatus(
        tenantId: string,
        status: 'active' | 'suspended' | 'pending',
        reason?: string
    ): Promise<void> {
        const db = getDb();

        let sql = `UPDATE companies SET status = ?, updated_at = ?`;
        let params: any[] = [status, new Date().toISOString()];

        if (reason) {
            sql += `, suspended_reason = ? WHERE id = ?`;
            params.push(reason, tenantId);
        } else {
            sql += ` WHERE id = ?`;
            params.push(tenantId);
        }

        await db.run(sql, params);

        logger.info(`Tenant ${tenantId} status updated to ${status}${reason ? ` (${reason})` : ''}`);
    }

    /**
     * Create new tenant with full provisioning
     */
    static async createTenant(tenantData: {
        name: string;
        domain?: string;
        planId: string;
        adminUser: {
            name: string;
            email: string;
            password: string;
        };
        settings?: Record<string, any>;
    }): Promise<{ tenant: Tenant; provisioningSteps: ProvisioningStep[] }> {
        const db = getDb();
        const tenantId = uuidv4();

        const provisioningSteps: ProvisioningStep[] = [
            { step: 'validate_data', status: 'pending' },
            { step: 'create_tenant', status: 'pending' },
            { step: 'setup_database', status: 'pending' },
            { step: 'create_admin_user', status: 'pending' },
            { step: 'configure_domain', status: 'pending' },
            { step: 'initialize_features', status: 'pending' },
            { step: 'send_welcome_email', status: 'pending' }
        ];

        try {
            // Step 1: Validate data
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[0], 'in_progress');
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[0], 'completed');

            // Step 2: Create tenant record
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[1], 'in_progress');
            const tenant = await TenantService.createTenantRecord(tenantId, tenantData);
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[1], 'completed');

            // Step 3: Setup tenant database
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[2], 'in_progress');
            await TenantService.setupTenantDatabase(tenantId);
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[2], 'completed');

            // Step 4: Create admin user
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[3], 'in_progress');
            const adminUser = await TenantService.createAdminUser(tenantId, tenantData.adminUser);
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[3], 'completed');

            // Set tenant with admin user ID
            await db.run('UPDATE companies SET admin_user_id = ? WHERE id = ?', [adminUser.id, tenantId]);

            // Step 5: Configure domain (if provided)
            if (tenantData.domain) {
                await TenantService.updateProvisioningStep(tenantId, provisioningSteps[4], 'in_progress');
                try {
                    await TenantService.configureTenantDomain(tenantId, tenantData.domain);
                    await TenantService.updateProvisioningStep(tenantId, provisioningSteps[4], 'completed');
                } catch (error: any) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    logger.error(`Failed to configure domain for tenant ${tenantId}:`, error);
                    await TenantService.updateProvisioningStep(
                        tenantId,
                        provisioningSteps[4],
                        'failed',
                        undefined,
                        errorMessage
                    );
                    // Don't fail the entire provisioning if domain configuration fails
                }
            }

            // Step 6: Initialize features
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[5], 'in_progress');
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[5], 'completed');

            // Step 7: Send welcome email
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[6], 'in_progress');
            await TenantService.updateProvisioningStep(tenantId, provisioningSteps[6], 'completed');

            // Audit the event
            try {
                await auditService.log(db, {
                    userId: 'system',
                    action: 'TenantService.createTenant',
                    resource: 'companies',
                    resourceId: tenantId,
                    metadata: { name: tenantData.name }
                });
            } catch (err) {
                logger.error('Failed to log audit event for tenant creation', err);
            }

            return { tenant, provisioningSteps };
        } catch (error) {
            logger.error('Tenant creation failed:', error);
            throw error;
        }
    }

    /**
     * Get tenant by ID
     */
    static async getTenantById(tenantId: string): Promise<Tenant | null> {
        const db = getDb();
        const tenant = await db.get(
            `
            SELECT 
                t.*,
                COALESCE(COUNT(u.id), 0) as total_users,
                COALESCE(COUNT(CASE WHEN u.is_active = 1 THEN u.id END), 0) as active_users,
                COALESCE(COUNT(DISTINCT p.id), 0) as total_projects,
                COALESCE(SUM(CAST(p.budget AS DECIMAL)), 0) as total_budget,
                COALESCE(SUM(CAST(p.actual_cost AS DECIMAL)), 0) as total_spent,
                COALESCE(SUM(CAST(p.storage_bytes AS DECIMAL)), 0) as total_storage_mb
            FROM companies t
            LEFT JOIN users u ON t.tenant_id = u.tenant_id
            LEFT JOIN projects p ON t.tenant_id = p.tenant_id
            WHERE t.id = ?
        `,
            [tenantId]
        );

        return tenant || null;
    }

    /**
     * Update tenant settings
     */
    static async updateTenantSettings(tenantId: string, settings: Record<string, any>): Promise<void> {
        const db = getDb();
        const currentSettings = await db.get('SELECT settings FROM companies WHERE id = ?', [tenantId]);
        const mergedSettings = { ...currentSettings, ...settings };

        await db.run(
            `
            UPDATE companies 
            SET settings = ?, updated_at = ? 
            WHERE id = ?
        `,
            [JSON.stringify(mergedSettings), new Date().toISOString(), tenantId]
        );

        logger.info(`Updated settings for tenant ${tenantId}`);
    }

    /**
     * Add tenant feature
     */
    static async addTenantFeature(tenantId: string, feature: string): Promise<void> {
        const db = getDb();
        const currentFeatures = await db.get(
            `
            SELECT features FROM tenant_features WHERE tenant_id = ?
        `,
            [tenantId]
        );

        const updatedFeatures = [...(currentFeatures?.features || []), feature];

        await db.run(
            `
            INSERT OR REPLACE INTO tenant_features 
            (tenant_id, features, updated_at)
            VALUES (?, ?, ?)
        `,
            [tenantId, JSON.stringify(updatedFeatures), new Date().toISOString()]
        );

        logger.info(`Added feature ${feature} to tenant ${tenantId}`);
    }

    /**
     * Remove tenant feature
     */
    static async removeTenantFeature(tenantId: string, feature: string): Promise<void> {
        const db = getDb();
        const currentFeatures = await db.get(
            `
            SELECT features FROM tenant_features WHERE tenant_id = ?
        `,
            [tenantId]
        );

        const updatedFeatures = (currentFeatures?.features || []).filter((f: string) => f !== feature);

        await db.run(
            `
            UPDATE tenant_features 
            SET features = ?, updated_at = ?
            WHERE tenant_id = ?
        `,
            [JSON.stringify(updatedFeatures), new Date().toISOString(), tenantId]
        );

        logger.info(`Removed feature ${feature} from tenant ${tenantId}`);
    }

    /**
     * Update tenant basic information
     */
    static async updateTenant(tenantId: string, updates: {
        name?: string;
        domain?: string;
        planId?: string;
        settings?: Record<string, any>;
    }, updatedBy?: string): Promise<Tenant> {
        const db = getDb();
        const updateFields: string[] = [];
        const params: any[] = [];

        if (updates.name !== undefined) {
            updateFields.push('name = ?');
            params.push(updates.name);
        }

        if (updates.domain !== undefined) {
            updateFields.push('domain = ?');
            params.push(updates.domain);
        }

        if (updates.planId !== undefined) {
            updateFields.push('plan_id = ?');
            params.push(updates.planId);
        }

        if (updates.settings !== undefined) {
            updateFields.push('settings = ?');
            params.push(JSON.stringify(updates.settings));
        }

        if (updateFields.length === 0) {
            throw new Error('No update fields provided');
        }

        updateFields.push('updated_at = ?');
        params.push(new Date().toISOString());
        params.push(tenantId);

        const sql = `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`;
        await db.run(sql, params);

        // Audit the update
        try {
            await auditService.log(db, {
                userId: updatedBy || 'system:tenant-service',
                action: 'TenantService.updateTenant',
                resource: 'companies',
                resourceId: tenantId,
                metadata: updates
            });
        } catch (err) {
            logger.error('Failed to log audit event for tenant update', err);
        }

        // Fetch and return updated tenant
        const tenant = await db.get('SELECT * FROM companies WHERE id = ?', [tenantId]);
        return tenant as Tenant;
    }

    /**
     * Configure domain for tenant
     * Validates domain format and updates tenant record
     */
    static async configureTenantDomain(tenantId: string, domain: string): Promise<void> {
        // Domain validation regex - validates proper DNS domain format
        // Rules:
        // - Each label (part between dots) must be 1-63 characters
        // - Labels can contain alphanumeric characters and hyphens
        // - Labels cannot start or end with hyphens
        // - Must have at least one dot separator
        // - TLD (last label) must be at least 2 characters and alphabetic only
        // - Total length must not exceed 253 characters
        const DOMAIN_VALIDATION_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        const MAX_DOMAIN_LENGTH = 253;
        
        if (!domain || domain.length > MAX_DOMAIN_LENGTH || !DOMAIN_VALIDATION_REGEX.test(domain)) {
            throw new Error(`Invalid domain format: ${domain}. Domain must be a valid DNS name.`);
        }

        const db = getDb();
        
        // Check if domain is already in use by another tenant
        const existingTenant = await db.get(
            'SELECT id FROM companies WHERE domain = ? AND id != ?',
            [domain, tenantId]
        );

        if (existingTenant) {
            throw new Error(`Domain ${domain} is already in use by another tenant`);
        }

        // Update tenant with domain
        await db.run(
            'UPDATE companies SET domain = ?, updated_at = ? WHERE id = ?',
            [domain, new Date().toISOString(), tenantId]
        );

        logger.info(`Configured domain ${domain} for tenant ${tenantId}`);

        // Audit the domain configuration
        try {
            await auditService.log(db, {
                userId: 'system:tenant-provisioning',
                action: 'TenantService.configureDomain',
                resource: 'companies',
                resourceId: tenantId,
                metadata: { domain }
            });
        } catch (err) {
            logger.error('Failed to log audit event for domain configuration', err);
        }
    }

    /**
     * Get provisioning steps for a tenant
     */
    static async getProvisioningSteps(tenantId: string): Promise<ProvisioningStep[]> {
        const db = getDb();
        const steps = await db.all(
            `
            SELECT step, status, message, error, created_at
            FROM tenant_provisioning_steps
            WHERE tenant_id = ?
            ORDER BY created_at ASC
        `,
            [tenantId]
        );

        return steps;
    }

    /**
     * Update provisioning step
     */
    static async updateProvisioningStep(
        tenantId: string,
        step: ProvisioningStep,
        status: 'pending' | 'in_progress' | 'completed' | 'failed',
        message?: string,
        error?: string
    ): Promise<void> {
        const db = getDb();
        await db.run(
            `
            INSERT OR REPLACE INTO tenant_provisioning_steps 
            (tenant_id, step, status, message, error, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
            [
                tenantId,
                step.step,
                status,
                message || step.message,
                error || step.error,
                new Date().toISOString(),
                new Date().toISOString()
            ]
        );
    }

    /**
     * Create tenant record
     */
    private static async createTenantRecord(tenantId: string, tenantData: any): Promise<Tenant> {
        const db = getDb();
        const now = new Date().toISOString();

        await db.run(
            `
            INSERT INTO companies (id, name, domain, plan_id, status, settings, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
            [
                tenantId,
                tenantData.name,
                tenantData.domain || null,
                tenantData.planId,
                'pending',
                JSON.stringify(tenantData.settings || {}),
                now,
                now
            ]
        );

        return {
            id: tenantId,
            name: tenantData.name,
            domain: tenantData.domain,
            planId: tenantData.planId,
            status: 'pending',
            settings: tenantData.settings || {},
            createdAt: now,
            updatedAt: now,
            adminUserId: ''
        };
    }

    /**
     * Setup tenant database
     */
    private static async setupTenantDatabase(tenantId: string): Promise<void> {
        const db = getDb();

        // Create tenant-specific tables if needed
        // This is a placeholder for actual database setup logic
        logger.info(`Setting up database for tenant ${tenantId}`);
    }

    /**
     * Create admin user for tenant
     */
    private static async createAdminUser(tenantId: string, adminUser: any): Promise<any> {
        const db = getDb();
        const userId = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `
            INSERT INTO users (id, tenant_id, name, email, password, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'ADMIN', 1, ?, ?)
        `,
            [
                userId,
                tenantId,
                adminUser.name,
                adminUser.email,
                adminUser.password, // This should be hashed
                now,
                now
            ]
        );

        return { id: userId, ...adminUser };
    }

    /**
     * Get system metrics for admin dashboard
     */
    static async getSystemMetrics(): Promise<SystemMetrics> {
        const db = getDb();

        const [companies, users, projects] = await Promise.all([
            db.all('SELECT * FROM companies'),
            db.all('SELECT * FROM users'),
            db.all('SELECT * FROM projects')
        ]);

        const activeCompanies = companies.filter((c: any) => c.is_active && c.status === 'active').length;
        const activeUsers = users.filter((u: any) => u.is_active).length;
        const activeTenants = companies.filter((c: any) => c.status === 'active').length;
        const suspendedTenants = companies.filter((c: any) => c.status === 'suspended').length;

        return {
            totalCompanies: companies.length,
            activeCompanies,
            totalUsers: users.length,
            activeUsers,
            totalProjects: projects.length,
            storageUsed: 0, // Calculate from actual storage
            apiRequests: 0, // Get from analytics
            errorRate: 0, // Calculate from logs
            activeTenants,
            suspendedTenants,
            systemLoad: {
                cpu: 0,
                memory: 0,
                disk: 0,
                network: 0
            }
        };
    }

    /**
     * Get system alerts
     */
    static async getSystemAlerts(): Promise<SystemAlert[]> {
        const db = getDb();
        const alerts = await db.all(`
            SELECT * FROM system_alerts 
            ORDER BY created_at DESC 
            LIMIT 50
        `);

        return alerts.map((alert: any) => ({
            id: alert.id,
            type: alert.type,
            message: alert.message,
            timestamp: alert.created_at,
            severity: alert.severity
        }));
    }

    /**
     * Create system alert
     */
    static async createSystemAlert(
        type: string,
        message: string,
        severity: 'info' | 'warning' | 'error' = 'info'
    ): Promise<void> {
        const db = getDb();
        const alertId = uuidv4();

        await db.run(
            `
            INSERT INTO system_alerts (id, type, message, severity, created_at)
            VALUES (?, ?, ?, ?, ?)
        `,
            [alertId, type, message, severity, new Date().toISOString()]
        );
    }

    /**
     * Get resource access for a tenant
     */
    static async getTenantResourceAccess(tenantId: string): Promise<any[]> {
        const db = getDb();
        const access = await db.all(
            `
            SELECT * FROM tenant_resource_access 
            WHERE tenant_id = ?
        `,
            [tenantId]
        );

        return access.map((ra: any) => ({
            resource_id: ra.resource_id,
            resource_type: ra.resource_type,
            permissions: JSON.parse(ra.permissions || '{}'),
            created_at: ra.created_at,
            granted_at: ra.granted_at,
            granted_by: ra.granted_by
        }));
    }

    /**
     * Check if tenant has access to a resource
     */
    static async checkResourceAccess(tenantId: string, resourceType: string, resourceId: string): Promise<boolean> {
        const db = getDb();
        const access = await db.get(
            `
            SELECT COUNT(*) as count FROM tenant_resource_access 
            WHERE tenant_id = ? AND resource_type = ? AND resource_id = ?
        `,
            [tenantId, resourceType, resourceId]
        );

        return access.count > 0;
    }

    /**
     * Grant resource access
     */
    static async grantResourceAccess(
        tenantId: string,
        resourceType: string,
        resourceId: string,
        permissions: string[],
        grantedBy?: string
    ): Promise<void> {
        const db = getDb();
        const existing = await db.get(
            `
            SELECT COUNT(*) as count FROM tenant_resource_access 
            WHERE tenant_id = ? AND resource_type = ? AND resource_id = ?
        `,
            [tenantId, resourceType, resourceId]
        );

        if (existing.count === 0) {
            await db.run(
                `
                INSERT INTO tenant_resource_access 
                (tenant_id, resource_type, resource_id, permissions, created_at, granted_at, granted_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
                [
                    tenantId,
                    resourceType,
                    resourceId,
                    JSON.stringify(permissions),
                    new Date().toISOString(),
                    new Date().toISOString(),
                    grantedBy
                ]
            );

            logger.info(`Granted access to resource ${resourceType}:${resourceId} for tenant ${tenantId}`);
        }
    }

    /**
     * Remove resource access
     */
    static async removeResourceAccess(tenantId: string, resourceType: string, resourceId: string): Promise<void> {
        const db = getDb();

        await db.run(
            `
            DELETE FROM tenant_resource_access 
            WHERE tenant_id = ? AND resource_type = ? AND resource_id = ?
        `,
            [tenantId, resourceType, resourceId]
        );

        logger.info(`Revoked access to resource ${resourceType}:${resourceId} for tenant ${tenantId}`);
    }
    /**
     * Get full tenant context for a user
     */
    static async getTenantContext(tenantId: string, userId: string): Promise<any> {
        const db = getDb();

        // Fetch user with role and permissions
        const user = await db.get(`
            SELECT u.id, u.role, u.tenant_id, r.permissions
            FROM users u
            LEFT JOIN roles r ON u.role = r.name
            WHERE u.id = ? AND u.tenant_id = ?
        `, [userId, tenantId]);

        if (!user) {
            throw new Error(`User ${userId} not found in tenant ${tenantId}`);
        }

        return {
            tenantId: user.tenant_id,
            userId: user.id,
            role: user.role,
            permissions: user.permissions ? JSON.parse(user.permissions) : [],
            isSuperadmin: user.role === 'SUPERADMIN'
        };
    }
}

export default TenantService;
