import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

// Create NCR
export async function createNCR(req: Request, res: Response) {
    try {
        const { projectId, title, description, location, discoveredBy, severity, category, assignedTo, dueDate } = req.body;
        const { companyId, userId } = req.user!;

        const db = getDb();
        const now = new Date().toISOString();

        // Generate NCR number
        const existingNCRs = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM ncrs WHERE companyId = ?', [companyId]);
        const ncrNumber = `NCR-${String((existingNCRs?.count || 0) + 1).padStart(4, '0')}`;

        const ncrId = uuidv4();

        await db.run(`
            INSERT INTO ncrs (
                id, projectId, companyId, ncrNumber, title, description, location,
                discoveredBy, discoveredDate, severity, category, status, assignedTo, dueDate,
                createdBy, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            ncrId, projectId, companyId, ncrNumber, title, description, location || null,
            discoveredBy, now, severity || 'medium', category || null, 'open', assignedTo || null, dueDate || null,
            userId, now, now
        ]);

        const ncr = await db.get('SELECT * FROM ncrs WHERE id = ?', [ncrId]);

        logger.info(`NCR created: ${ncrNumber} by user ${userId}`);
        res.status(201).json({ success: true, ncr });
    } catch (error) {
        logger.error('Error creating NCR:', error);
        res.status(500).json({ success: false, error: 'Failed to create NCR' });
    }
}

// Get all NCRs
export async function getNCRs(req: Request, res: Response) {
    try {
        const { companyId } = req.user!;
        const { projectId, status, severity } = req.query;

        const db = getDb();
        let query = 'SELECT * FROM ncrs WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (severity) {
            query += ' AND severity = ?';
            params.push(severity);
        }

        query += ' ORDER BY discoveredDate DESC';

        const ncrs = await db.all(query, params);

        res.json({ success: true, ncrs });
    } catch (error) {
        logger.error('Error fetching NCRs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch NCRs' });
    }
}

// Get NCR by ID
export async function getNCRById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const db = getDb();
        const ncr = await db.get('SELECT * FROM ncrs WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!ncr) {
            return res.status(404).json({ success: false, error: 'NCR not found' });
        }

        res.json({ success: true, ncr });
    } catch (error) {
        logger.error('Error fetching NCR:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch NCR' });
    }
}

// Update NCR
export async function updateNCR(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;
        const updates = req.body;

        const db = getDb();
        const ncr = await db.get('SELECT * FROM ncrs WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!ncr) {
            return res.status(404).json({ success: false, error: 'NCR not found' });
        }

        const allowedFields = ['status', 'rootCause', 'correctiveAction', 'preventiveAction', 'assignedTo', 'dueDate', 'severity'];
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

        await db.run(`UPDATE ncrs SET ${updateFields.join(', ')} WHERE id = ? AND companyId = ?`, updateValues);

        const updatedNCR = await db.get('SELECT * FROM ncrs WHERE id = ?', [id]);

        logger.info(`NCR updated: ${id}`);
        res.json({ success: true, ncr: updatedNCR });
    } catch (error) {
        logger.error('Error updating NCR:', error);
        res.status(500).json({ success: false, error: 'Failed to update NCR' });
    }
}

// Resolve NCR
export async function resolveNCR(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;
        const { correctiveAction, rootCause } = req.body;

        const db = getDb();
        const ncr = await db.get('SELECT * FROM ncrs WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!ncr) {
            return res.status(404).json({ success: false, error: 'NCR not found' });
        }

        const now = new Date().toISOString();

        await db.run(`
            UPDATE ncrs 
            SET status = 'resolved', correctiveAction = ?, rootCause = ?, updatedAt = ?
            WHERE id = ? AND companyId = ?
        `, [correctiveAction, rootCause, now, id, companyId]);

        const updatedNCR = await db.get('SELECT * FROM ncrs WHERE id = ?', [id]);

        logger.info(`NCR resolved: ${id}`);
        res.json({ success: true, ncr: updatedNCR });
    } catch (error) {
        logger.error('Error resolving NCR:', error);
        res.status(500).json({ success: false, error: 'Failed to resolve NCR' });
    }
}

// Close NCR
export async function closeNCR(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId, userId } = req.user!;

        const db = getDb();
        const ncr = await db.get('SELECT * FROM ncrs WHERE id = ? AND companyId = ?', [id, companyId]) as any;

        if (!ncr) {
            return res.status(404).json({ success: false, error: 'NCR not found' });
        }

        const now = new Date().toISOString();

        await db.run(`
            UPDATE ncrs 
            SET status = ?, closedBy = ?, closedAt = ?, updatedAt = ?
            WHERE id = ? AND companyId = ?
        `, ['closed', userId, now, now, id, companyId]);

        const updatedNCR = await db.get('SELECT * FROM ncrs WHERE id = ?', [id]);

        logger.info(`NCR closed: ${ncr.ncrNumber} by user ${userId}`);
        res.json({ success: true, ncr: updatedNCR });
    } catch (error) {
        logger.error('Error closing NCR:', error);
        res.status(500).json({ success: false, error: 'Failed to close NCR' });
    }
}

// Delete NCR
export async function deleteNCR(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const db = getDb();
        const ncr = await db.get('SELECT * FROM ncrs WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!ncr) {
            return res.status(404).json({ success: false, error: 'NCR not found' });
        }

        await db.run('DELETE FROM ncrs WHERE id = ? AND companyId = ?', [id, companyId]);

        logger.info(`NCR deleted: ${id}`);
        res.json({ success: true, message: 'NCR deleted successfully' });
    } catch (error) {
        logger.error('Error deleting NCR:', error);
        res.status(500).json({ success: false, error: 'Failed to delete NCR' });
    }
}
