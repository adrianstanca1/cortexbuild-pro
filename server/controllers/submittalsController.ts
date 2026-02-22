import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { broadcastToProject } from '../socket.js';

/**
 * Submittal Controller
 * Manages submittal workflow with approval chains, versioning, and real-time notifications
 */

// ============================================
// GET ALL SUBMITTALS
// ============================================

export const getSubmittals = async (req: any, res: Response) => {
    try {
        const { projectId } = req.query;
        const tenantId = req.context?.tenantId || req.user?.companyId;

        if (!tenantId) {
            return res.status(401).json({ error: 'Tenant context required' });
        }

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        const submittals = await getDb().all(
            `SELECT s.*, 
                    u1.name as submitterName,
                    u2.name as reviewerName
             FROM submittals s
             LEFT JOIN users u1 ON s.submittedBy = u1.id
             LEFT JOIN users u2 ON s.reviewer = u2.id
             WHERE s.companyId = ? AND s.projectId = ?
             ORDER BY s.createdAt DESC`,
            [tenantId, projectId]
        );

        res.json(submittals);
    } catch (error: any) {
        logger.error('Failed to fetch submittals:', error);
        res.status(500).json({ error: 'Failed to fetch submittals' });
    }
};

// ============================================
// GET SINGLE SUBMITTAL
// ============================================

export const getSubmittal = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.context?.tenantId || req.user?.companyId;

        const submittal = await getDb().get(
            `SELECT s.*, 
                    u1.name as submitterName,
                    u2.name as reviewerName
             FROM submittals s
             LEFT JOIN users u1 ON s.submittedBy = u1.id
             LEFT JOIN users u2 ON s.reviewer = u2.id
             WHERE s.id = ? AND s.companyId = ?`,
            [id, tenantId]
        );

        if (!submittal) {
            return res.status(404).json({ error: 'Submittal not found' });
        }

        res.json(submittal);
    } catch (error: any) {
        logger.error('Failed to fetch submittal:', error);
        res.status(500).json({ error: 'Failed to fetch submittal' });
    }
};

// ============================================
// CREATE SUBMITTAL
// ============================================

export const createSubmittal = async (req: any, res: Response) => {
    try {
        const tenantId = req.context?.tenantId || req.user?.companyId;
        const userId = req.context?.userId || req.user?.userId;

        if (!tenantId || !userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const {
            projectId,
            number,
            title,
            type,
            specSection,
            dateSubmitted,
            dueDate,
            documentUrl,
            notes,
            distributionList
        } = req.body;

        // Validation
        if (!projectId || !number || !title || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for duplicate number
        const existing = await getDb().get(
            'SELECT id FROM submittals WHERE companyId = ? AND projectId = ? AND number = ?',
            [tenantId, projectId, number]
        );

        if (existing) {
            return res.status(400).json({ error: 'Submittal number already exists for this project' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await getDb().run(
            `INSERT INTO submittals (
                id, companyId, projectId, number, title, type, specSection,
                submittedBy, dateSubmitted, dueDate, documentUrl, notes,
                status, revision, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, tenantId, projectId, number, title, type, specSection || null,
                userId, dateSubmitted || now, dueDate || null, documentUrl || null, notes || null,
                'Draft', 1, now, now
            ]
        );

        const submittal = await getDb().get('SELECT * FROM submittals WHERE id = ?', [id]);

        // Broadcast real-time event
        broadcastToProject(projectId, {
            event: 'submittal.created',
            data: { submittal, companyId: tenantId }
        });

        logger.info(`Submittal created: ${id} by user ${userId} in project ${projectId}`);
        res.status(201).json(submittal);
    } catch (error: any) {
        logger.error('Failed to create submittal:', error);
        res.status(500).json({ error: 'Failed to create submittal' });
    }
};

// ============================================
// UPDATE SUBMITTAL
// ============================================

export const updateSubmittal = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.context?.tenantId || req.user?.companyId;
        const userId = req.context?.userId || req.user?.userId;

        const submittal = await getDb().get(
            'SELECT * FROM submittals WHERE id = ? AND companyId = ?',
            [id, tenantId]
        );

        if (!submittal) {
            return res.status(404).json({ error: 'Submittal not found' });
        }

        const {
            title,
            type,
            specSection,
            dueDate,
            documentUrl,
            notes
        } = req.body;

        await getDb().run(
            `UPDATE submittals 
             SET title = ?, type = ?, specSection = ?, dueDate = ?, 
                 documentUrl = ?, notes = ?, updatedAt = datetime('now')
             WHERE id = ?`,
            [title || submittal.title, type || submittal.type, specSection || submittal.specSection,
            dueDate || submittal.dueDate, documentUrl || submittal.documentUrl,
            notes || submittal.notes, id]
        );

        const updated = await getDb().get('SELECT * FROM submittals WHERE id = ?', [id]);

        broadcastToProject(submittal.projectId, {
            event: 'submittal.updated',
            data: { submittal: updated, companyId: tenantId }
        });

        res.json(updated);
    } catch (error: any) {
        logger.error('Failed to update submittal:', error);
        res.status(500).json({ error: 'Failed to update submittal' });
    }
};

// ============================================
// SUBMIT FOR REVIEW
// ============================================

export const submitForReview = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.context?.tenantId || req.user?.companyId;
        const userId = req.context?.userId || req.user?.userId;

        const submittal = await getDb().get(
            'SELECT * FROM submittals WHERE id = ? AND companyId = ?',
            [id, tenantId]
        );

        if (!submittal) {
            return res.status(404).json({ error: 'Submittal not found' });
        }

        if (submittal.status !== 'Draft' && submittal.status !== 'Revise and Resubmit') {
            return res.status(400).json({ error: 'Submittal cannot be submitted in current status' });
        }

        await getDb().run(
            `UPDATE submittals 
             SET status = 'Pending Review', 
                 dateSubmitted = datetime('now'),
                 updatedAt = datetime('now')
             WHERE id = ?`,
            [id]
        );

        const updated = await getDb().get('SELECT * FROM submittals WHERE id = ?', [id]);

        broadcastToProject(submittal.projectId, {
            event: 'submittal.submitted',
            data: { submittal: updated, companyId: tenantId }
        });

        logger.info(`Submittal submitted for review: ${id} by user ${userId}`);
        res.json(updated);
    } catch (error: any) {
        logger.error('Failed to submit submittal:', error);
        res.status(500).json({ error: 'Failed to submit submittal' });
    }
};

// ============================================
// REVIEW SUBMITTAL
// ============================================

export const reviewSubmittal = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.context?.tenantId || req.user?.companyId;
        const userId = req.context?.userId || req.user?.userId;

        const { status, comments } = req.body;

        if (!['Approved', 'Approved as Noted', 'Revise and Resubmit', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const submittal = await getDb().get(
            'SELECT * FROM submittals WHERE id = ? AND companyId = ?',
            [id, tenantId]
        );

        if (!submittal) {
            return res.status(404).json({ error: 'Submittal not found' });
        }

        if (submittal.status !== 'Pending Review') {
            return res.status(400).json({ error: 'Submittal is not pending review' });
        }

        // Create revision record before updating
        const revisionId = uuidv4();
        await getDb().run(
            `INSERT INTO submittal_revisions (
                id, submittalId, revision, dateSubmitted, submittedBy,
                status, reviewedBy, reviewedDate, comments, documentUrl
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`,
            [
                revisionId,
                id,
                submittal.revision,
                submittal.dateSubmitted,
                submittal.submittedBy,
                status,
                userId,
                comments || null,
                submittal.documentUrl
            ]
        );

        // Update submittal
        const newRevision = status === 'Revise and Resubmit' ? submittal.revision + 1 : submittal.revision;

        await getDb().run(
            `UPDATE submittals 
             SET status = ?, 
                 reviewer = ?, 
                 reviewedDate = datetime('now'),
                 notes = ?,
                 revision = ?,
                 updatedAt = datetime('now')
             WHERE id = ?`,
            [status, userId, comments || submittal.notes, newRevision, id]
        );

        const updated = await getDb().get('SELECT * FROM submittals WHERE id = ?', [id]);

        broadcastToProject(submittal.projectId, {
            event: 'submittal.reviewed',
            data: { submittal: updated, status, companyId: tenantId }
        });

        logger.info(`Submittal reviewed: ${id} with status ${status} by user ${userId}`);
        res.json(updated);
    } catch (error: any) {
        logger.error('Failed to review submittal:', error);
        res.status(500).json({ error: 'Failed to review submittal' });
    }
};

// ===========================================
// GET SUBMITTAL REVISIONS
// ============================================

export const getRevisions = async (req: any, res: Response) => {
    try {
        const { submittalId } = req.params;
        const tenantId = req.context?.tenantId || req.user?.companyId;

        // Verify ownership
        const submittal = await getDb().get(
            'SELECT id FROM submittals WHERE id = ? AND companyId = ?',
            [submittalId, tenantId]
        );

        if (!submittal) {
            return res.status(404).json({ error: 'Submittal not found' });
        }

        const revisions = await getDb().all(
            `SELECT sr.*,
                    u1.name as submitterName,
                    u2.name as reviewerName
             FROM submittal_revisions sr
             LEFT JOIN users u1 ON sr.submittedBy = u1.id
             LEFT JOIN users u2 ON sr.reviewedBy = u2.id
             WHERE sr.submittalId = ?
             ORDER BY sr.revision DESC`,
            [submittalId]
        );

        res.json(revisions);
    } catch (error: any) {
        logger.error('Failed to fetch submittal revisions:', error);
        res.status(500).json({ error: 'Failed to fetch submittal revisions' });
    }
};

// ============================================
// DELETE SUBMITTAL
// ============================================

export const deleteSubmittal = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.context?.tenantId || req.user?.companyId;

        const submittal = await getDb().get(
            'SELECT * FROM submittals WHERE id = ? AND companyId = ?',
            [id, tenantId]
        );

        if (!submittal) {
            return res.status(404).json({ error: 'Submittal not found' });
        }

        // Only allow deletion of drafts
        if (submittal.status !== 'Draft') {
            return res.status(400).json({ error: 'Only draft submittals can be deleted' });
        }

        await getDb().run('DELETE FROM submittal_revisions WHERE submittalId = ?', [id]);
        await getDb().run('DELETE FROM submittals WHERE id = ?', [id]);

        broadcastToProject(submittal.projectId, {
            event: 'submittal.deleted',
            data: { submittalId: id, companyId: tenantId }
        });

        res.json({ success: true, message: 'Submittal deleted' });
    } catch (error: any) {
        logger.error('Failed to delete submittal:', error);
        res.status(500).json({ error: 'Failed to delete submittal' });
    }
};
