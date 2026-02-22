import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/hazards
 * Get all hazards for a project or company
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, companyId, status, severity } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM hazards WHERE 1=1';
    const params: any[] = [];

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }

    if (companyId) {
      query += ' AND company_id = ?';
      params.push(companyId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY created_at DESC';

    const hazards = await db.all(query, params);
    
    res.json(hazards || []);
  } catch (error: any) {
    logger.error('Error fetching hazards:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/hazards
 * Create a new hazard detection
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      projectId,
      companyId,
      type,
      severity,
      description,
      location,
      detectedBy,
      detectionMethod,
      imageUrl,
      coordinates
    } = req.body;

    if (!projectId || !companyId || !type || !severity || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDb();
    const id = `HAZ-${Date.now()}`;

    await db.run(
      `INSERT INTO hazards (
        id, project_id, company_id, type, severity, description,
        location, detected_by, detection_method, image_url, coordinates,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        id,
        projectId,
        companyId,
        type,
        severity,
        description,
        location || null,
        detectedBy || 'System',
        detectionMethod || 'Manual',
        imageUrl || null,
        coordinates ? JSON.stringify(coordinates) : null,
        'open'
      ]
    );

    const hazard = await db.get('SELECT * FROM hazards WHERE id = ?', [id]);
    
    logger.info(`Hazard created: ${id}`);
    res.status(201).json(hazard);
  } catch (error: any) {
    logger.error('Error creating hazard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/hazards/:id
 * Update a hazard (status, resolution, etc.)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, resolvedBy, notes } = req.body;

    const db = getDb();

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (resolution) {
      updates.push('resolution = ?');
      params.push(resolution);
    }

    if (resolvedBy) {
      updates.push('resolved_by = ?');
      params.push(resolvedBy);
    }

    if (notes) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (status === 'resolved') {
      updates.push('resolved_at = datetime("now")');
    }

    updates.push('updated_at = datetime("now")');
    params.push(id);

    await db.run(
      `UPDATE hazards SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const hazard = await db.get('SELECT * FROM hazards WHERE id = ?', [id]);
    
    res.json(hazard);
  } catch (error: any) {
    logger.error('Error updating hazard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/hazards/:id
 * Delete a hazard
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    await db.run('DELETE FROM hazards WHERE id = ?', [id]);
    
    res.json({ message: 'Hazard deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting hazard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/hazards/ai-detect
 * AI-powered hazard detection from image or description
 */
router.post('/ai-detect', authenticateToken, async (req, res) => {
  try {
    const { imageUrl, description, projectId, companyId } = req.body;

    // In a real implementation, this would call an AI service
    // For now, we'll simulate AI detection
    const detectedHazards = [];

    // Mock AI detection logic
    if (description && description.toLowerCase().includes('ladder')) {
      detectedHazards.push({
        type: 'Fall Hazard',
        severity: 'high',
        description: 'Unstable ladder detected - potential fall hazard',
        confidence: 0.87
      });
    }

    if (description && description.toLowerCase().includes('wire')) {
      detectedHazards.push({
        type: 'Electrical Hazard',
        severity: 'critical',
        description: 'Exposed electrical wires detected',
        confidence: 0.92
      });
    }

    // If image analysis was requested, add placeholder detection
    if (imageUrl) {
      detectedHazards.push({
        type: 'Safety Equipment',
        severity: 'medium',
        description: 'Workers without proper PPE detected in image',
        confidence: 0.75
      });
    }

    res.json({
      detectedHazards,
      analysisComplete: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Error in AI hazard detection:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/hazards/stats
 * Get hazard statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { projectId, companyId } = req.query;
    const db = getDb();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (projectId) {
      whereClause += ' AND project_id = ?';
      params.push(projectId);
    }

    if (companyId) {
      whereClause += ' AND company_id = ?';
      params.push(companyId);
    }

    const stats = await db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low
      FROM hazards ${whereClause}`,
      params
    );

    res.json(stats || {
      total: 0,
      open: 0,
      resolved: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    });
  } catch (error: any) {
    logger.error('Error fetching hazard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
