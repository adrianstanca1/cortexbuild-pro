import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

// Create Inspection
export async function createInspection(req: Request, res: Response) {
    try {
        const { projectId, title, type, scheduledDate, inspector, location, checklist } = req.body;
        const { companyId, userId } = req.user!;

        const db = getDb();
        const now = new Date().toISOString();

        // Generate inspection number
        const existingInspections = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM inspections WHERE companyId = ?', [companyId]);
        const inspectionNumber = `INS-${String((existingInspections?.count || 0) + 1).padStart(4, '0')}`;

        const inspectionId = uuidv4();

        await db.run(`
            INSERT INTO inspections (
                id, projectId, companyId, inspectionNumber, title, type,
                scheduledDate, inspector, status, location, checklist,
                createdBy, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            inspectionId, projectId, companyId, inspectionNumber, title, type,
            scheduledDate, inspector, 'scheduled', location || null, JSON.stringify(checklist || []),
            userId, now, now
        ]);

        const inspection = await db.get('SELECT * FROM inspections WHERE id = ?', [inspectionId]);

        logger.info(`Inspection created: ${inspectionNumber} by user ${userId}`);
        res.status(201).json({ success: true, inspection });
    } catch (error) {
        logger.error('Error creating inspection:', error);
        res.status(500).json({ success: false, error: 'Failed to create inspection' });
    }
}

// Get all Inspections
export async function getInspections(req: Request, res: Response) {
    try {
        const { companyId } = req.user!;
        const { projectId, status, type } = req.query;

        const db = getDb();
        let query = 'SELECT * FROM inspections WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY scheduledDate DESC';

        const inspections = await db.all(query, params);

        res.json({ success: true, inspections });
    } catch (error) {
        logger.error('Error fetching inspections:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch inspections' });
    }
}

// Get Inspection by ID
export async function getInspectionById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;

        const db = getDb();
        const inspection = await db.get('SELECT * FROM inspections WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        res.json({ success: true, inspection });
    } catch (error) {
        logger.error('Error fetching inspection:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch inspection' });
    }
}

// Update Inspection
export async function updateInspection(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;
        const updates = req.body;

        const db = getDb();
        const inspection = await db.get('SELECT * FROM inspections WHERE id = ? AND companyId = ?', [id, companyId]);

        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        const allowedFields = ['status', 'checklist', 'findings', 'deficiencies', 'passFailStatus', 'notes'];
        const updateFields: string[] = [];
        const updateValues: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(
                    field === 'checklist' || field === 'findings' || field === 'deficiencies'
                        ? JSON.stringify(updates[field])
                        : updates[field]
                );
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }

        updateFields.push('updatedAt = ?');
        updateValues.push(new Date().toISOString());
        updateValues.push(id);
        updateValues.push(companyId);

        await db.run(`UPDATE inspections SET ${updateFields.join(', ')} WHERE id = ? AND companyId = ?`, updateValues);

        const updatedInspection = await db.get('SELECT * FROM inspections WHERE id = ?', [id]);

        logger.info(`Inspection updated: ${id}`);
        res.json({ success: true, inspection: updatedInspection });
    } catch (error) {
        logger.error('Error updating inspection:', error);
        res.status(500).json({ success: false, error: 'Failed to update inspection' });
    }
}

// Complete Inspection
export async function completeInspection(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { companyId } = req.user!;
        const { passFailStatus, findings, deficiencies, notes } = req.body;

        const db = getDb();
        const inspection = await db.get('SELECT * FROM inspections WHERE id = ? AND companyId = ?', [id, companyId]) as any;

        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        const now = new Date().toISOString();

        await db.run(`
            UPDATE inspections 
            SET status = ?, passFailStatus = ?, findings = ?, deficiencies = ?, 
                notes = ?, completedAt = ?, updatedAt = ?
            WHERE id = ? AND companyId = ?
        `, [
            'completed', passFailStatus, JSON.stringify(findings || []),
            JSON.stringify(deficiencies || []), notes || null, now, now, id, companyId
        ]);

        const updatedInspection = await db.get('SELECT * FROM inspections WHERE id = ?', [id]);

        logger.info(`Inspection completed: ${inspection.inspectionNumber}`);
        res.json({ success: true, inspection: updatedInspection });
    } catch (error) {
        logger.error('Error completing inspection:', error);
        res.status(500).json({ success: false, error: 'Failed to complete inspection' });
    }
}

// Get Inspection Templates
export async function getInspectionTemplates(req: Request, res: Response) {
    try {
        const { companyId } = req.user!;

        const db = getDb();
        const templates = await db.all(
            'SELECT * FROM inspection_templates WHERE companyId = ? AND isActive = 1 ORDER BY name',
            [companyId]
        );

        res.json({ success: true, templates });
    } catch (error) {
        logger.error('Error fetching inspection templates:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
}

// Create Inspection Template
export async function createInspectionTemplate(req: Request, res: Response) {
    try {
        const { name, type, checklist, description } = req.body;
        const { companyId, userId } = req.user!;

        const db = getDb();
        const now = new Date().toISOString();
        const templateId = uuidv4();

        await db.run(`
            INSERT INTO inspection_templates (
                id, companyId, name, type, checklist, description, createdBy, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            templateId, companyId, name, type, JSON.stringify(checklist),
            description || null, userId, now, now
        ]);

        const template = await db.get('SELECT * FROM inspection_templates WHERE id = ?', [templateId]);

        logger.info(`Inspection template created: ${name} by user ${userId}`);
        res.status(201).json({ success: true, template });
    } catch (error) {
        logger.error('Error creating inspection template:', error);
        res.status(500).json({ success: false, error: 'Failed to create template' });
    }
}
