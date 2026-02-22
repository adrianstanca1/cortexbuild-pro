import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { broadcastToCompany, broadcastToProject } from '../socket.js';

// ─── Location Tracking ──────────────────────────────────────────────────────

/**
 * POST /api/v1/location/update
 * Update the current user's GPS location. Called on login and every 10 minutes.
 */
export const updateLocation = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.userId || req.context?.userId;
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { latitude, longitude, accuracy, altitude, heading, speed } = req.body;

        if (latitude == null || longitude == null) {
            res.status(400).json({ error: 'latitude and longitude are required' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        // Insert location log entry
        await db.run(
            `INSERT INTO location_logs (id, userId, companyId, latitude, longitude, accuracy, altitude, heading, speed, recordedAt, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, tenantId, latitude, longitude, accuracy || null, altitude || null, heading || null, speed || null, now, now]
        );

        // Upsert current location on the user record
        await db.run(
            `UPDATE users SET currentLatitude = ?, currentLongitude = ?, lastLocationUpdate = ? WHERE id = ?`,
            [latitude, longitude, now, userId]
        );

        // Broadcast real-time location update to company
        broadcastToCompany(tenantId, {
            type: 'location_update',
            entityType: 'user_location',
            data: { userId, latitude, longitude, accuracy, altitude, heading, speed, recordedAt: now }
        });

        res.json({ success: true, id, recordedAt: now });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/location/users?projectId=xxx
 * Get current locations of all team members. Optionally filtered by project.
 */
export const getUserLocations = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const projectId = req.query.projectId as string;

        let sql = `
            SELECT u.id, u.name, u.email, u.role, u.currentLatitude as latitude, u.currentLongitude as longitude,
                   u.lastLocationUpdate, u.avatar
            FROM users u
            JOIN memberships m ON m.userId = u.id AND m.companyId = ?
            WHERE u.currentLatitude IS NOT NULL AND u.currentLongitude IS NOT NULL
        `;
        const params: any[] = [tenantId];

        if (projectId) {
            sql += ` AND u.id IN (SELECT tm.userId FROM team_members tm WHERE tm.projectId = ?)`;
            params.push(projectId);
        }

        sql += ` ORDER BY u.lastLocationUpdate DESC`;

        const users = await db.all(sql, params);

        // Map role to display role for the map
        const mappedUsers = users.map((u: any) => ({
            ...u,
            mapRole: mapUserRole(u.role),
            status: isActiveRecently(u.lastLocationUpdate) ? 'Active' : 'Idle',
            lastActive: getRelativeTime(u.lastLocationUpdate)
        }));

        res.json(mappedUsers);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/location/history/:userId
 * Get location history for a specific user (last 24 hours).
 */
export const getLocationHistory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { userId } = req.params;
        const hours = parseInt(req.query.hours as string) || 24;

        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const history = await db.all(
            `SELECT id, latitude, longitude, accuracy, altitude, heading, speed, recordedAt
             FROM location_logs
             WHERE userId = ? AND companyId = ? AND recordedAt >= ?
             ORDER BY recordedAt DESC`,
            [userId, tenantId, cutoff]
        );

        res.json(history);
    } catch (error) {
        next(error);
    }
};

// ─── Site Maps (AI-Generated from PDF) ──────────────────────────────────────

/**
 * POST /api/v1/site-maps
 * Create a new site map record (after PDF is uploaded and processed).
 */
export const createSiteMap = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { projectId, name, sourceFileUrl, sourceFileName, mapImageUrl, boundaries, metadata } = req.body;

        if (!projectId || !name) {
            res.status(400).json({ error: 'projectId and name are required' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO site_maps (id, companyId, projectId, name, sourceFileUrl, sourceFileName, mapImageUrl, boundaries, metadata, createdBy, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, tenantId, projectId, name, sourceFileUrl || null, sourceFileName || null, mapImageUrl || null,
                boundaries ? JSON.stringify(boundaries) : null,
                metadata ? JSON.stringify(metadata) : null,
                userId, 'active', now, now]
        );

        const siteMap = { id, companyId: tenantId, projectId, name, sourceFileUrl, sourceFileName, mapImageUrl, boundaries, metadata, createdBy: userId, status: 'active', createdAt: now, updatedAt: now };

        broadcastToProject(projectId, {
            type: 'entity_create',
            entityType: 'site_maps',
            data: siteMap
        });

        res.status(201).json(siteMap);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/site-maps?projectId=xxx
 * List site maps for a project.
 */
export const getSiteMaps = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const projectId = req.query.projectId as string;

        let sql = `SELECT * FROM site_maps WHERE companyId = ? AND status = 'active'`;
        const params: any[] = [tenantId];

        if (projectId) {
            sql += ` AND projectId = ?`;
            params.push(projectId);
        }

        sql += ` ORDER BY createdAt DESC`;

        const maps = await db.all(sql, params);
        const parsed = maps.map((m: any) => {
            let boundaries = null;
            let metadata = null;
            if (m.boundaries) { try { boundaries = JSON.parse(m.boundaries); } catch { /* malformed JSON */ } }
            if (m.metadata) { try { metadata = JSON.parse(m.metadata); } catch { /* malformed JSON */ } }
            return { ...m, boundaries, metadata };
        });

        res.json(parsed);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/site-maps/:id
 * Soft-delete a site map.
 */
export const deleteSiteMap = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { id } = req.params;

        const result = await db.run(
            `UPDATE site_maps SET status = 'deleted', updatedAt = ? WHERE id = ? AND companyId = ?`,
            [new Date().toISOString(), id, tenantId]
        );

        if (result.changes === 0) {
            res.status(404).json({ error: 'Site map not found' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// ─── Map Zones ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/site-maps/:mapId/zones
 * Add a zone to a site map.
 */
export const createMapZone = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { mapId } = req.params;
        const { label, type, top, left, width, height, protocol, trigger } = req.body;

        if (!label) {
            res.status(400).json({ error: 'label is required' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO map_zones (id, siteMapId, companyId, label, type, top, "left", width, height, protocol, trigger, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, mapId, tenantId, label, type || 'info', top || 0, left || 0, width || 10, height || 10, protocol || '', trigger || 'Entry', now]
        );

        const zone = { id, siteMapId: mapId, label, type: type || 'info', top, left, width, height, protocol, trigger, createdAt: now };

        res.status(201).json(zone);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/site-maps/:mapId/zones
 * List zones for a site map.
 */
export const getMapZones = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { mapId } = req.params;

        const zones = await db.all(
            `SELECT * FROM map_zones WHERE siteMapId = ? AND companyId = ? ORDER BY createdAt ASC`,
            [mapId, tenantId]
        );

        res.json(zones);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/site-maps/:mapId/zones/:zoneId
 */
export const deleteMapZone = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { zoneId } = req.params;

        await db.run(`DELETE FROM map_zones WHERE id = ? AND companyId = ?`, [zoneId, tenantId]);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// ─── PDF Drawing Analysis ────────────────────────────────────────────────────

/**
 * POST /api/v1/site-maps/analyze-drawing
 * Accept a PDF drawing, extract layout metadata. The heavy AI processing
 * is done on the frontend via Gemini Vision; this endpoint stores the result.
 */
export const analyzeDrawing = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const userId = req.userId || req.context?.userId;
        const db = req.tenantDb;
        const { projectId, fileName, fileUrl, analysisResult, zones } = req.body;

        if (!projectId || !fileName) {
            res.status(400).json({ error: 'projectId and fileName are required' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        // Create the site map
        await db.run(
            `INSERT INTO site_maps (id, companyId, projectId, name, sourceFileUrl, sourceFileName, mapImageUrl, boundaries, metadata, createdBy, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, tenantId, projectId, `Map: ${fileName}`, fileUrl || null, fileName, fileUrl || null,
                null,
                analysisResult ? JSON.stringify(analysisResult) : null,
                userId, 'active', now, now]
        );

        // Create zones if provided
        if (zones && Array.isArray(zones)) {
            for (const zone of zones) {
                const zoneId = uuidv4();
                await db.run(
                    `INSERT INTO map_zones (id, siteMapId, companyId, label, type, top, "left", width, height, protocol, trigger, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [zoneId, id, tenantId, zone.label, zone.type || 'info', zone.top || 0, zone.left || 0, zone.width || 10, zone.height || 10, zone.protocol || '', zone.trigger || 'Entry', now]
                );
            }
        }

        res.status(201).json({
            siteMapId: id,
            projectId,
            fileName,
            zonesCreated: zones?.length || 0,
            createdAt: now
        });
    } catch (error) {
        next(error);
    }
};

// ─── Location Alerts ────────────────────────────────────────────────────────

/**
 * GET /api/v1/location/alerts?projectId=xxx
 * Get recent location alerts (inactivity, zone breaches, anomalies).
 */
export const getLocationAlerts = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const projectId = req.query.projectId as string;

        let sql = `SELECT * FROM location_alerts WHERE companyId = ?`;
        const params: any[] = [tenantId];

        if (projectId) {
            sql += ` AND projectId = ?`;
            params.push(projectId);
        }

        sql += ` ORDER BY createdAt DESC LIMIT 50`;

        const alerts = await db.all(sql, params);
        res.json(alerts);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/location/alerts
 * Create a location alert (zone entry, inactivity, etc.).
 */
export const createLocationAlert = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
        const tenantId = req.tenantId || req.context?.tenantId;
        const db = req.tenantDb;
        const { userId, projectId, type, message, severity, zoneId, latitude, longitude } = req.body;

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO location_alerts (id, companyId, userId, projectId, type, message, severity, zoneId, latitude, longitude, acknowledged, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, tenantId, userId, projectId || null, type, message, severity || 'info', zoneId || null, latitude || null, longitude || null, 0, now]
        );

        const alert = { id, companyId: tenantId, userId, projectId, type, message, severity, zoneId, latitude, longitude, acknowledged: false, createdAt: now };

        broadcastToCompany(tenantId, {
            type: 'location_alert',
            data: alert
        });

        res.status(201).json(alert);
    } catch (error) {
        next(error);
    }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapUserRole(role: string): 'Manager' | 'Foreman' | 'Labor' {
    switch (role?.toUpperCase()) {
        case 'SUPERADMIN':
        case 'COMPANY_OWNER':
        case 'COMPANY_ADMIN':
        case 'ADMIN':
        case 'PROJECT_MANAGER':
            return 'Manager';
        case 'SUPERVISOR':
        case 'FOREMAN':
            return 'Foreman';
        default:
            return 'Labor';
    }
}

function isActiveRecently(lastUpdate: string | null): boolean {
    if (!lastUpdate) return false;
    const diff = Date.now() - new Date(lastUpdate).getTime();
    return diff < 15 * 60 * 1000; // 15 minutes
}

function getRelativeTime(dateStr: string | null): string {
    if (!dateStr) return 'Unknown';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
