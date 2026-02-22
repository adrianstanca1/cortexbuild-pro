import { getDb } from "../database.js";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { UserRole } from '../types/rbac.js';
import { membershipService } from './membershipService.js';
import { emailService } from './emailService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { impersonationService } from './impersonationService.js';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  companyName?: string;
  role?: UserRole;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
  permissions: string[];
  token: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  async login(credentials: LoginCredentials): Promise<UserSession> {
    const db = getDb();
    const { email, password } = credentials;

    // Find user by email
    const user = await db.get(
      `SELECT u.id, u.email, u.name, u.password, u.role, u.companyId, u.status, u.isActive, u.createdAt, u.updatedAt, u.two_factor_enabled
       FROM users u
       WHERE u.email = ?`,
      [email]
    );

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is suspended', 403);
    }

    if (user.status === 'suspended') {
      throw new AppError('Account is suspended', 403);
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Platform Level Checks
    const maintenance = await db.get('SELECT value FROM system_settings WHERE `key` = ?', ['maintenance_mode']);
    if (maintenance?.value === 'true' && user.role !== UserRole.SUPERADMIN) {
      throw new AppError('System is currently under maintenance. Please try again later.', 503);
    }

    const enforce2fa = await db.get('SELECT value FROM system_settings WHERE `key` = ?', ['enforce_2fa']);
    if (enforce2fa?.value === 'true' && !user.two_factor_enabled && user.role !== UserRole.SUPERADMIN) {
      // In a full implementation, we would redirect to 2FA setup
      // For now, we'll throw a specific error that the frontend can catch
      throw new AppError('MFA Enforcement is active. Please contact support to enable 2FA on your account.', 403);
    }

    // Get user permissions
    const permissions = await this.getUserPermissions(user.id, user.companyId);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    // Update last login
    await db.run('UPDATE users SET updatedAt = ? WHERE id = ?', [new Date().toISOString(), user.id]);

    logger.info(`User logged in: ${user.id}`);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      permissions,
      token
    };
  }

  async register(registrationData: RegistrationData): Promise<UserSession> {
    const db = getDb();
    const { email, password, name, companyName, role = UserRole.OPERATIVE } = registrationData;
    const now = new Date().toISOString();

    return await db.transaction(async (tx) => {
      // Check if user already exists
      const existingUser = await tx.get('SELECT id FROM users WHERE email = ?', [email]);
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const userId = uuidv4();
      await tx.run(
        `INSERT INTO users (id, email, name, password, role, status, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, name, hashedPassword, role, 'active', true, now, now]
      );

      let companyId: string | undefined;

      // If company name provided, create company with trial plan
      if (companyName) {
        companyId = `comp_${uuidv4().slice(0, 8)}`;

        // Calculate trial dates
        const trialStart = new Date();
        const trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

        // 5GB quota in bytes
        const storageQuota = 5 * 1024 * 1024 * 1024;

        // Create company with trial plan and storage quotas
        await tx.run(
          `INSERT INTO companies (
            id, name, status, plan, maxUsers,
            trialStartedAt, trialEndsAt,
            storageQuotaBytes, storageUsedBytes,
            databaseQuotaBytes, databaseUsedBytes,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            companyId,
            companyName,
            'trial',       // Status: trial
            'trial',       // Plan: trial
            10,            // Max 10 users for trial
            trialStart.toISOString(),
            trialEnd.toISOString(),
            storageQuota,  // 5GB storage quota
            0,             // 0 used initially
            storageQuota,  // 5GB database quota
            0,             // 0 used initially
            now,
            now
          ]
        );

        // Add user to company as admin
        await membershipService.addMemberWithDb(tx, {
          userId,
          companyId,
          role: UserRole.COMPANY_ADMIN
        }, userId);

        await tx.run(
          `UPDATE users SET companyId = ?, updatedAt = ? WHERE id = ?`,
          [companyId, now, userId]
        );

        logger.info(`Trial company created: ${companyId} (${companyName}) - Trial ends: ${trialEnd.toISOString()}`);

        // Send trial welcome email (outside transaction logic or as a post-commit if supported, 
        // but here we just keep it inside for simplicity as it was)
        try {
          await emailService.sendTrialWelcomeEmail({
            email,
            name,
            companyName,
            trialEndsAt: trialEnd.toISOString()
          });
          logger.info(`Trial welcome email sent to: ${email}`);
        } catch (error) {
          logger.error('Failed to send trial welcome email', error);
          // Don't fail registration if email fails
        }
      }

      // Get user permissions (Note: this might need adjustment if it doesn't support the tx object)
      const permissions = await this.getUserPermissions(userId, companyId);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId,
          email,
          role,
          companyId
        },
        process.env.JWT_SECRET || 'fallback_secret_for_dev',
        { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
      );

      logger.info(`User registered: ${userId}`);

      return {
        id: userId,
        email,
        name,
        role,
        companyId,
        permissions,
        token
      };
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();

    // Find user
    const user = await db.get('SELECT id, email, name FROM users WHERE email = ?', [email]);
    if (!user) {
      // Don't reveal if email exists to prevent enumeration
      return;
    }

    // Create password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24 hours

    // Store reset token
    await db.run(
      `INSERT INTO password_reset_tokens (id, userId, token, expiresAt, used, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), user.id, resetToken, resetTokenExpiry, 0, now, now]
    );

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (error) {
      logger.error('Failed to send password reset email', error);
      // Don't throw error as the token was still created
    }

    logger.info(`Password reset requested for user: ${user.id}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();

    // Find valid reset token
    const resetRecord = await db.get(
      `SELECT userId FROM password_reset_tokens
       WHERE token = ? AND expiresAt > ? AND used = 0`,
      [token, now]
    );

    if (!resetRecord) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db.run(
      `UPDATE users SET password = ?, updatedAt = ? WHERE id = ?`,
      [hashedPassword, now, resetRecord.userId]
    );

    // Mark reset token as used
    await db.run(
      `UPDATE password_reset_tokens SET used = 1, updatedAt = ? WHERE token = ?`,
      [now, token]
    );

    logger.info(`Password reset completed for user: ${resetRecord.userId}`);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const db = getDb();

    // Get current password hash
    const user = await db.get('SELECT password FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidOldPassword) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.run('UPDATE users SET password = ?, updatedAt = ? WHERE id = ?', [hashedNewPassword, new Date().toISOString(), userId]);

    logger.info(`Password changed for user: ${userId}`);
  }

  async logout(userId: string): Promise<void> {
    // In a real implementation, you might want to add tokens to a blacklist
    // For now, we'll just log the logout event
    logger.info(`User logged out: ${userId}`);
  }

  async refreshToken(userId: string): Promise<{ token: string }> {
    const db = getDb();

    // Get user info to generate new token
    const user = await db.get(
      'SELECT id, email, role, companyId FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new JWT token
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    logger.info(`Token refreshed for user: ${userId}`);

    return { token: newToken };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  async impersonateUser(adminUserId: string, targetUserId: string, reason?: string): Promise<UserSession> {
    const db = getDb();

    // 1. Verify admin permissions
    const admin = await db.get('SELECT role, companyId FROM users WHERE id = ?', [adminUserId]);
    if (!admin || admin.role !== UserRole.SUPERADMIN) {
      throw new AppError('Unauthorized: Only SuperAdmins can impersonate users', 403);
    }

    // 2. Get target user details
    const targetUser = await db.get(
      `SELECT u.id, u.email, u.name, u.role, u.companyId, u.status, u.isActive
       FROM users u
       WHERE u.id = ?`,
      [targetUserId]
    );

    if (!targetUser) {
      throw new AppError('Target user not found', 404);
    }

    // 3. Generate session as target user
    const permissions = await this.getUserPermissions(targetUser.id, targetUser.companyId);

    // Create special impersonation token
    const token = `imp_v1:${targetUserId}:${Date.now()}:` + crypto.randomBytes(16).toString('hex');

    // In a real scenario, we might want to sign a JWT, but for simplicity 
    // and matching the existing middleware expectation for imp_v1:
    // Let's stick to the middleware's logic if possible, or update it.
    // The middleware expects prefix:userId:timestamp:signature

    const secret = process.env.FILE_SIGNING_SECRET || process.env.JWT_SECRET || 'dev_secret';
    const timestamp = Date.now().toString();
    const payload = `imp_v1:${targetUserId}:${timestamp}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const fullToken = `${payload}:${signature}`;

    // 4. Persist Session via ImpersonationService
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await impersonationService.createSession(db, {
      adminId: adminUserId,
      targetUserId,
      companyId: targetUser.companyId || 'c1',
      token: fullToken,
      reason: reason || 'Support Session',
      expiresAt
    });

    logger.warn(`User ${targetUserId} IMPERSONATED by Admin ${adminUserId}. Reason: ${reason}`);

    return {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      companyId: targetUser.companyId,
      permissions,
      token: fullToken
    };
  }

  private async getUserPermissions(userId: string, companyId?: string): Promise<string[]> {
    if (!companyId) {
      return [];
    }

    // Get user's role in the company
    const membership = await membershipService.getMembership(userId, companyId);
    if (!membership) {
      return [];
    }

    // In a real implementation, you would fetch permissions based on the role
    // For now, return a basic set of permissions based on role
    const rolePermissions: Record<string, string[]> = {
      [UserRole.SUPERADMIN]: ['*'],
      [UserRole.COMPANY_ADMIN]: ['user:manage', 'project:manage', 'finance:read', 'reports:read'],
      [UserRole.PROJECT_MANAGER]: ['project:manage', 'task:manage', 'team:read'],
      [UserRole.FINANCE]: ['finance:read', 'reports:read', 'budget:manage'],
      [UserRole.SUPERVISOR]: ['safety:read', 'schedule:read', 'task:update'],
      [UserRole.OPERATIVE]: ['task:read', 'timesheet:submit'],
      [UserRole.READ_ONLY]: ['read:*']
    };

    return rolePermissions[membership.role] || [];
  }

  async getUserProfile(userId: string): Promise<any> {
    const db = getDb();

    const user = await db.get(
      `SELECT u.id, u.email, u.name, u.role, u.companyId, u.status, u.isActive, u.createdAt, u.updatedAt
       FROM users u
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user permissions
    const permissions = await this.getUserPermissions(userId, user.companyId);

    return {
      ...user,
      permissions
    };
  }

  async updateProfile(userId: string, profileData: Partial<{ name: string; email: string }>): Promise<any> {
    const db = getDb();
    const updates: string[] = [];
    const params: any[] = [];

    if (profileData.name) {
      updates.push('name = ?');
      params.push(profileData.name);
    }

    if (profileData.email) {
      // Check if email is already taken by another user
      const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [profileData.email, userId]);
      if (existingUser) {
        throw new AppError('Email is already in use by another user', 409);
      }
      updates.push('email = ?');
      params.push(profileData.email);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(userId);

    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    logger.info(`Profile updated for user: ${userId}`);

    return await this.getUserProfile(userId);
  }
}

export const authService = new AuthService();
