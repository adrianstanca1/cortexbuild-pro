import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AuthenticatedRequest } from '../../types/express.js';
import { getDb } from '../../database.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

export const getPhotos = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { companyId } = req.user!;

        let query = 'SELECT * FROM progress_photos WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY captureDate DESC';

        const db = getDb();
        const photos = await db.all(query, params);
        res.json(photos);
    } catch (error) {
        logger.error('Failed to fetch progress photos:', error);
        next(new AppError('Failed to fetch progress photos', 500));
    }
};

export const uploadPhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.user!;
        const { projectId, location, photoUrl, photoType, captureDate, tags, description } = req.body;
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const db = getDb();
        await db.run(
            `INSERT INTO progress_photos (id, companyId, projectId, location, photoUrl, photoType, captureDate, tags, description, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, companyId, projectId, location, photoUrl, photoType, captureDate, JSON.stringify(tags), description, now]
        );

        const newPhoto = await db.get('SELECT * FROM progress_photos WHERE id = ?', [id]);
        res.status(201).json(newPhoto);
    } catch (error) {
        logger.error('Failed to upload progress photo:', error);
        next(new AppError('Failed to upload progress photo', 500));
    }
};
