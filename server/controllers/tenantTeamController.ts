
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/express.js';
import { userManagementService } from '../services/userManagementService.js';

export const inviteMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const db = getDb(); // Platform DB for 'users'
        const tenantDb = req.tenantDb; // Tenant DB for 'team'

        if (!tenantDb) {
            throw new AppError('Tenant database connection not found', 500);
        }

        const { email, name, role, projectId } = req.body;
        const tenantId = req.tenantId;

        if (!email || !name || !role) {
            throw new AppError('Email, name, and role are required', 400);
        }

        // Check if user already exists in this company (Check Tenant Team first)
        const existing = await tenantDb.get(
            `SELECT id FROM team WHERE email = ? AND companyId = ?`,
            [email, tenantId]
        );

        if (existing) {
            throw new AppError('User already exists in this company', 409);
        }

        const inviterId = req.userId || req.context?.userId || 'system';
        const userId = await userManagementService.inviteUser(email, role, tenantId, inviterId, name);

        await tenantDb.run(
            `INSERT INTO team (id, companyId, name, email, role, status, projectId, initials, color, joinDate)
             VALUES (?, ?, ?, ?, ?, 'Invited', ?, ?, ?, ?)`,
            [
                userId, // Use the real Auth ID
                tenantId,
                name,
                email,
                role,
                projectId || null,
                name.substring(0, 2).toUpperCase(),
                'bg-gray-500',
                new Date().toISOString().split('T')[0]
            ]
        );

        // Ensure user has updated display name
        await db.run(`UPDATE users SET name = ?, updatedAt = ? WHERE id = ?`, [name, new Date().toISOString(), userId]);

        logger.info(`Invited member ${email} to company ${tenantId}`);

        res.status(201).json({ success: true, id: userId, message: 'Member invited successfully' });
    } catch (e) {
        next(e);
    }
};

export const updateMemberRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const db = getDb(); // Platform DB
        const tenantDb = req.tenantDb; // Tenant DB

        if (!tenantDb) {
            throw new AppError('Tenant database connection not found', 500);
        }

        const { id } = req.params;
        const { role } = req.body;
        const tenantId = req.tenantId;

        // Verify member belongs to tenant (in team table)
        const member = await tenantDb.get(`SELECT id FROM team WHERE id = ? AND companyId = ?`, [id, tenantId]);
        if (!member) {
            throw new AppError('Member not found', 404);
        }

        await tenantDb.run(
            `UPDATE team SET role = ? WHERE id = ?`,
            [role, id]
        );

        // Sync with users table (Platform)
        await db.run(
            `UPDATE users SET role = ? WHERE id = ?`,
            [role, id]
        );

        res.json({ success: true, id, role });
    } catch (e) {
        next(e);
    }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const db = getDb(); // Platform DB
        const tenantDb = req.tenantDb; // Tenant DB

        if (!tenantDb) {
            throw new AppError('Tenant database connection not found', 500);
        }

        const { id } = req.params;
        const tenantId = req.tenantId;

        // Verify member belongs to tenant
        const member = await tenantDb.get(`SELECT id FROM team WHERE id = ? AND companyId = ?`, [id, tenantId]);
        if (!member) {
            throw new AppError('Member not found', 404);
        }

        await tenantDb.run(`DELETE FROM team WHERE id = ?`, [id]);
        await db.run(`DELETE FROM users WHERE id = ?`, [id]); // Also remove login access

        logger.info(`Removed member ${id} from company ${tenantId}`);

        res.json({ success: true, id });
    } catch (e) {
        next(e);
    }
};
