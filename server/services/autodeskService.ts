import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// Autodesk API Configuration
const AUTODESK_BASE_URL = 'https://developer.api.autodesk.com';
const AUTODESK_AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/authorize';
const AUTODESK_TOKEN_URL = 'https://developer.api.autodesk.com/authentication/v2/token';

export interface AutodeskTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AutodeskProject {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  address?: string;
}

export interface AutodeskDocument {
  id: string;
  name: string;
  type: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

export interface AutodeskModel {
  id: string;
  name: string;
  urn: string;
  status: string;
  createdAt: string;
  fileType: string;
  size: number;
}

export interface BIM360Folder {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  createTime: string;
}

export interface BIM360Item {
  id: string;
  name: string;
  type: string;
  folderId: string;
  createTime: string;
  lastModifiedTime: string;
}

export class AutodeskService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.AUTODESK_CLIENT_ID || '';
    this.clientSecret = process.env.AUTODESK_CLIENT_SECRET || '';
    this.redirectUri = process.env.AUTODESK_REDIRECT_URI || 'http://localhost:3000/api/integrations/autodesk/callback';
  }

  /**
   * Check if Autodesk integration is configured
   */
  isEnabled(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'data:read',
      'data:write',
      'data:create',
      'data:search',
      'bucket:create',
      'bucket:read',
      'bucket:update',
      'bucket:delete',
      'viewables:read',
      'account:read',
      'user-profile:read'
    ].join('%20');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes
    });

    if (state) {
      params.append('state', state);
    }

    return `${AUTODESK_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<AutodeskTokens> {
    const response = await fetch(AUTODESK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Autodesk token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AutodeskTokens> {
    const response = await fetch(AUTODESK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Autodesk token refresh failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user profile from Autodesk
   */
  async getUserProfile(accessToken: string): Promise<any> {
    const response = await fetch(`${AUTODESK_BASE_URL}/userprofile/v1/users/@me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Autodesk user profile');
    }

    return response.json();
  }

  /**
   * Get BIM 360/ACC hubs (accounts)
   */
  async getHubs(accessToken: string): Promise<any[]> {
    const response = await fetch(`${AUTODESK_BASE_URL}/project/v1/hubs`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Autodesk hubs');
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get projects from a hub
   */
  async getProjects(accessToken: string, hubId: string): Promise<AutodeskProject[]> {
    const response = await fetch(`${AUTODESK_BASE_URL}/project/v1/hubs/${hubId}/projects`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Autodesk projects');
    }

    const data = await response.json();
    return data.data.map((p: any) => ({
      id: p.id,
      name: p.attributes.name,
      type: p.attributes.extension?.type || 'projects',
      status: p.attributes.status,
      startDate: p.attributes.startDate,
      endDate: p.attributes.endDate,
      address: p.attributes.address
    }));
  }

  /**
   * Get top-level folders for a project
   */
  async getProjectFolders(accessToken: string, projectId: string): Promise<BIM360Folder[]> {
    // Remove 'b.' prefix if present for API calls
    const cleanProjectId = projectId.replace(/^b\./, '');
    
    const response = await fetch(
      `${AUTODESK_BASE_URL}/data/v1/projects/b.${cleanProjectId}/folders`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch project folders');
    }

    const data = await response.json();
    return data.data.map((f: any) => ({
      id: f.id,
      name: f.attributes.name,
      type: f.attributes.extension?.type || 'folders',
      parentId: f.attributes.parentId,
      createTime: f.attributes.createTime
    }));
  }

  /**
   * Get folder contents (documents/items)
   */
  async getFolderContents(accessToken: string, projectId: string, folderId: string): Promise<BIM360Item[]> {
    const cleanProjectId = projectId.replace(/^b\./, '');
    
    const response = await fetch(
      `${AUTODESK_BASE_URL}/data/v1/projects/b.${cleanProjectId}/folders/${folderId}/contents`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch folder contents');
    }

    const data = await response.json();
    return data.data.map((item: any) => ({
      id: item.id,
      name: item.attributes.displayName || item.attributes.name,
      type: item.type,
      folderId: folderId,
      createTime: item.attributes.createTime,
      lastModifiedTime: item.attributes.lastModifiedTime
    }));
  }

  /**
   * Get document details
   */
  async getDocumentDetails(accessToken: string, projectId: string, itemId: string): Promise<AutodeskDocument> {
    const cleanProjectId = projectId.replace(/^b\./, '');
    
    const response = await fetch(
      `${AUTODESK_BASE_URL}/data/v1/projects/b.${cleanProjectId}/items/${itemId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch document details');
    }

    const data = await response.json();
    return {
      id: data.data.id,
      name: data.data.attributes.displayName,
      type: data.data.attributes.extension?.type || 'items',
      version: data.data.attributes.versionNumber,
      createdAt: data.data.attributes.createTime,
      updatedAt: data.data.attributes.lastModifiedTime
    };
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(accessToken: string, projectId: string, itemId: string): Promise<string> {
    const cleanProjectId = projectId.replace(/^b\./, '');
    
    // First get the tip version
    const itemResponse = await fetch(
      `${AUTODESK_BASE_URL}/data/v1/projects/b.${cleanProjectId}/items/${itemId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!itemResponse.ok) {
      throw new Error('Failed to fetch item details');
    }

    const itemData = await itemResponse.json();
    const tipVersionId = itemData.data.relationships?.tip?.data?.id;

    if (!tipVersionId) {
      throw new Error('No tip version found for item');
    }

    // Get the download URL from the version
    const versionResponse = await fetch(
      `${AUTODESK_BASE_URL}/data/v1/projects/b.${cleanProjectId}/versions/${tipVersionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!versionResponse.ok) {
      throw new Error('Failed to fetch version details');
    }

    const versionData = await versionResponse.json();
    const downloadUrl = versionData.data?.attributes?.extension?.data?.source?.uri;

    if (!downloadUrl) {
      throw new Error('No download URL available');
    }

    return downloadUrl;
  }

  /**
   * Get model/viewable data for Forge Viewer
   */
  async getModelViewable(accessToken: string, projectId: string, itemId: string): Promise<any> {
    const cleanProjectId = projectId.replace(/^b\./, '');
    
    const response = await fetch(
      `${AUTODESK_BASE_URL}/modelderivative/v2/designdata/job`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: {
            urn: itemId
          },
          output: {
            formats: [
              { type: 'svf', views: ['2d', '3d'] }
            ]
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create model derivative job');
    }

    return response.json();
  }

  /**
   * Sync BIM 360 project data to local database
   */
  async syncProjectData(companyId: string, projectId: string, accessToken: string): Promise<any> {
    logger.info(`[Autodesk] Syncing project ${projectId} for company ${companyId}`);

    try {
      // Get hubs
      const hubs = await this.getHubs(accessToken);
      
      const syncedProjects = [];
      for (const hub of hubs) {
        const projects = await this.getProjects(accessToken, hub.id);
        syncedProjects.push(...projects);
      }

      // Update last synced timestamp
      const db = getDb();
      await db.run(
        'UPDATE integrations SET lastSyncedAt = ? WHERE companyId = ? AND type = ?',
        [new Date().toISOString(), companyId, 'autodesk']
      );

      return {
        success: true,
        projectsSynced: syncedProjects.length,
        projects: syncedProjects
      };
    } catch (error) {
      logger.error('[Autodesk] Sync failed:', error);
      throw error;
    }
  }

  /**
   * Import documents from BIM 360 to local project
   */
  async importDocuments(
    companyId: string, 
    projectId: string, 
    autodeskProjectId: string,
    folderId: string,
    accessToken: string
  ): Promise<any> {
    logger.info(`[Autodesk] Importing documents from folder ${folderId}`);

    try {
      const items = await this.getFolderContents(accessToken, autodeskProjectId, folderId);
      const importedDocs = [];

      for (const item of items) {
        if (item.type === 'items') {
          const docDetails = await this.getDocumentDetails(accessToken, autodeskProjectId, item.id);
          
          // Store in database
          const db = getDb();
          const docId = uuidv4();
          
          await db.run(
            `INSERT INTO documents (id, companyId, projectId, projectName, name, type, size, date, status, url, externalId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              docId,
              companyId,
              projectId,
              'Imported from BIM 360',
              docDetails.name,
              this.getFileExtension(docDetails.name),
              '0 KB',
              docDetails.createdAt,
              'imported',
              null, // Will be populated when downloaded
              item.id
            ]
          );

          importedDocs.push({
            id: docId,
            name: docDetails.name,
            externalId: item.id
          });
        }
      }

      return {
        success: true,
        importedCount: importedDocs.length,
        documents: importedDocs
      };
    } catch (error) {
      logger.error('[Autodesk] Document import failed:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events from Autodesk
   */
  async handleWebhook(event: any): Promise<void> {
    logger.info('[Autodesk] Webhook received:', event);

    const { eventType, data } = event;

    switch (eventType) {
      case 'dm.version.added':
        await this.handleVersionAdded(data);
        break;
      case 'dm.version.modified':
        await this.handleVersionModified(data);
        break;
      case 'dm.version.deleted':
        await this.handleVersionDeleted(data);
        break;
      case 'dm.folder.added':
        await this.handleFolderAdded(data);
        break;
      default:
        logger.info(`[Autodesk] Unhandled webhook event: ${eventType}`);
    }
  }

  private async handleVersionAdded(data: any): Promise<void> {
    logger.info('[Autodesk] New version added:', data);
    // Trigger sync or notification
  }

  private async handleVersionModified(data: any): Promise<void> {
    logger.info('[Autodesk] Version modified:', data);
    // Update local document metadata
  }

  private async handleVersionDeleted(data: any): Promise<void> {
    logger.info('[Autodesk] Version deleted:', data);
    // Mark local document as deleted or remove
  }

  private async handleFolderAdded(data: any): Promise<void> {
    logger.info('[Autodesk] Folder added:', data);
    // Sync folder structure
  }

  private getFileExtension(filename: string): string {
    const ext = filename.split('.').pop();
    return ext ? ext.toLowerCase() : 'unknown';
  }

  /**
   * Test connection to Autodesk API
   */
  async testConnection(accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const profile = await this.getUserProfile(accessToken);
      return {
        success: true,
        message: `Connected as ${profile.firstName} ${profile.lastName} (${profile.email})`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection failed'
      };
    }
  }
}

export const autodeskService = new AutodeskService();
