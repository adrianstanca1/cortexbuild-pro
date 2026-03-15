import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { TRIAL_CONFIG, formatBytes, calculateDaysRemaining } from '../config/trial.js';
import { emailService } from './emailService.js';

export interface TrialStatus {
    isActive: boolean;
    isExpired: boolean;
    daysRemaining: number;
    startsAt: string;
    endsAt: string;
    plan: string;
}

export interface StorageQuota {
    used: number;
    quota: number;
    percentage: number;
    available: number;
    formattedUsed: string;
    formattedQuota: string;
    formattedAvailable: string;
}

export interface QuotaCheckResult {
    allowed: boolean;
    used: number;
    quota: number;
    available: number;
    message?: string;
}

export class TrialService {
    /**
     * Check if company trial is active
     */
    async isTrialActive(companyId: string): Promise<boolean> {
        const db = getDb();
        const company = await db.get(
            'SELECT status, trialEndsAt FROM companies WHERE id = ?',
            [companyId]
        );

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        if (company.status !== 'trial') {
            return false;
        }

        const now = new Date();
        const endDate = new Date(company.trialEndsAt);

        return now < endDate;
    }

    /**
     * Get trial status and days remaining
     */
    async getTrialStatus(companyId: string): Promise<TrialStatus> {
        const db = getDb();
        const company = await db.get(
            'SELECT plan, status, trialStartedAt, trialEndsAt FROM companies WHERE id = ?',
            [companyId]
        );

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        const now = new Date();
        const endDate = company.trialEndsAt ? new Date(company.trialEndsAt) : null;
        const isExpired = endDate ? now >= endDate : false;
        const isActive = company.status === 'trial' && !isExpired;
        const daysRemaining = endDate ? calculateDaysRemaining(company.trialEndsAt) : 0;

        return {
            isActive,
            isExpired,
            daysRemaining: Math.max(0, daysRemaining),
            startsAt: company.trialStartedAt || '',
            endsAt: company.trialEndsAt || '',
            plan: company.plan || 'trial',
        };
    }

    /**
     * Get storage quota information
     */
    async getStorageQuota(companyId: string): Promise<StorageQuota> {
        const db = getDb();
        const company = await db.get(
            'SELECT storageUsedBytes, storageQuotaBytes FROM companies WHERE id = ?',
            [companyId]
        );

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        const used = company.storageUsedBytes || 0;
        const quota = company.storageQuotaBytes || TRIAL_CONFIG.STORAGE_QUOTA_BYTES;
        const available = Math.max(0, quota - used);
        const percentage = quota > 0 ? (used / quota) * 100 : 0;

        return {
            used,
            quota,
            percentage,
            available,
            formattedUsed: formatBytes(used),
            formattedQuota: formatBytes(quota),
            formattedAvailable: formatBytes(available),
        };
    }

    /**
     * Check if additional storage can be used
     */
    async checkStorageQuota(
        companyId: string,
        additionalBytes: number
    ): Promise<QuotaCheckResult> {
        const quota = await this.getStorageQuota(companyId);
        const afterAddition = quota.used + additionalBytes;
        const allowed = afterAddition <= quota.quota;

        return {
            allowed,
            used: quota.used,
            quota: quota.quota,
            available: quota.available,
            message: allowed
                ? undefined
                : `Storage limit would be exceeded. Available: ${formatBytes(quota.available)}, Requested: ${formatBytes(additionalBytes)}`,
        };
    }

    /**
     * Track storage usage (add or remove)
     */
    async trackStorageUsage(
        companyId: string,
        fileSize: number,
        operation: 'add' | 'remove'
    ): Promise<void> {
        const db = getDb();
        const delta = operation === 'add' ? fileSize : -fileSize;

        await db.run(
            `UPDATE companies 
       SET storageUsedBytes = COALESCE(storageUsedBytes, 0) + ?,
           updatedAt = datetime('now')
       WHERE id = ?`,
            [delta, companyId]
        );

        logger.info(`Storage ${operation}: ${formatBytes(fileSize)} for company ${companyId}`);

        // Check if approaching limit
        const quota = await this.getStorageQuota(companyId);
        if (quota.percentage >= 90) {
            logger.warn(`Company ${companyId} storage at ${quota.percentage.toFixed(1)}%`);
            // Could trigger notification here
        }
    }

    /**
     * Expire trial for a company
     */
    async expireTrial(companyId: string): Promise<void> {
        const db = getDb();
        const now = new Date().toISOString();

        await db.run(
            `UPDATE companies 
       SET status = 'expired',
           updatedAt = ?
       WHERE id = ? AND status = 'trial'`,
            [now, companyId]
        );

        logger.info(`Trial expired for company ${companyId}`);

        // Send expiration email
        const company = await db.get(
            'SELECT name FROM companies WHERE id = ?',
            [companyId]
        );

        const owner = await db.get(
            `SELECT u.email, u.name 
       FROM users u
       JOIN memberships m ON u.id = m.userId
       WHERE m.companyId = ? AND m.role = 'COMPANY_ADMIN'
       LIMIT 1`,
            [companyId]
        );

        if (owner && company) {
            await emailService.sendTrialExpiredEmail({
                email: owner.email,
                name: owner.name,
                companyName: company.name,
            });
        }
    }

    /**
     * Upgrade from trial to paid plan
     */
    async upgradeToPaid(
        companyId: string,
        plan: 'pro' | 'enterprise',
        updatedBy: string
    ): Promise<void> {
        const db = getDb();
        const now = new Date().toISOString();

        // Get new quotas based on plan
        const quotas = plan === 'pro'
            ? { storage: 100 * 1024 * 1024 * 1024, database: 50 * 1024 * 1024 * 1024 }
            : { storage: 1024 * 1024 * 1024 * 1024, database: 500 * 1024 * 1024 * 1024 };

        await db.run(
            `UPDATE companies 
       SET plan = ?,
           status = 'active',
           storageQuotaBytes = ?,
           databaseQuotaBytes = ?,
           updatedAt = ?
       WHERE id = ?`,
            [plan, quotas.storage, quotas.database, now, companyId]
        );

        logger.info(`Company ${companyId} upgraded to ${plan} by ${updatedBy}`);

        // Send upgrade confirmation email
        const company = await db.get('SELECT name FROM companies WHERE id = ?', [companyId]);
        const owner = await db.get(
            `SELECT u.email, u.name 
       FROM users u
       JOIN memberships m ON u.id = m.userId
       WHERE m.companyId = ? AND m.role = 'COMPANY_ADMIN'
       LIMIT 1`,
            [companyId]
        );

        if (owner && company) {
            await emailService.sendUpgradeConfirmationEmail({
                email: owner.email,
                name: owner.name,
                companyName: company.name,
                plan,
            });
        }
    }

    /**
     * Send trial expiration warnings
     */
    async sendExpirationWarnings(): Promise<void> {
        const db = getDb();
        const now = new Date();

        for (const days of TRIAL_CONFIG.WARNING_DAYS) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + days);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            // Find trials expiring in 'days' days
            const companies = await db.all(
                `SELECT c.id, c.name, c.trialEndsAt, u.email, u.name as userName
         FROM companies c
         JOIN memberships m ON c.id = m.companyId
         JOIN users u ON m.userId = u.id
         WHERE c.status = 'trial'
           AND date(c.trialEndsAt) = ?
           AND m.role = 'COMPANY_ADMIN'`,
                [targetDateStr]
            );

            for (const company of companies) {
                await emailService.sendTrialExpiringEmail({
                    email: company.email,
                    name: company.userName,
                    companyName: company.name,
                    daysRemaining: days,
                    expiresAt: company.trialEndsAt,
                });

                logger.info(`Sent ${days}-day warning to ${company.email} for company ${company.id}`);
            }
        }
    }

    /**
     * Find and expire trials that have ended
     */
    async expireEndedTrials(): Promise<void> {
        const db = getDb();
        const now = new Date().toISOString();

        const expiredCompanies = await db.all(
            `SELECT id, name FROM companies 
       WHERE status = 'trial' 
         AND trialEndsAt < ?`,
            [now]
        );

        for (const company of expiredCompanies) {
            await this.expireTrial(company.id);
        }

        if (expiredCompanies.length > 0) {
            logger.info(`Expired ${expiredCompanies.length} trial(s)`);
        }
    }
}

export const trialService = new TrialService();
