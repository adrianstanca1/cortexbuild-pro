import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AuthenticatedRequest } from '../../types/express.js';
import { getDb } from '../../database.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

export const getDeliveries = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { companyId } = req.user!;

        let query = 'SELECT * FROM material_deliveries WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY deliveryDate DESC';

        const db = getDb();
        const deliveries = await db.all(query, params);
        res.json(deliveries);
    } catch (error) {
        logger.error('Failed to fetch deliveries:', error);
        next(new AppError('Failed to fetch deliveries', 500));
    }
};

export const createDelivery = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.user!;
        const { projectId, material, quantity, unit, supplier, deliveryDate, poNumber, notes } = req.body;
        const id = randomUUID();
        const now = new Date().toISOString();

        const db = getDb();
        await db.run(
            `INSERT INTO material_deliveries (id, companyId, projectId, material, quantity, unit, supplier, deliveryDate, poNumber, notes, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, companyId, projectId, material, quantity, unit, supplier, deliveryDate, poNumber, notes, now, now]
        );

        const newDelivery = await db.get('SELECT * FROM material_deliveries WHERE id = ?', [id]);
        res.status(201).json(newDelivery);
    } catch (error) {
        logger.error('Failed to create delivery:', error);
        next(new AppError('Failed to create delivery', 500));
    }
};

export const getInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { companyId } = req.user!;

        let query = 'SELECT * FROM material_inventory WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        const db = getDb();
        const inventory = await db.all(query, params);
        res.json(inventory);
    } catch (error) {
        logger.error('Failed to fetch inventory:', error);
        next(new AppError('Failed to fetch inventory', 500));
    }
};

export const updateInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;
        const updates = req.body;
        const db = getDb();

        const item = await db.get('SELECT * FROM material_inventory WHERE id = ? AND companyId = ?', [id, companyId]);
        if (!item) {
            return next(new AppError('Inventory item not found', 404));
        }

        const allowedFields = ['quantity', 'onSite', 'allocated', 'available', 'location', 'lastUpdated'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length > 0) {
            const setClause = fieldsToUpdate.map(f => `${f} = ?`).join(', ');
            const values = fieldsToUpdate.map(f => updates[f]);
            values.push(id);

            await db.run(`UPDATE material_inventory SET ${setClause} WHERE id = ?`, values);
        }

        const updatedItem = await db.get('SELECT * FROM material_inventory WHERE id = ?', [id]);
        res.json(updatedItem);
    } catch (error) {
        logger.error('Failed to update inventory:', error);
        next(new AppError('Failed to update inventory', 500));
    }
};

export const upsertInventory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.user!;
        const { projectId, material, quantity, onSite, allocated, unit, location } = req.body;
        const db = getDb();

        const finalQuantity = quantity || onSite || 0;
        const finalAllocated = allocated || 0;
        const available = finalQuantity - finalAllocated;

        const existing = await db.get(
            'SELECT id FROM material_inventory WHERE companyId = ? AND projectId = ? AND material = ?',
            [companyId, projectId, material]
        );

        if (existing) {
            await db.run(
                `UPDATE material_inventory SET quantity = ?, onSite = ?, allocated = ?, available = ?, location = ?, lastUpdated = datetime('now')
                 WHERE id = ?`,
                [finalQuantity, finalQuantity, finalAllocated, available, location, existing.id]
            );
            const inventory = await db.get('SELECT * FROM material_inventory WHERE id = ?', [existing.id]);
            res.json(inventory);
        } else {
            const id = randomUUID();
            await db.run(
                `INSERT INTO material_inventory (id, companyId, projectId, material, quantity, onSite, allocated, available, unit, location)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, companyId, projectId, material, finalQuantity, finalQuantity, finalAllocated, available, unit, location]
            );
            const inventory = await db.get('SELECT * FROM material_inventory WHERE id = ?', [id]);
            res.status(201).json(inventory);
        }
    } catch (error) {
        logger.error('Failed to upsert inventory:', error);
        next(new AppError('Failed to upsert inventory', 500));
    }
};

export const getRequisitions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { companyId } = req.user!;

        let query = 'SELECT * FROM material_requisitions WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY createdAt DESC';

        const db = getDb();
        const requisitions = await db.all(query, params);
        res.json(requisitions);
    } catch (error) {
        logger.error('Failed to fetch requisitions:', error);
        next(new AppError('Failed to fetch requisitions', 500));
    }
};

export const createRequisition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { companyId } = req.user!;
        const { projectId, material, quantity, unit, urgency, neededBy, notes } = req.body;
        const id = randomUUID();
        const now = new Date().toISOString();

        const db = getDb();
        await db.run(
            `INSERT INTO material_requisitions (id, companyId, projectId, material, quantity, unit, urgency, neededBy, notes, status, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [id, companyId, projectId, material, quantity, unit, urgency, neededBy, notes, now]
        );

        const newRequisition = await db.get('SELECT * FROM material_requisitions WHERE id = ?', [id]);
        res.status(201).json(newRequisition);
    } catch (error) {
        logger.error('Failed to create requisition:', error);
        next(new AppError('Failed to create requisition', 500));
    }
};
