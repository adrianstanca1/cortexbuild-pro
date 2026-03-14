import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// PlanGrid API Configuration
const PLANGRID_API_BASE = 'https://api.plangrid.com/v1';
const PLANGRID_OAUTH_BASE = 'https://io.plangrid.com/oauth';

export interface PlanGridConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface PlanGridTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface PlanGridProject {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PlanGridSheet {
  id: string;
  name: string;
  version: string;
  file_name: string;
  uploaded_at: string;
  url: string;
}

export interface PlanGridPhoto {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url: string;
  created_at: string;
  created_by: {
    id: string;
    name: string;
  };
}

export interface PlanGridDocument {
  id: string;
  title: string;
  file_name: string;
  file_size: number;
  content_type: string;
  url: string;
  uploaded_at: string;
}

export interface PlanGridWebhookEvent {
  event_type: string;
  project_id: string;
  resource_id: string;
  resource_type: string;
  timestamp: string;
  data: any;
}

export class PlanGridService {
  private static config: PlanGridConfig = {
    clientId: process.env.PLANGRID_CLIENT_ID || '',
    clientSecret: process.env.PLANGRID_CLIENT_SECRET || '',
    redirectUri: process.env.PLANGRID_REDIRECT_URI || 'http://localhost:3000/api/integrations/plangrid/callback'
  };

  /**
   * Get OAuth authorization URL
   */
  static getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'read write',
      ...(state && { state })
    });
    return `${PLANGRID_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<PlanGridTokens> {
    const response = await fetch(`${PLANGRID_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PlanGrid OAuth error: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<PlanGridTokens> {
    const response = await fetch(`${PLANGRID_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PlanGrid token refresh error: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
  }

  /**
   * Save integration tokens to database
   */
  static async saveIntegration(companyId: string, tokens: PlanGridTokens): Promise<void> {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const existing = await db.get(
      'SELECT id FROM integrations WHERE companyId = ? AND type = ?',
      [companyId, 'plangrid']
    );

    if (existing) {
      await db.run(
        `UPDATE integrations 
         SET accessToken = ?, refreshToken = ?, status = ?, lastSyncedAt = ? 
         WHERE id = ?`,
        [tokens.accessToken, tokens.refreshToken, 'connected', now, existing.id]
      );
    } else {
      await db.run(
        `INSERT INTO integrations (id, companyId, type, status, accessToken, refreshToken, lastSyncedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, 'plangrid', 'connected', tokens.accessToken, tokens.refreshToken, now]
      );
    }

    logger.info(`[PlanGrid] Integration saved for company ${companyId}`);
  }

  /**
   * Get stored integration for company
   */
  static async getIntegration(companyId: string): Promise<any> {
    const db = getDb();
    return await db.get(
      'SELECT * FROM integrations WHERE companyId = ? AND type = ?',
      [companyId, 'plangrid']
    );
  }

  /**
   * Make authenticated API request
   */
  private static async apiRequest(endpoint: string, accessToken: string, options: RequestInit = {}): Promise<any> {
    const url = `${PLANGRID_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - token may need refresh');
      }
      const error = await response.text();
      throw new Error(`PlanGrid API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get all projects from PlanGrid
   */
  static async getProjects(accessToken: string): Promise<PlanGridProject[]> {
    const data = await this.apiRequest('/projects', accessToken);
    return data.data || [];
  }

  /**
   * Get project details
   */
  static async getProject(accessToken: string, projectId: string): Promise<PlanGridProject> {
    return await this.apiRequest(`/projects/${projectId}`, accessToken);
  }

  /**
   * Get sheets for a project
   */
  static async getSheets(accessToken: string, projectId: string): Promise<PlanGridSheet[]> {
    const data = await this.apiRequest(`/projects/${projectId}/sheets`, accessToken);
    return data.data || [];
  }

  /**
   * Get sheet details
   */
  static async getSheet(accessToken: string, projectId: string, sheetId: string): Promise<PlanGridSheet> {
    return await this.apiRequest(`/projects/${projectId}/sheets/${sheetId}`, accessToken);
  }

  /**
   * Download sheet PDF
   */
  static async downloadSheet(accessToken: string, projectId: string, sheetId: string): Promise<ArrayBuffer> {
    const url = `${PLANGRID_API_BASE}/projects/${projectId}/sheets/${sheetId}/pdf`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download sheet: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Sync sheets to local database
   */
  static async syncSheets(companyId: string, projectId: string, accessToken: string): Promise<{ synced: number; sheets: PlanGridSheet[] }> {
    const sheets = await this.getSheets(accessToken, projectId);
    const db = getDb();
    const now = new Date().toISOString();

    // Store sync metadata
    const syncId = uuidv4();
    await db.run(
      `INSERT INTO integration_data (id, integration_id, company_id, external_id, data, status, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [syncId, 'plangrid', companyId, projectId, JSON.stringify({ type: 'sheets', count: sheets.length }), 'synced', now]
    );

    logger.info(`[PlanGrid] Synced ${sheets.length} sheets for project ${projectId}`);
    return { synced: sheets.length, sheets };
  }

  /**
   * Get photos for a project
   */
  static async getPhotos(accessToken: string, projectId: string, limit: number = 100): Promise<PlanGridPhoto[]> {
    const data = await this.apiRequest(`/projects/${projectId}/photos?limit=${limit}`, accessToken);
    return data.data || [];
  }

  /**
   * Get photo details
   */
  static async getPhoto(accessToken: string, projectId: string, photoId: string): Promise<PlanGridPhoto> {
    return await this.apiRequest(`/projects/${projectId}/photos/${photoId}`, accessToken);
  }

  /**
   * Import photos to local storage
   */
  static async importPhotos(companyId: string, projectId: string, accessToken: string): Promise<{ imported: number; photos: PlanGridPhoto[] }> {
    const photos = await this.getPhotos(accessToken, projectId);
    const db = getDb();
    const now = new Date().toISOString();

    // Store photo metadata
    for (const photo of photos) {
      const photoId = uuidv4();
      await db.run(
        `INSERT INTO integration_data (id, integration_id, company_id, external_id, data, status, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING`,
        [photoId, 'plangrid', companyId, photo.id, JSON.stringify(photo), 'synced', now]
      );
    }

    logger.info(`[PlanGrid] Imported ${photos.length} photos for project ${projectId}`);
    return { imported: photos.length, photos };
  }

  /**
   * Get documents for a project
   */
  static async getDocuments(accessToken: string, projectId: string): Promise<PlanGridDocument[]> {
    const data = await this.apiRequest(`/projects/${projectId}/documents`, accessToken);
    return data.data || [];
  }

  /**
   * Import documents
   */
  static async importDocuments(companyId: string, projectId: string, accessToken: string): Promise<{ imported: number; documents: PlanGridDocument[] }> {
    const documents = await this.getDocuments(accessToken, projectId);
    const db = getDb();
    const now = new Date().toISOString();

    for (const doc of documents) {
      const docId = uuidv4();
      await db.run(
        `INSERT INTO integration_data (id, integration_id, company_id, external_id, data, status, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING`,
        [docId, 'plangrid', companyId, doc.id, JSON.stringify(doc), 'synced', now]
      );
    }

    logger.info(`[PlanGrid] Imported ${documents.length} documents for project ${projectId}`);
    return { imported: documents.length, documents };
  }

  /**
   * Test API connection
   */
  static async testConnection(accessToken: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const user = await this.apiRequest('/me', accessToken);
      return {
        success: true,
        message: 'Connection successful',
        user
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Disconnect integration
   */
  static async disconnect(companyId: string): Promise<void> {
    const db = getDb();
    await db.run(
      'UPDATE integrations SET status = ?, accessToken = NULL, refreshToken = NULL WHERE companyId = ? AND type = ?',
      ['disconnected', companyId, 'plangrid']
    );
    logger.info(`[PlanGrid] Integration disconnected for company ${companyId}`);
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(event: PlanGridWebhookEvent): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();

    // Store webhook event
    const eventId = uuidv4();
    await db.run(
      `INSERT INTO integration_data (id, integration_id, company_id, external_id, data, status, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [eventId, 'plangrid', event.project_id, event.resource_id, JSON.stringify(event), 'pending', now]
    );

    // Process based on event type
    switch (event.event_type) {
      case 'sheet.created':
      case 'sheet.updated':
        logger.info(`[PlanGrid Webhook] Sheet ${event.event_type}: ${event.resource_id}`);
        break;
      case 'photo.created':
        logger.info(`[PlanGrid Webhook] Photo created: ${event.resource_id}`);
        break;
      case 'document.created':
        logger.info(`[PlanGrid Webhook] Document created: ${event.resource_id}`);
        break;
      default:
        logger.info(`[PlanGrid Webhook] Unhandled event: ${event.event_type}`);
    }

    // Mark as processed
    await db.run(
      'UPDATE integration_data SET status = ? WHERE id = ?',
      ['synced', eventId]
    );
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(companyId: string): Promise<any> {
    const db = getDb();
    const integration = await this.getIntegration(companyId);
    
    if (!integration) {
      return { connected: false };
    }

    const stats = await db.all(
      `SELECT status, COUNT(*) as count FROM integration_data 
       WHERE integration_id = ? AND company_id = ? GROUP BY status`,
      ['plangrid', companyId]
    );

    return {
      connected: integration.status === 'connected',
      lastSyncedAt: integration.lastSyncedAt,
      stats: stats.reduce((acc: any, s: any) => {
        acc[s.status] = s.count;
        return acc;
      }, {})
    };
  }
}

export default PlanGridService;
