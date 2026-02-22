import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

// Create Change Order
export async function createChangeOrder(req: Request, res: Response) {
    try {
        const { projectId, title, description, originalCost, revisedCost, originalDays, revisedDays, reasonForChange, pcoId } = req.body;
        const { companyId, userId } = req.user!;

        const db = getDb();
        const now = new Date().toISOString();

        // Generate CO number
        const existingCOs = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM change_orders WHERE companyId = ?', [companyId]);
        const coNumber = `CO-${String((existingCOs?.count || 0) + 1).padStart(4, '0')}`;

        const coId = uuidv4();
        const costDelta = revisedCost - originalCost;
        const daysDelta = revisedDays - originalDays;

        await db.run(`
            INSERT INTO change_orders (
                id, projectId, companyId, pcoId, coNumber, title, description,
                originalCost, revisedCost, costDelta, originalDays, revisedDays, daysDelta,
                status, reasonForChange, createdBy, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            coId, projectId, companyId, pcoId || null, coNumber, title, description || null,
            originalCost, revisedCost, costDelta, originalDays, revisedDays, daysDelta,
            'pending', reasonForChange || null, userId, now, now
        ]);

        const changeOrder = await db.get('SELECT * FROM change_orders WHERE id = ?', [coId]);

        logger.info(`Change Order created: ${coNumber} by user ${userId}`);
        res.status(201).json({ success: true, changeOrder });
    } catch (error) {
        logger.error('Error creating change order:', error);
        res.status(500).json({ success: false, error: 'Failed to create change order' });
    }
}

// Get all Change Orders
export async function getChangeOrders(req: Request, res: Response) {
    try {
        const { companyId } = req.user!;
        const { projectId, status } = req.query;

        const db = getDb();
        let query = 'SELECT * FROM change_orders WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY createdAt DESC';

        const changeOrders = await db.all(query, params);

        res.json({ success: true, changeOrders });
    } catch (error) {
        logger.error('Error fetching change orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch change orders' });
    }
}

// Get Change Order by ID
export async function getChangeOrderById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const db = getDb();
        const changeOrder = await db.get('SELECT * FROM change_orders WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!changeOrder) {
            return res.status(404).json({ success: false, error: 'Change order not found' });
        }

        res.json({ success: true, changeOrder });
    } catch (error) {
        logger.error('Error fetching change order:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch change order' });
    }
}

// Approve Change Order
export async function approveChangeOrder(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId, userId } = req.user!;

        const db = getDb();
        const changeOrder = await db.get('SELECT * FROM change_orders WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!changeOrder) {
            return res.status(404).json({ success: false, error: 'Change order not found' });
        }

        const now = new Date().toISOString();

        await db.run(`
            UPDATE change_orders 
            SET status = ?, approvedBy = ?, approvedAt = ?, updatedAt = ?
            WHERE id = ? AND companyId = ?
        `, ['approved', userId, now, now, id, companyId]);

        const updatedCO = await db.get('SELECT * FROM change_orders WHERE id = ?', [id]);

        logger.info(`Change Order approved: ${(changeOrder as any).coNumber} by user ${userId}`);
        res.json({ success: true, changeOrder: updatedCO });
    } catch (error) {
        logger.error('Error approving change order:', error);
        res.status(500).json({ success: false, error: 'Failed to approve change order' });
    }
}

// Reject Change Order
export async function rejectChangeOrder(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const db = getDb();
        const changeOrder = await db.get('SELECT * FROM change_orders WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!changeOrder) {
            return res.status(404).json({ success: false, error: 'Change order not found' });
        }

        const now = new Date().toISOString();

        await db.run(`
            UPDATE change_orders 
            SET status = ?, updatedAt = ?
            WHERE id = ? AND companyId = ?
        `, ['rejected', now, id, companyId]);

        const updatedCO = await db.get('SELECT * FROM change_orders WHERE id = ?', [id]);

        logger.info(`Change Order rejected: ${(changeOrder as any).coNumber}`);
        res.json({ success: true, changeOrder: updatedCO });
    } catch (error) {
        logger.error('Error rejecting change order:', error);
        res.status(500).json({ success: false, error: 'Failed to reject change order' });
    }
}

// Execute Change Order
export async function executeChangeOrder(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const db = getDb();
        const changeOrder = await db.get('SELECT * FROM change_orders WHERE id = ? AND companyId = ?', [id, companyId]) as any;

        if (!changeOrder) {
            return res.status(404).json({ success: false, error: 'Change order not found' });
        }

        if (changeOrder.status !== 'approved') {
            return res.status(400).json({ success: false, error: 'Change order must be approved before execution' });
        }

        const now = new Date().toISOString();

        // Update CO status
        await db.run(`
            UPDATE change_orders 
            SET status = ?, executedAt = ?, updatedAt = ?
            WHERE id = ? AND companyId = ?
        `, ['executed', now, now, id, companyId]);

        // Update project budget (if exists)
        const project = await db.get<{ budget: string }>('SELECT budget FROM projects WHERE id = ?', [changeOrder.projectId]);
        if (project && project.budget) {
            const newBudget = parseFloat(project.budget) + changeOrder.costDelta;
            await db.run('UPDATE projects SET budget = ?, updatedAt = ? WHERE id = ?', [newBudget, now, changeOrder.projectId]);
        }

        const updatedCO = await db.get('SELECT * FROM change_orders WHERE id = ?', [id]);

        logger.info(`Change Order executed: ${changeOrder.coNumber}`);
        res.json({ success: true, changeOrder: updatedCO });
    } catch (error) {
        logger.error('Error executing change order:', error);
        res.status(500).json({ success: false, error: 'Failed to execute change order' });
    }
}
