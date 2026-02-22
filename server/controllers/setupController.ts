import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { UserRole } from '../types/rbac.js';

export const setupSuperadmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name, setupKey } = req.body;

        if (!email || !password) {
            throw new AppError('Email and password are required', 400);
        }

        const requiredKey = process.env.SETUP_SECRET;
        if (requiredKey && setupKey !== requiredKey) {
            throw new AppError('Invalid setup key', 403);
        }

        const db = getDb();
        const existingSuperadmin = await db.get(
            `SELECT userId FROM memberships WHERE role = ? LIMIT 1`,
            [UserRole.SUPERADMIN]
        );

        if (existingSuperadmin) {
            throw new AppError('Superadmin already exists', 409);
        }

        const now = new Date().toISOString();
        const platformCompanyId = 'platform-admin';
        const displayName = name || email.split('@')[0];

        const company = await db.get('SELECT id FROM companies WHERE id = ?', [platformCompanyId]);
        if (!company) {
            await db.run(
                `INSERT INTO companies (id, name, status, plan, maxUsers, maxProjects, createdAt, updatedAt, settings, subscription)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [platformCompanyId, 'Platform Administration', 'ACTIVE', 'ENTERPRISE', 999, 999, now, now, '{}', JSON.stringify({ status: 'active', plan: 'enterprise' })]
            );
        }

        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        const userId = existingUser?.id || uuidv4();
        const hashedPassword = await bcrypt.hash(password, 12);

        if (existingUser) {
            await db.run(
                `UPDATE users SET name = ?, password = ?, role = ?, status = 'active', companyId = ?, updatedAt = ? WHERE id = ?`,
                [displayName, hashedPassword, UserRole.SUPERADMIN, platformCompanyId, now, userId]
            );
        } else {
            await db.run(
                `INSERT INTO users (id, email, password, name, role, status, companyId, isActive, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, email, hashedPassword, displayName, UserRole.SUPERADMIN, 'active', platformCompanyId, true, now, now]
            );
        }

        await db.run(
            `INSERT INTO memberships (id, userId, companyId, role, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), userId, platformCompanyId, UserRole.SUPERADMIN, 'active', now, now]
        );

        const token = jwt.sign(
            { userId, email, role: UserRole.SUPERADMIN, companyId: platformCompanyId },
            process.env.JWT_SECRET || 'fallback_secret_for_dev',
            { expiresIn: '24h' }
        );

        logger.info('Superadmin setup complete', { userId, email });

        res.json({
            success: true,
            message: 'Superadmin setup complete',
            user: { id: userId, email, role: UserRole.SUPERADMIN },
            token
        });
    } catch (error) {
        next(error);
    }
};
