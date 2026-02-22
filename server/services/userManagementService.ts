import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { UserRole } from '../types/rbac.js';
import { membershipService } from './membershipService.js';
import { emailService } from './emailService.js';
import { invitationService } from './invitationService.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
    status?: string;
}

export interface CreateUserRequest {
    email: string;
    name: string;
    password?: string;
    role: UserRole;
    companyId?: string;
    permissions?: string[];
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    role?: UserRole;
    status?: string;
    isActive?: boolean;
    password?: string;
}

export class UserManagementService {
    async getAllUsers(tenantId?: string, filters: { status?: string; role?: string; search?: string } = {}) {
        const db = getDb();
        let query = `
      SELECT u.id, u.email, u.name, u.role, u.status, u.companyId, u.isActive, u.createdAt, u.updatedAt,
             c.name as companyName
      FROM users u
      LEFT JOIN companies c ON u.companyId = c.id
    `;
        const params: any[] = [];

        const conditions = [];
        if (tenantId) {
            conditions.push('u.companyId = ?');
            params.push(tenantId);
        }

        if (filters.status) {
            conditions.push('u.status = ?');
            params.push(filters.status);
        }

        if (filters.role) {
            conditions.push('u.role = ?');
            params.push(filters.role);
        }

        if (filters.search) {
            conditions.push('(u.name LIKE ? OR u.email LIKE ? OR c.name LIKE ?)');
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY u.createdAt DESC';

        return await db.all<User>(query, params);
    }

    async getUserById(userId: string): Promise<User | null> {
        const db = getDb();
        const user = await db.get<User>(
            `SELECT u.id, u.email, u.name, u.role, u.status, u.companyId, u.isActive, u.createdAt, u.updatedAt,
               c.name as companyName
       FROM users u
       LEFT JOIN companies c ON u.companyId = c.id
       WHERE u.id = ?`,
            [userId]
        );
        return user || null;
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const db = getDb();
        const user = await db.get<User>('SELECT * FROM users WHERE email = ?', [email]);
        return user || null;
    }

    async createUser(userData: CreateUserRequest, actorId?: string): Promise<User> {
        const db = getDb();
        const now = new Date().toISOString();

        // Check if user already exists
        const existingUser = await this.getUserByEmail(userData.email);
        if (existingUser) {
            throw new AppError('User with this email already exists', 409);
        }

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (userData.password) {
            hashedPassword = await bcrypt.hash(userData.password, 12);
        }

        const userId = uuidv4();

        // Insert user
        await db.run(
            `INSERT INTO users (id, email, name, password, role, companyId, status, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                userData.email,
                userData.name,
                hashedPassword,
                userData.role,
                userData.companyId,
                'active', // default status
                true, // isActive
                now,
                now
            ]
        );

        // If company ID is provided, create membership
        if (userData.companyId) {
            await membershipService.addMember(
                {
                    userId,
                    companyId: userData.companyId,
                    role: userData.role,
                    permissions: userData.permissions
                },
                actorId || userId
            );
        }

        // Log audit event
        if (actorId) {
            await this.logAuditEvent(actorId, 'CREATE_USER', 'users', userId, {
                email: userData.email,
                name: userData.name,
                role: userData.role,
                companyId: userData.companyId
            });
        }

        logger.info(`User created: ${userId} by ${actorId || 'system'}`);

        return await this.getUserById(userId);
    }

    async updateUser(userId: string, updateData: UpdateUserRequest, actorId?: string): Promise<User> {
        const db = getDb();
        const now = new Date().toISOString();

        const updates: string[] = [];
        const params: any[] = [];

        if (updateData.name) {
            updates.push('name = ?');
            params.push(updateData.name);
        }
        if (updateData.email) {
            updates.push('email = ?');
            params.push(updateData.email);
        }
        if (updateData.role) {
            updates.push('role = ?');
            params.push(updateData.role);
        }
        if (updateData.status !== undefined) {
            updates.push('status = ?');
            params.push(updateData.status);
        }
        if (updateData.isActive !== undefined) {
            updates.push('isActive = ?');
            params.push(updateData.isActive);
        }
        if (updateData.password) {
            updates.push('password = ?');
            const hashedPassword = await bcrypt.hash(updateData.password, 12);
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        updates.push('updatedAt = ?');
        params.push(now);
        params.push(userId);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await db.run(query, params);

        // Log audit event
        if (actorId) {
            await this.logAuditEvent(actorId, 'UPDATE_USER', 'users', userId, updateData);
        }

        logger.info(`User updated: ${userId} by ${actorId || 'system'}`);

        return await this.getUserById(userId);
    }

    async deleteUser(userId: string, actorId?: string): Promise<void> {
        const db = getDb();

        // Get user before deletion for audit
        const user = await this.getUserById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Soft Delete: Mark as deleted and inactive
        // We append timestamp to email to allow future registration with same email if needed?
        // For now, just mark status which prevents login.
        const now = new Date().toISOString();
        await db.run('UPDATE users SET status = ?, isActive = ?, updatedAt = ? WHERE id = ?', [
            'deleted',
            false,
            now,
            userId
        ]);

        // Also deactivate memberships?
        // membershipService.deactivateAll(userId); // If such method existed.
        // Ideally we should suspend them.

        // Log audit event
        if (actorId) {
            await this.logAuditEvent(actorId, 'DELETE_USER', 'users', userId, {
                deletedUser: user,
                type: 'soft_delete'
            });
        }

        logger.info(`User soft-deleted: ${userId} by ${actorId || 'system'}`);
    }

    async changeUserRole(userId: string, newRole: UserRole, companyId: string, actorId?: string): Promise<void> {
        const db = getDb();

        // Update user role in users table
        await db.run('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);

        // Update membership role
        await membershipService.updateMembershipByUserAndCompany(
            userId,
            companyId,
            { role: newRole },
            actorId || userId
        );

        // Log audit event
        if (actorId) {
            await this.logAuditEvent(actorId, 'CHANGE_USER_ROLE', 'users', userId, {
                newRole,
                companyId
            });
        }

        logger.info(`User role changed: ${userId} to ${newRole} by ${actorId || 'system'}`);
    }

    async changeUserStatus(userId: string, newStatus: string, actorId?: string): Promise<void> {
        const db = getDb();

        await db.run('UPDATE users SET status = ? WHERE id = ?', [newStatus, userId]);

        // Log audit event
        if (actorId) {
            await this.logAuditEvent(actorId, 'CHANGE_USER_STATUS', 'users', userId, {
                newStatus
            });
        }

        logger.info(`User status changed: ${userId} to ${newStatus} by ${actorId || 'system'}`);
    }

    async inviteUser(
        email: string,
        role: UserRole,
        companyId: string,
        inviterId: string,
        name?: string
    ): Promise<string> {
        const db = getDb();
        const now = new Date().toISOString();

        // Check if user already exists
        const existingUser = await this.getUserByEmail(email);
        if (existingUser) {
            if (name && existingUser.name !== name) {
                await db.run('UPDATE users SET name = ?, updatedAt = ? WHERE id = ?', [name, now, existingUser.id]);
            }
            // If user exists, just add membership if not already a member
            const existingMembership = await membershipService.getMembership(existingUser.id, companyId);
            if (existingMembership) {
                throw new AppError('User is already a member of this company', 409);
            }

            await membershipService.addMember(
                {
                    userId: existingUser.id,
                    companyId,
                    role
                },
                inviterId
            );

            logger.info(`Existing user added to company: ${existingUser.id} to ${companyId}`);
            return existingUser.id;
        }

        // Create invited user
        const userId = uuidv4();
        await db.run(
            `INSERT INTO users (id, email, password, name, role, status, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, email, 'INVITED', name || email.split('@')[0], role, 'invited', false, now, now]
        );

        // Add membership
        await membershipService.addMember(
            {
                userId,
                companyId,
                role
            },
            inviterId
        );

        // Send invitation email
        try {
            const company = await db.get('SELECT name FROM companies WHERE id = ?', [companyId]);
            const companyName = company?.name || 'the company';

            // Create a real invitation token
            const invitation = await invitationService.createInvitation(email, companyId, role, inviterId);
            const inviteLink = `${process.env.APP_URL || 'https://cortexbuildpro.com'}/accept-invitation?token=${invitation.token}`;

            await emailService.sendInvitation(email, role, companyName, inviteLink);
        } catch (emailError) {
            logger.error('Failed to send invitation email', emailError);
        }

        // Log audit event
        await this.logAuditEvent(inviterId, 'INVITE_USER', 'users', userId, {
            email,
            role,
            companyId
        });

        logger.info(`User invited: ${email} to ${companyId} by ${inviterId}`);
        return userId;
    }

    async bulkInviteUsers(
        invitations: Array<{ email: string; role: UserRole }>,
        companyId: string,
        inviterId: string
    ): Promise<void> {
        for (const invitation of invitations) {
            try {
                await this.inviteUser(invitation.email, invitation.role, companyId, inviterId);
            } catch (error) {
                logger.error(`Failed to invite user ${invitation.email}:`, error);
                // Continue with other invitations
            }
        }
    }

    async resetUserPassword(userId: string, actorId?: string): Promise<void> {
        const db = getDb();
        const user = await this.getUserById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        // Update user with reset token
        await db.run(
            'UPDATE users SET resetTokenHash = ?, resetExpiresAt = ?, status = "password_reset_pending", updatedAt = ? WHERE id = ?',
            [resetTokenHash, resetExpires, new Date().toISOString(), userId]
        );

        // Send reset email
        await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

        // Log audit event
        await this.logAuditEvent(actorId || 'system', 'PASSWORD_RESET_REQUESTED', 'users', userId, {
            email: user.email
        });

        logger.info(`Password reset requested for ${user.email}`);
    }

    async forgotPassword(email: string) {
        const db = getDb();
        const user = await this.getUserByEmail(email);

        // For security reasons, we don't want to reveal if a user exists or not
        if (!user) {
            logger.info(`Forgot password requested for non-existent email: ${email}`);
            return;
        }

        await this.resetUserPassword(user.id, 'system');
    }

    async confirmPasswordReset(token: string, newPassword: string) {
        const db = getDb();
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const now = new Date().toISOString();

        const user = await db.get('SELECT id, email FROM users WHERE resetTokenHash = ? AND resetExpiresAt > ?', [
            resetTokenHash,
            now
        ]);

        if (!user) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.run(
            'UPDATE users SET password = ?, resetTokenHash = NULL, resetExpiresAt = NULL, status = "active", updatedAt = ? WHERE id = ?',
            [hashedPassword, now, user.id]
        );

        // Log audit event
        await this.logAuditEvent(user.id, 'PASSWORD_RESET_COMPLETED', 'users', user.id, {
            email: user.email
        });

        logger.info(`Password reset completed for ${user.email}`);
    }

    async getUserStats(tenantId?: string) {
        const db = getDb();

        let baseQuery = 'SELECT COUNT(*) as count FROM users';
        const params: any[] = [];

        if (tenantId) {
            baseQuery += ' WHERE companyId = ?';
            params.push(tenantId);
        }

        const totalUsers = await db.get(baseQuery, params);

        // Get breakdown by status
        let statusQuery = 'SELECT status, COUNT(*) as count FROM users';
        if (tenantId) {
            statusQuery += ' WHERE companyId = ?';
        }
        statusQuery += ' GROUP BY status';

        const statusBreakdown = await db.all(statusQuery, tenantId ? [...params] : []);

        // Get breakdown by role
        let roleQuery = 'SELECT role, COUNT(*) as count FROM users';
        if (tenantId) {
            roleQuery += ' WHERE companyId = ?';
        }
        roleQuery += ' GROUP BY role';

        const roleBreakdown = await db.all(roleQuery, tenantId ? [...params] : []);

        return {
            total: totalUsers?.count || 0,
            byStatus: statusBreakdown,
            byRole: roleBreakdown
        };
    }

    private async logAuditEvent(userId: string, action: string, resource: string, resourceId: string, changes: any) {
        const db = getDb();
        const logId = uuidv4();
        const now = new Date().toISOString();

        try {
            await db.run(
                `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    logId,
                    'system',
                    userId,
                    'system',
                    action,
                    resource,
                    resourceId,
                    JSON.stringify(changes),
                    'success',
                    now
                ]
            );
        } catch (error) {
            logger.error('Failed to log audit event', error);
        }
    }

    /**
     * Alias for changeUserRole to match test expectations
     */
    async updateUserRole(userId: string, newRole: UserRole, companyId: string, actorId?: string): Promise<void> {
        return await this.changeUserRole(userId, newRole, companyId, actorId);
    }

    /**
     * Suspend a tenant (company)
     */
    async suspendTenant(tenantId: string, reason?: string, actorId?: string): Promise<void> {
        const db = getDb();

        const tenant = await db.get('SELECT * FROM companies WHERE id = ?', [tenantId]);
        if (!tenant) {
            throw new AppError('Tenant not found', 404);
        }

        await db.run('UPDATE companies SET status = ?, suspended_reason = ?, updatedAt = ? WHERE id = ?', [
            'suspended',
            reason || 'Suspended by administrator',
            new Date().toISOString(),
            tenantId
        ]);

        // Deactivate all users in this tenant
        await db.run('UPDATE users SET isActive = 0 WHERE companyId = ?', [tenantId]);

        // Log audit event
        if (actorId) {
            await this.logAuditEvent(actorId, 'SUSPEND_TENANT', 'companies', tenantId, {
                tenantName: tenant.name,
                reason,
                type: 'tenant_suspension'
            });
        }

        logger.info(`Tenant ${tenantId} suspended by ${actorId || 'system'}`);
    }

    /**
     * Update tenant limits
     */
    async updateTenantLimits(
        tenantId: string,
        limits: { maxUsers?: number; maxProjects?: number; maxStorageMB?: number },
        actorId?: string
    ): Promise<void> {
        const db = getDb();

        // Check if tenant has a plan with limits
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

        if (limits.maxUsers !== undefined) {
            updateFields.push('max_users = ?');
            updateValues.push(limits.maxUsers);
        }

        if (limits.maxProjects !== undefined) {
            updateFields.push('max_projects = ?');
            updateValues.push(limits.maxProjects);
        }

        if (limits.maxStorageMB !== undefined) {
            updateFields.push('max_storage_mb = ?');
            updateValues.push(limits.maxStorageMB);
        }

        if (updateFields.length === 0) {
            throw new AppError('No limits provided to update', 400);
        }

        updateValues.push(new Date().toISOString());
        updateValues.push(tenant.plan_id);

        const sql = `UPDATE tenant_limits SET ${updateFields.join(', ')}, updatedAt = ? WHERE plan_id = ?`;
        await db.run(sql, updateValues);

        // Log audit event
        if (actorId) {
            await this.logAuditEvent(actorId, 'UPDATE_TENANT_LIMITS', 'tenant_limits', tenant.plan_id, {
                tenantId,
                limits,
                type: 'limit_update'
            });
        }

        logger.info(`Tenant limits updated for ${tenantId} by ${actorId || 'system'}`);
    }
}

export const userManagementService = new UserManagementService();
