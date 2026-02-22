import { UserRole } from '../types.js';
import { getDb } from '../database.js';
import { dbHelper } from '../utils/dbHelper.js';
import crypto from 'crypto';

interface OptionalPermission {
    id: string;
    userId: string;
    companyId: string;
    permission: string;
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date | null;
    constraints?: Record<string, any>;
}

interface BreakGlassAccess {
    id: string;
    adminId: string;
    targetCompanyId: string;
    justification: string;
    grantedAt: Date;
    expiresAt: Date;
    status: 'active' | 'expired' | 'revoked';
}

/**
 * Permission Service - Granular RBAC checks based on permission matrix
 */
class PermissionService {
    /**
     * Platform Administration Permissions
     */

    canCreateCompany(role: UserRole): boolean {
        return role === UserRole.SUPERADMIN;
    }

    canProvisionDatabase(role: UserRole): boolean {
        return role === UserRole.SUPERADMIN;
    }

    canInviteCompanyAdmin(role: UserRole): boolean {
        return role === UserRole.SUPERADMIN;
    }

    canBroadcastMessages(role: UserRole): boolean {
        return role === UserRole.SUPERADMIN;
    }

    canViewPlatformLogs(role: UserRole): boolean {
        return role === UserRole.SUPERADMIN;
    }

    /**
     * Tenant User Management Permissions
     */

    async canInviteTenantUsers(
        role: UserRole,
        userId: string,
        companyId: string
    ): Promise<boolean> {
        if (role === UserRole.COMPANY_ADMIN) return true;
        if (role === UserRole.SUPERADMIN) return false;
        if (role === UserRole.SUPERVISOR) {
            return await this.hasOptionalPermission(userId, companyId, 'invite_users');
        }
        return false;
    }

    async canManageTenantRoles(
        role: UserRole,
        userId: string,
        companyId: string,
        isBreakGlass: boolean = false
    ): Promise<boolean> {
        if (role === UserRole.COMPANY_ADMIN) return true;
        if (role === UserRole.SUPERADMIN && isBreakGlass) {
            return await this.hasActiveBreakGlassAccess(userId, companyId);
        }
        if (role === UserRole.SUPERVISOR) {
            return await this.hasOptionalPermission(userId, companyId, 'manage_roles');
        }
        return false;
    }

    /**
     * Document Access Permissions
     */

    async canAccessDocuments(
        role: UserRole,
        userId: string,
        companyId: string,
        documentCompanyId: string,
        isBreakGlass: boolean = false
    ): Promise<boolean> {
        if (role === UserRole.COMPANY_ADMIN && companyId === documentCompanyId) {
            return true;
        }
        if (role === UserRole.SUPERADMIN && isBreakGlass) {
            return await this.hasActiveBreakGlassAccess(userId, documentCompanyId);
        }
        if ([UserRole.SUPERVISOR, UserRole.OPERATIVE].includes(role)) {
            return await this.hasOptionalPermission(userId, companyId, 'access_documents');
        }
        return false;
    }

    /**
     * Suspension Permissions
     */

    canSuspendUser(role: UserRole, targetCompanyId: string, userCompanyId: string): boolean {
        if (role === UserRole.SUPERADMIN) return true;
        if (role === UserRole.COMPANY_ADMIN && targetCompanyId === userCompanyId) return true;
        return false;
    }

    canSuspendCompany(role: UserRole): boolean {
        return role === UserRole.SUPERADMIN;
    }

    /**
     * Audit Log Permissions
     */

    async canViewTenantAuditLogs(
        role: UserRole,
        userId: string,
        targetCompanyId: string,
        userCompanyId: string
    ): Promise<boolean> {
        if (role === UserRole.SUPERADMIN) {
            return await this.hasOptionalPermission(userId, targetCompanyId, 'view_audit_logs');
        }
        if (role === UserRole.COMPANY_ADMIN && targetCompanyId === userCompanyId) return true;
        if (role === UserRole.SUPERVISOR) {
            return await this.hasOptionalPermission(userId, targetCompanyId, 'view_audit_logs');
        }
        return false;
    }

    /**
     * Optional Permissions System
     */

    async hasOptionalPermission(userId: string, companyId: string, permission: string): Promise<boolean> {
        const db = await getDb();
        const result = await db.get<OptionalPermission>(
            `SELECT * FROM optional_permissions 
       WHERE userId = ? AND companyId = ? AND permission = ?
       AND (expiresAt IS NULL OR expiresAt > ${dbHelper.now()})`,
            [userId, companyId, permission]
        );
        return !!result;
    }

    async grantOptionalPermission(
        userId: string,
        companyId: string,
        permission: string,
        grantedBy: string,
        expiresAt?: Date,
        constraints?: Record<string, any>
    ): Promise<OptionalPermission> {
        const db = await getDb();
        const permissionId = crypto.randomUUID();
        const now = new Date();

        await db.run(
            `INSERT INTO optional_permissions 
       (id, userId, companyId, permission, grantedBy, grantedAt, expiresAt, constraints)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                permissionId,
                userId,
                companyId,
                permission,
                grantedBy,
                now.toISOString(),
                expiresAt?.toISOString() || null,
                constraints ? JSON.stringify(constraints) : null
            ]
        );

        return {
            id: permissionId,
            userId,
            companyId,
            permission,
            grantedBy,
            grantedAt: now,
            expiresAt: expiresAt || null,
            constraints
        };
    }

    async revokeOptionalPermission(permissionId: string, revokedBy: string): Promise<void> {
        const db = await getDb();
        const permission = await db.get<OptionalPermission>(
            'SELECT * FROM optional_permissions WHERE id = ?',
            [permissionId]
        );

        if (!permission) throw new Error('Permission not found');

        await db.run('DELETE FROM optional_permissions WHERE id = ?', [permissionId]);
    }

    async getUserOptionalPermissions(userId: string, companyId: string): Promise<OptionalPermission[]> {
        const db = await getDb();
        const permissions = await db.all<OptionalPermission>(
            `SELECT * FROM optional_permissions 
       WHERE userId = ? AND companyId = ?
       AND (expiresAt IS NULL OR expiresAt > ${dbHelper.now()})
       ORDER BY grantedAt DESC`,
            [userId, companyId]
        );
        return permissions;
    }

    /**
     * Break-glass Access System
     */

    async requestBreakGlassAccess(
        adminId: string,
        targetCompanyId: string,
        justification: string,
        durationMinutes: number = 60
    ): Promise<BreakGlassAccess> {
        const db = await getDb();
        const accessId = crypto.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

        await db.run(
            `INSERT INTO emergency_access 
       (id, adminId, targetCompanyId, justification, grantedAt, expiresAt, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [accessId, adminId, targetCompanyId, justification, now.toISOString(), expiresAt.toISOString(), 'active']
        );

        return {
            id: accessId,
            adminId,
            targetCompanyId,
            justification,
            grantedAt: now,
            expiresAt,
            status: 'active'
        };
    }

    async hasActiveBreakGlassAccess(adminId: string, targetCompanyId: string): Promise<boolean> {
        const db = await getDb();
        const access = await db.get<BreakGlassAccess>(
            `SELECT * FROM emergency_access 
       WHERE adminId = ? AND targetCompanyId = ? AND status = 'active'
       AND expiresAt > ${dbHelper.now()}
       ORDER BY grantedAt DESC LIMIT 1`,
            [adminId, targetCompanyId]
        );
        return !!access;
    }

    async revokeBreakGlassAccess(accessId: string, revokedBy: string): Promise<void> {
        const db = await getDb();
        await db.run(`UPDATE emergency_access SET status = 'revoked' WHERE id = ?`, [accessId]);
    }

    async cleanupExpiredPermissions(): Promise<void> {
        const db = await getDb();
        await db.run(
            `DELETE FROM optional_permissions 
       WHERE expiresAt IS NOT NULL AND expiresAt < ${dbHelper.now()}`
        );
        await db.run(
            `UPDATE emergency_access SET status = 'expired' 
       WHERE status = 'active' AND expiresAt < ${dbHelper.now()}`
        );
    }

    // Legacy compatibility methods
    async hasPermission(userId: string, permission: string, tenantId?: string): Promise<boolean> {
        if (!tenantId) return false;
        return await this.hasOptionalPermission(userId, tenantId, permission);
    }

    async getUserGlobalRole(userId: string): Promise<string | null> {
        const db = await getDb();
        const membership = await db.get(
            `SELECT role FROM memberships WHERE userId = ? AND role = 'SUPERADMIN' LIMIT 1`,
            [userId]
        );
        return membership ? 'SUPERADMIN' : null;
    }

    async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
        const permissions = await this.getUserOptionalPermissions(userId, tenantId);
        return permissions.map(p => p.permission);
    }

    async getPermissions(): Promise<any[]> {
        return [
            // Companies
            { id: 'companies.create', resource: 'companies', action: 'create', description: 'Create companies' },
            { id: 'companies.read', resource: 'companies', action: 'read', description: 'View companies' },
            { id: 'companies.update', resource: 'companies', action: 'update', description: 'Update companies' },
            { id: 'companies.delete', resource: 'companies', action: 'delete', description: 'Delete companies' },

            // Users
            { id: 'users.create', resource: 'users', action: 'create', description: 'Create users' },
            { id: 'users.read', resource: 'users', action: 'read', description: 'View users' },
            { id: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
            { id: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },

            // Projects
            { id: 'projects.create', resource: 'projects', action: 'create', description: 'Create projects' },
            { id: 'projects.read', resource: 'projects', action: 'read', description: 'View projects' },
            { id: 'projects.update', resource: 'projects', action: 'update', description: 'Update projects' },
            { id: 'projects.delete', resource: 'projects', action: 'delete', description: 'Delete projects' },

            // Documents
            { id: 'documents.create', resource: 'documents', action: 'create', description: 'Upload documents' },
            { id: 'documents.read', resource: 'documents', action: 'read', description: 'View documents' },
            { id: 'documents.update', resource: 'documents', action: 'update', description: 'Update documents' },
            { id: 'documents.delete', resource: 'documents', action: 'delete', description: 'Delete documents' },

            // Tasks
            { id: 'tasks.create', resource: 'tasks', action: 'create', description: 'Create tasks' },
            { id: 'tasks.read', resource: 'tasks', action: 'read', description: 'View tasks' },
            { id: 'tasks.update', resource: 'tasks', action: 'update', description: 'Update tasks' },
            { id: 'tasks.delete', resource: 'tasks', action: 'delete', description: 'Delete tasks' },

            // Financial
            { id: 'invoices.create', resource: 'invoices', action: 'create', description: 'Create invoices' },
            { id: 'invoices.read', resource: 'invoices', action: 'read', description: 'View invoices' },
            { id: 'invoices.update', resource: 'invoices', action: 'update', description: 'Update invoices' },
            { id: 'expenses.create', resource: 'expenses', action: 'create', description: 'Create expenses' },
            { id: 'expenses.read', resource: 'expenses', action: 'read', description: 'View expenses' },

            // System
            { id: 'audit.read', resource: 'audit', action: 'read', description: 'View audit logs' },
            { id: 'export.create', resource: 'export', action: 'create', description: 'Export data' },
            { id: 'settings.read', resource: 'settings', action: 'read', description: 'View settings' },
            { id: 'settings.update', resource: 'settings', action: 'update', description: 'Modify settings' },
        ];
    }

    async getRolePermissions(role: UserRole): Promise<string[]> {
        const rolePermissions: Record<string, string[]> = {
            [UserRole.SUPERADMIN]: ['*'],
            [UserRole.COMPANY_ADMIN]: ['invite_users', 'manage_roles', 'access_documents', 'view_audit_logs'],
            [UserRole.SUPERVISOR]: ['access_documents'],
            [UserRole.OPERATIVE]: ['access_documents']
        };
        return rolePermissions[role] || [];
    }

    async hasAnyPermission(userId: string, permissions: string[], tenantId?: string): Promise<boolean> {
        for (const permission of permissions) {
            const hasOpt = await this.hasOptionalPermission(userId, tenantId || '', permission);
            if (hasOpt) return true;
        }
        return false;
    }

    async hasAllPermissions(userId: string, permissions: string[], tenantId?: string): Promise<boolean> {
        for (const permission of permissions) {
            const hasOpt = await this.hasOptionalPermission(userId, tenantId || '', permission);
            if (!hasOpt) return false;
        }
        return true;
    }
}

export const permissionService = new PermissionService();
export { PermissionService };
export type { OptionalPermission, BreakGlassAccess };
