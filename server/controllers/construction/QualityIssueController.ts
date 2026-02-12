import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AuthenticatedRequest } from '../../types/express.js';
import { getDb } from '../../database.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

export const getQualityIssues = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId, inspectionId } = req.query;
        const { companyId } = req.user!;

        let query = 'SELECT * FROM quality_issues WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        if (inspectionId) {
            query += ' AND inspectionId = ?';
            params.push(inspectionId);
        }

        query += ' ORDER BY createdAt DESC';

        const db = getDb();
        const issues = await db.all(query, params);
        res.json(issues);
    } catch (error) {
        logger.error('Failed to fetch quality issues:', error);
        next(new AppError('Failed to fetch quality issues', 500));
    }
};

export const createQualityIssue = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.user!;
        const { projectId, inspectionId, severity, description, location, assignedTo, status, photos } = req.body;
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const db = getDb();
        await db.run(
            `INSERT INTO quality_issues (id, companyId, projectId, inspectionId, severity, description, location, assignedTo, status, photos, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, companyId, projectId, inspectionId, severity, description, location, assignedTo, status || 'Open', JSON.stringify(photos || []), now, now]
        );

        const newIssue = await db.get('SELECT * FROM quality_issues WHERE id = ?', [id]);
        res.status(201).json(newIssue);
    } catch (error) {
        logger.error('Failed to create quality issue:', error);
        next(new AppError('Failed to create quality issue', 500));
    }
};

export const updateQualityIssue = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;
        const updates = req.body;
        const now = new Date().toISOString();
        const db = getDb();

        const issue = await db.get('SELECT * FROM quality_issues WHERE id = ? AND companyId = ?', [id, companyId]);
        if (!issue) {
            return next(new AppError('Quality issue not found', 404));
        }

        const allowedFields = ['severity', 'description', 'location', 'assignedTo', 'status', 'photos'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length > 0) {
            const setClause = fieldsToUpdate.map(f => `${f} = ?`).join(', ');
            const values = fieldsToUpdate.map(f => {
                if (f === 'photos') return JSON.stringify(updates[f]);
                return updates[f];
            });
            values.push(now, id);

            await db.run(`UPDATE quality_issues SET ${setClause}, updatedAt = ? WHERE id = ?`, values);
        }

        const updatedIssue = await db.get('SELECT * FROM quality_issues WHERE id = ?', [id]);
        res.json(updatedIssue);
    } catch (error) {
        logger.error('Failed to update quality issue:', error);
        next(new AppError('Failed to update quality issue', 500));
    }
};
