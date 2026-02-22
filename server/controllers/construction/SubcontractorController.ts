import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AuthenticatedRequest } from '../../types/express.js';
import { getDb } from '../../database.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

export const getInsurance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { subcontractorId } = req.query;
        if (!subcontractorId) {
            return res.json([]);
        }

        const db = getDb();
        const insurance = await db.all('SELECT * FROM subcontractor_insurance WHERE subcontractorId = ?', [subcontractorId]);
        res.json(insurance);
    } catch (error) {
        logger.error('Failed to fetch insurance:', error);
        next(new AppError('Failed to fetch insurance', 500));
    }
};

export const addInsurance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { subcontractorId, policyType, carrier, policyNumber, coverageAmount, effectiveDate, expiryDate, certificateUrl } = req.body;
        const id = randomUUID();
        const now = new Date().toISOString();
        const db = getDb();

        await db.run(
            `INSERT INTO subcontractor_insurance (id, subcontractorId, policyType, carrier, policyNumber, coverageAmount, effectiveDate, expiryDate, certificateUrl, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, subcontractorId, policyType, carrier, policyNumber, coverageAmount, effectiveDate, expiryDate, certificateUrl, now]
        );

        const record = await db.get('SELECT * FROM subcontractor_insurance WHERE id = ?', [id]);
        res.status(201).json(record);
    } catch (error) {
        logger.error('Failed to add insurance:', error);
        next(new AppError('Failed to add insurance', 500));
    }
};

export const getPaymentApplications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { companyId } = req.user!;

        let query = 'SELECT * FROM payment_applications WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY submittedDate DESC';

        const db = getDb();
        const apps = await db.all(query, params);
        res.json(apps);
    } catch (error) {
        logger.error('Failed to fetch payment applications:', error);
        next(new AppError('Failed to fetch payment applications', 500));
    }
};

export const submitPaymentApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.user!;
        const { projectId, subcontractorId, applicationNumber, period, amountRequested, previouslyApproved, retainagePercent } = req.body;
        const id = randomUUID();
        const now = new Date().toISOString();
        const db = getDb();

        const retainageAmount = amountRequested * (retainagePercent / 100);
        const netPayment = amountRequested - retainageAmount;

        await db.run(
            `INSERT INTO payment_applications (id, companyId, projectId, subcontractorId, applicationNumber, period, amountRequested, previouslyApproved, retainagePercent, retainageAmount, netPayment, submittedDate, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)`,
            [id, companyId, projectId, subcontractorId, applicationNumber, period, amountRequested, previouslyApproved, retainagePercent, retainageAmount, netPayment, now, now, now]
        );

        const app = await db.get('SELECT * FROM payment_applications WHERE id = ?', [id]);
        res.status(201).json(app);
    } catch (error) {
        logger.error('Failed to submit payment application:', error);
        next(new AppError('Failed to submit payment application', 500));
    }
};

export const updatePaymentApplication = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = getDb();

        const setClauses: string[] = [];
        const values: any[] = [];

        Object.entries(updates).forEach(([key, value]) => {
            setClauses.push(`${key} = ?`);
            values.push(value);
        });

        setClauses.push("updatedAt = datetime('now')");
        values.push(id);

        await db.run(
            `UPDATE payment_applications SET ${setClauses.join(', ')} WHERE id = ?`,
            values
        );

        const application = await db.get('SELECT * FROM payment_applications WHERE id = ?', [id]);
        res.json(application);
    } catch (error) {
        logger.error('Failed to update payment application:', error);
        next(new AppError('Failed to update payment application', 500));
    }
};
