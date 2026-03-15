import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AuthenticatedRequest } from '../../types/express.js';
import { getDb } from '../../database.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

export const getPours = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { companyId } = req.user!;

        let query = 'SELECT * FROM concrete_pours WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY pourDate DESC';

        const db = getDb();
        const pours = await db.all(query, params);
        res.json(pours);
    } catch (error) {
        logger.error('Failed to fetch concrete pours:', error);
        next(new AppError('Failed to fetch concrete pours', 500));
    }
};

export const createPour = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.user!;
        const { projectId, pourDate, location, element, volume, unit, mixDesign, supplier, startTime } = req.body;
        const id = randomUUID();
        const now = new Date().toISOString();

        const db = getDb();
        await db.run(
            `INSERT INTO concrete_pours (id, companyId, projectId, pourDate, location, element, volume, unit, mixDesign, supplier, startTime, status, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled', ?)`,
            [id, companyId, projectId, pourDate, location, element, volume, unit, mixDesign, supplier, startTime, now]
        );

        const newPour = await db.get('SELECT * FROM concrete_pours WHERE id = ?', [id]);
        res.status(201).json(newPour);
    } catch (error) {
        logger.error('Failed to create concrete pour:', error);
        next(new AppError('Failed to create concrete pour', 500));
    }
};

export const getTests = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { pourId } = req.query;
        const db = getDb();

        if (!pourId) {
            return res.json([]);
        }

        const tests = await db.all('SELECT * FROM concrete_tests WHERE pourId = ? ORDER BY testDate', [pourId]);
        res.json(tests);
    } catch (error) {
        logger.error('Failed to fetch concrete tests:', error);
        next(new AppError('Failed to fetch concrete tests', 500));
    }
};

export const createTest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { pourId, testDate, testAge, strength, targetStrength, testType, passed, labReportUrl } = req.body;
        const id = randomUUID();
        const now = new Date().toISOString();
        const db = getDb();

        await db.run(
            `INSERT INTO concrete_tests (id, pourId, testDate, testAge, strength, targetStrength, testType, passed, labReportUrl, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, pourId, testDate, testAge, strength, targetStrength, testType, passed, labReportUrl, now]
        );

        const newTest = await db.get('SELECT * FROM concrete_tests WHERE id = ?', [id]);
        res.status(201).json(newTest);
    } catch (error) {
        logger.error('Failed to create concrete test:', error);
        next(new AppError('Failed to create concrete test', 500));
    }
};

export const getStrengthCurve = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { pourId } = req.params;
        const db = getDb();

        const tests = await db.all(
            'SELECT testAge as age, strength, testDate FROM concrete_tests WHERE pourId = ? ORDER BY testAge ASC',
            [pourId]
        );

        res.json({ curve: tests });
    } catch (error) {
        logger.error('Failed to fetch strength curve:', error);
        next(new AppError('Failed to fetch strength curve', 500));
    }
};
