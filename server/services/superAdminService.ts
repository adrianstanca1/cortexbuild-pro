import { AppError } from '../utils/AppError.js';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { UserRole } from '../types/rbac.js';

export interface SuspendTenantRequest {
    reason?: string;
}

export interface UpdateTenantLimitsRequest {
    maxUsers?: number;
    maxProjects?: number;
    maxStorageMB?: number;
}

export class SuperAdminService {
    /**
     * Update user role (SuperAdmin only)
     */
    static async updateUserRole(userId: string, newRole: string, tenantId: string, actorId?: string): Promise<void> {
        const db = getDb();

        // Check if actor is SuperAdmin
        const actor = await db.get('SELECT role FROM users WHERE id = ?', [actorId]);
        if (!actor || actor.role !== 'SUPERADMIN') {
            throw new AppError('Only SuperAdmin can change user roles', 403);
        }

        // Get target user
        const targetUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!targetUser) {
            throw new AppError('User not found', 404);
        }

        await db.run('UPDATE users SET role = ?, updatedAt = ? WHERE id = ?', [
            newRole,
            new Date().toISOString(),
            userId
        ]);

        logger.info(`User role updated: ${userId} to ${newRole} by ${actorId}`);
    }

    /**
     * Suspend a tenant (SuperAdmin only)
     */
    static async suspendTenant(tenantId: string, request: SuspendTenantRequest, actorId?: string): Promise<void> {
        const db = getDb();

        // Check if actor is SuperAdmin
        const actor = await db.get('SELECT role FROM users WHERE id = ?', [actorId]);
        if (!actor || actor.role !== 'SUPERADMIN') {
            throw new AppError('Only SuperAdmin can suspend tenants', 403);
        }

        // Get tenant
        const tenant = await db.get('SELECT * FROM companies WHERE id = ?', [tenantId]);
        if (!tenant) {
            throw new AppError('Tenant not found', 404);
        }

        await db.run('UPDATE companies SET status = ?, suspended_reason = ?, updated_at = ? WHERE id = ?', [
            'suspended',
            request.reason || 'Suspended by administrator',
            new Date().toISOString(),
            tenantId
        ]);

        // Deactivate all users in this tenant
        await db.run('UPDATE users SET isActive = 0 WHERE companyId = ?', [tenantId]);

        // Log audit event
        if (actorId) {
            await db.run(
                'INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    'audit-' + Date.now(),
                    tenantId,
                    actorId,
                    'SUPERADMIN',
                    'companies',
                    tenantId,
                    JSON.stringify({ tenantName: tenant.name, reason: request.reason, type: 'tenant_suspension' }),
                    'success',
                    new Date().toISOString()
                ]
            );
        }

        logger.info(
            `Tenant ${tenantId} suspended by ${actorId || 'system'} for reason: ${request.reason || 'Not specified'}`
        );
    }

    /**
     * Update tenant limits (SuperAdmin only)
     */
    static async updateTenantLimits(
        tenantId: string,
        request: UpdateTenantLimitsRequest,
        actorId?: string
    ): Promise<void> {
        const db = getDb();

        // Check if actor is SuperAdmin
        const actor = await db.get('SELECT role FROM users WHERE id = ?', [actorId]);
        if (!actor || actor.role !== 'SUPERADMIN') {
            throw new AppError('Only SuperAdmin can update tenant limits', 403);
        }

        // Get tenant
        const tenant = await db.get(
            'SELECT t.*, tl.plan_id FROM companies t LEFT JOIN tenant_limits tl ON tl.plan_id = t.plan_id WHERE t.id = ?',
            [tenantId]
        );
        if (!tenant) {
            throw new AppError('Tenant not found', 404);
        }

        if (!tenant.plan_id) {
            throw new AppError('Tenant does not have a configurable plan', 400);
        }

        // Update tenant limits
        const updateFields = [];
        const updateValues = [];

        if (request.maxUsers !== undefined) {
            updateFields.push('max_users = ?');
            updateValues.push(request.maxUsers);
        }

        if (request.maxProjects !== undefined) {
            updateFields.push('max_projects = ?');
            updateValues.push(request.maxProjects);
        }

        if (request.maxStorageMB !== undefined) {
            updateFields.push('max_storage_mb = ?');
            updateValues.push(request.maxStorageMB);
        }

        if (updateFields.length === 0) {
            throw new AppError('No limits provided to update', 400);
        }

        updateValues.push(new Date().toISOString());
        updateValues.push(tenant.plan_id);

        const sql = `UPDATE tenant_limits SET ${updateFields.join(', ')}, updated_at = ? WHERE plan_id = ?`;
        await db.run(sql, updateValues);

        // Log audit event
        if (actorId) {
            await db.run(
                'INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    'audit-' + Date.now(),
                    tenantId,
                    actorId,
                    'SUPERADMIN',
                    'tenant_limits',
                    tenant.plan_id,
                    JSON.stringify({ tenantId, limits: request }),
                    'success',
                    new Date().toISOString()
                ]
            );
        }

        logger.info(`Tenant limits updated for ${tenantId} by ${actorId || 'system'}`);
    }
}

export default SuperAdminService;
