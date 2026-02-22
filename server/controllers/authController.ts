import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { permissionService } from '../services/permissionService.js';
import { membershipService } from '../services/membershipService.js';
import { TenantService } from '../services/tenantService.js';
import { normalizeRole, UserRole } from '../types/rbac.js';
import { emailService } from '../services/emailService.js';
import { authService } from '../services/authService.js';
import { SessionService } from '../services/sessionService.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new AppError('Email and password required', 400);

        const session = await authService.login({ email, password });

        // Create session with IP tracking
        const ipAddress = req.ip || req.header('x-forwarded-for') || req.socket.remoteAddress;
        const userAgent = req.header('user-agent');
        await SessionService.createOrUpdateSession(session.id, ipAddress, userAgent);

        res.json(session);
    } catch (e) {
        next(e);
    }
};

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Return the static role metadata based on the enum
        const roles = [
            {
                id: UserRole.SUPERADMIN,
                name: 'Superadmin',
                description: 'Full platform access, manages all companies',
                level: 6
            },
            {
                id: UserRole.COMPANY_ADMIN,
                name: 'Company Admin',
                description: 'Full access within their company',
                level: 5
            },
            {
                id: UserRole.PROJECT_MANAGER,
                name: 'Project Manager',
                description: 'Manages projects, tasks, and team assignments',
                level: 4
            },
            { id: UserRole.FINANCE, name: 'Finance', description: 'Access to financial data and reports', level: 3 },
            {
                id: UserRole.SUPERVISOR,
                name: 'Supervisor',
                description: 'Oversees field operations and teams',
                level: 2
            },
            { id: UserRole.OPERATIVE, name: 'Operative', description: 'Field workers, can update tasks', level: 1 },
            { id: UserRole.READ_ONLY, name: 'Read Only', description: 'View-only access', level: 0 }
        ];
        res.json(roles);
    } catch (e) {
        next(e);
    }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { name, description, permissions } = req.body;

        if (!name) throw new AppError('Role name is required', 400);

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO roles (id, name, description, permissions, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, name, description, JSON.stringify(permissions || []), now, now]
        );

        // Audit Log (Simplified inline)
        const logId = uuidv4();
        await db
            .run(
                `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, createdAt, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    logId,
                    (req as any).tenantId || 'system',
                    (req as any).userId,
                    (req as any).userName,
                    'CREATE',
                    'roles',
                    id,
                    JSON.stringify({ name, permissions }),
                    'success',
                    now,
                    req.ip,
                    req.headers['user-agent']
                ]
            )
            .catch((err) => logger.error('Audit log failed', err));

        res.json({ id, name, description, permissions, createdAt: now, updatedAt: now });
    } catch (e) {
        next(e);
    }
};

export const assignUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, companyId, role } = req.body;

        if (!userId || !companyId || !role) {
            throw new AppError('userId, companyId, and role are required', 400);
        }

        const membership = await membershipService.getMembership(userId, companyId);
        if (!membership) {
            throw new AppError('User membership not found for this company', 404);
        }

        const actorId = (req as any).userId || 'system';
        const updated = await membershipService.updateMembership(membership.id, { role: role as UserRole }, actorId);

        // Audit Log (Simplified inline)
        const db = getDb();
        const now = new Date().toISOString();
        const logId = uuidv4();
        await db
            .run(
                `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, createdAt, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    logId,
                    companyId,
                    (req as any).userId,
                    (req as any).userName,
                    'UPDATE_ROLE',
                    'memberships',
                    membership.id,
                    JSON.stringify({ oldRole: membership.role, newRole: role }),
                    'success',
                    now,
                    req.ip,
                    req.headers['user-agent']
                ]
            )
            .catch((err) => logger.error('Audit log failed', err));

        res.json(updated);
    } catch (e) {
        next(e);
    }
};

export const getUserRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, companyId } = req.params;

        if (!userId || !companyId) throw new AppError('userId and companyId are required', 400);

        const permissions = await permissionService.getUserPermissions(userId, companyId);

        // Return a simplified structure for now as we don't have multiple roles per user per company in this schema
        // The membership table currently has one role field
        const db = getDb();
        const membership = await db.get('SELECT role FROM memberships WHERE userId = ? AND companyId = ?', [
            userId,
            companyId
        ]);

        res.json([
            {
                userId,
                companyId,
                roleId: membership?.role || UserRole.READ_ONLY,
                permissions
            }
        ]);
    } catch (e) {
        next(e);
    }
};

export const getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await permissionService.getPermissions();
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

export const getRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = req.params.role as UserRole;
        if (!role) throw new AppError('Role is required', 400);
        const permissions = await permissionService.getRolePermissions(role);
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

export const getCurrentUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, tenantId } = (req as any).context || {};
        const authUser = (req as any).user;

        if (!userId) throw new AppError('Authentication required', 401);

        // Superadmin Bypass
        if (!tenantId) {
            const globalRole = await permissionService.getUserGlobalRole(userId);
            if (globalRole === 'SUPERADMIN' || authUser?.user_metadata?.role === 'super_admin') {
                return res.json(['*']);
            }
            throw new AppError('Company selection required', 400);
        }

        const permissions = await permissionService.getUserPermissions(userId, tenantId);
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

export const getCurrentUserContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const context = (req as any).context;

        if (!context || !context.userId) {
            throw new AppError('Authentication required', 401);
        }

        if (!context.tenantId) {
            throw new AppError('Tenant context required', 400);
        }

        // Fetch additional aggregate data
        const [usage, tenant] = await Promise.all([
            TenantService.getTenantUsage(context.tenantId),
            TenantService.getTenantById(context.tenantId)
        ]);

        // Parse JSON fields safely
        try {
            if (tenant.settings && typeof tenant.settings === 'string') tenant.settings = JSON.parse(tenant.settings);
            if (tenant.subscription && typeof tenant.subscription === 'string')
                tenant.subscription = JSON.parse(tenant.subscription);
            if (tenant.features && typeof tenant.features === 'string') tenant.features = JSON.parse(tenant.features);
        } catch (e) {
            logger.error('Failed to parse tenant JSON fields in context', { tenantId: context.tenantId, error: e });
        }

        res.json({
            ...context,
            usage,
            tenant: {
                ...tenant,
                settings: tenant.settings || {},
                subscription: tenant.subscription || { status: 'active', plan: 'free' },
                features: tenant.features || []
            }
        });
    } catch (e) {
        next(e);
    }
};

export const inviteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, role, companyId } = req.body;
        const inviterId = (req as any).userId;

        if (!email || !role || !companyId) {
            throw new AppError('Email, role, and companyId are required', 400);
        }

        const db = getDb();

        const membership = await membershipService.getMembership(inviterId, companyId);
        if (!membership || membership.status !== 'active') {
            throw new AppError('You do not have permission to invite users to this company', 403);
        }

        if (normalizeRole(membership.role) !== UserRole.COMPANY_ADMIN) {
            throw new AppError('Only Company Admins can invite users', 403);
        }
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            // If user exists, just add membership
            const existingMember = await membershipService.getMembership(existingUser.id, companyId);
            if (existingMember) {
                throw new AppError('User is already a member of this company', 409);
            }
            // Add membership
            await membershipService.addMember({ userId: existingUser.id, companyId, role }, inviterId);
            res.status(200).json({ message: 'User added to company', userId: existingUser.id });
            return; // stop execution
        }

        // 2. If user does NOT exist, create specific "Invite" record or Placeholder User
        const newUserId = uuidv4();
        const now = new Date().toISOString();

        await db.run(`INSERT INTO users (id, email, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`, [
            newUserId,
            email,
            email.split('@')[0],
            'invited',
            now,
            now
        ]);

        await membershipService.addMember({ userId: newUserId, companyId, role }, inviterId);

        // 3. Log Audit
        const logId = uuidv4();
        await db
            .run(
                `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, createdAt, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    logId,
                    companyId,
                    inviterId,
                    'Inviter',
                    'INVITE_USER',
                    'users',
                    newUserId,
                    JSON.stringify({ email, role }),
                    'success',
                    now,
                    req.ip,
                    req.headers['user-agent']
                ]
            )
            .catch((err) => logger.error('Audit log failed', err));

        // 4. Send Email
        const company = await db.get('SELECT name FROM companies WHERE id = ?', [companyId]);
        const companyName = company?.name || 'the company';
        const inviteLink = `${process.env.APP_URL || 'https://cortexbuildpro.com'}/accept-invite?userId=${newUserId}&companyId=${companyId}`;

        try {
            await emailService.sendInvitation(email, role, companyName, inviteLink);
        } catch (emailError) {
            logger.error('Failed to send invitation email', emailError);
            // Verify if we should rollback or just warn. For now, we warn.
        }

        res.status(201).json({ message: 'Invitation sent', userId: newUserId });
    } catch (e) {
        next(e);
    }
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, companyName } = req.body;

        // Check if registrations are allowed globally
        const db = getDb();
        const setting = await db.get('SELECT value FROM system_settings WHERE `key` = ?', ['allow_registrations']);
        if (setting && setting.value === 'false') {
            throw new AppError('Public registrations are currently disabled by the administrator.', 403);
        }

        if (!email || !password || !companyName) {
            throw new AppError('email, password, and companyName are required', 400);
        }

        const session = await authService.register({
            email,
            password,
            name,
            companyName,
            role: UserRole.COMPANY_ADMIN
        });

        res.status(201).json(session);
    } catch (e) {
        next(e);
    }
};
