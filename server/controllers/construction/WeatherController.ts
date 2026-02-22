import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AuthenticatedRequest } from '../../types/express.js';
import { getDb } from '../../database.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

export const getWeatherDelays = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { companyId } = req.user!;

        let query = 'SELECT * FROM weather_delays WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY date DESC';

        const db = getDb();
        const delays = await db.all(query, params);
        res.json(delays);
    } catch (error) {
        logger.error('Failed to fetch weather delays:', error);
        next(new AppError('Failed to fetch weather delays', 500));
    }
};

export const logWeatherDelay = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { companyId, id: userId } = req.user!; // Assuming id is userId
        const { projectId, date, weatherType, description, hoursLost, costImpact } = req.body;
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const db = getDb();
        await db.run(
            `INSERT INTO weather_delays (id, companyId, projectId, date, weatherType, description, hoursLost, costImpact, createdBy, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, companyId, projectId, date, weatherType, description, hoursLost, costImpact, userId, now]
        );

        const newDelay = await db.get('SELECT * FROM weather_delays WHERE id = ?', [id]);
        res.status(201).json(newDelay);
    } catch (error) {
        logger.error('Failed to log weather delay:', error);
        next(new AppError('Failed to log weather delay', 500));
    }
};
