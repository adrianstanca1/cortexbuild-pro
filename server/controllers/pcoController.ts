import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

// Create PCO
export async function createPCO(req: Request, res: Response) {
    try {
        const { projectId, title, description, estimatedCost, estimatedDays, priority, category, requestedBy } = req.body;
        const { companyId, userId } = req.user!;

        const db = getDb();
        const now = new Date().toISOString();

        // Generate PCO number
        const existingPCOs = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM pcos WHERE companyId = ?', [companyId]);
        const pcoNumber = `PCO-${String((existingPCOs?.count || 0) + 1).padStart(4, '0')}`;

        const pcoId = uuidv4();

        await db.run(`
            INSERT INTO pcos (
                id, projectId, companyId, pcoNumber, title, description,
                requestedBy, requestDate, estimatedCost, estimatedDays,
                status, priority, category, createdBy, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            pcoId, projectId, companyId, pcoNumber, title, description || null,
            requestedBy, now, estimatedCost || null, estimatedDays || null,
            'draft', priority || 'medium', category || null, userId, now, now
        ]);

        const pco = await db.get('SELECT * FROM pcos WHERE id = ?', [pcoId]);

        logger.info(`PCO created: ${pcoNumber} by user ${userId}`);
        res.status(201).json({ success: true, pco });
    } catch (error) {
        logger.error('Error creating PCO:', error);
        res.status(500).json({ success: false, error: 'Failed to create PCO' });
    }
}

// Get all PCOs
export async function getPCOs(req: Request, res: Response) {
    try {
        const { companyId } = req.user!;
        const { projectId, status } = req.query;

        const db = getDb();
        let query = 'SELECT * FROM pcos WHERE companyId = ?';
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

        const pcos = await db.all(query, params);

        res.json({ success: true, pcos });
    } catch (error) {
        logger.error('Error fetching PCOs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch PCOs' });
    }
}

// Get PCO by ID
export async function getPCOById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const db = getDb();
        const pco = await db.get('SELECT * FROM pcos WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!pco) {
            return res.status(404).json({ success: false, error: 'PCO not found' });
        }

        res.json({ success: true, pco });
    } catch (error) {
        logger.error('Error fetching PCO:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch PCO' });
    }
}

// Update PCO
export async function updatePCO(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;
        const updates = req.body;

        const db = getDb();
        const pco = await db.get('SELECT * FROM pcos WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!pco) {
            return res.status(404).json({ success: false, error: 'PCO not found' });
        }

        const allowedFields = ['title', 'description', 'estimatedCost', 'estimatedDays', 'priority', 'category', 'status'];
        const updateFields: string[] = [];
        const updateValues: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(updates[field]);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }

        updateFields.push('updatedAt = ?');
        updateValues.push(new Date().toISOString());
        updateValues.push(id);
        updateValues.push(companyId);

        await db.run(`UPDATE pcos SET ${updateFields.join(', ')} WHERE id = ? AND companyId = ?`, updateValues);

        const updatedPCO = await db.get('SELECT * FROM pcos WHERE id = ?', [id]);

        logger.info(`PCO updated: ${id}`);
        res.json({ success: true, pco: updatedPCO });
    } catch (error) {
        logger.error('Error updating PCO:', error);
        res.status(500).json({ success: false, error: 'Failed to update PCO' });
    }
}

// Convert PCO to CO
export async function convertPCOToChangeOrder(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId, userId } = req.user!;
        const { originalCost, originalDays, reasonForChange } = req.body;

        const db = getDb();
        const pco = await db.get('SELECT * FROM pcos WHERE id = ? AND companyId = ?', [id, companyId]) as any;

        if (!pco) {
            return res.status(404).json({ success: false, error: 'PCO not found' });
        }

        if (pco.status === 'converted') {
            return res.status(400).json({ success: false, error: 'PCO already converted' });
        }

        const now = new Date().toISOString();

        // Generate CO number
        const existingCOs = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM change_orders WHERE companyId = ?', [companyId]);
        const coNumber = `CO-${String((existingCOs?.count || 0) + 1).padStart(4, '0')}`;

        const coId = uuidv4();
        const revisedCost = pco.estimatedCost || 0;
        const revisedDays = pco.estimatedDays || 0;

        await db.run(`
            INSERT INTO change_orders (
                id, projectId, companyId, pcoId, coNumber, title, description,
                originalCost, revisedCost, costDelta, originalDays, revisedDays, daysDelta,
                status, reasonForChange, createdBy, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            coId, pco.projectId, companyId, id, coNumber, pco.title, pco.description,
            originalCost, revisedCost, revisedCost - originalCost,
            originalDays, revisedDays, revisedDays - originalDays,
            'pending', reasonForChange || null, userId, now, now
        ]);

        // Update PCO status
        await db.run('UPDATE pcos SET status = ?, updatedAt = ? WHERE id = ?', ['converted', now, id]);

        const changeOrder = await db.get('SELECT * FROM change_orders WHERE id = ?', [coId]);

        logger.info(`PCO ${pco.pcoNumber} converted to CO ${coNumber}`);
        res.status(201).json({ success: true, changeOrder });
    } catch (error) {
        logger.error('Error converting PCO to CO:', error);
        res.status(500).json({ success: false, error: 'Failed to convert PCO' });
    }
}

// Delete PCO
export async function deletePCO(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const db = getDb();
        const pco = await db.get('SELECT * FROM pcos WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!pco) {
            return res.status(404).json({ success: false, error: 'PCO not found' });
        }

        await db.run('DELETE FROM pcos WHERE id = ? AND companyId = ?', [id, companyId]);

        logger.info(`PCO deleted: ${id}`);
        res.json({ success: true, message: 'PCO deleted successfully' });
    } catch (error) {
        logger.error('Error deleting PCO:', error);
        res.status(500).json({ success: false, error: 'Failed to delete PCO' });
    }
}
