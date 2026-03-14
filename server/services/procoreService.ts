import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

// Procore API Configuration
const PROCORE_API_BASE = 'https://api.procore.com';
const PROCORE_OAUTH_URL = 'https://login.procore.com/oauth/authorize';
const PROCORE_TOKEN_URL = 'https://login.procore.com/oauth/token';

export interface ProcoreTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  created_at: number;
}

export interface ProcoreProject {
  id: number;
  name: string;
  display_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcoreDocument {
  id: number;
  name: string;
  description?: string;
  file_name?: string;
  content_type?: string;
  size?: number;
  created_at: string;
  updated_at: string;
  folder_id?: number;
}

export class ProcoreService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.PROCORE_CLIENT_ID || '';
    this.clientSecret = process.env.PROCORE_CLIENT_SECRET || '';
    this.redirectUri = process.env.PROCORE_REDIRECT_URI || 'http://localhost:3000/api/integrations/procore/callback';
  }

  /**
   * Check if Procore OAuth is configured
   */
  isEnabled(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    if (!this.isEnabled()) {
      throw new AppError('Procore OAuth not configured', 503);
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'read write',
    });

    if (state) {
      params.append('state', state);
    }

    return `${PROCORE_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<ProcoreTokens> {
    if (!this.isEnabled()) {
      throw new AppError('Procore OAuth not configured', 503);
    }

    const response = await fetch(PROCORE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AppError(`Token exchange failed: ${error}`, 400);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      created_at: Date.now(),
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<ProcoreTokens> {
    if (!this.isEnabled()) {
      throw new AppError('Procore OAuth not configured', 503);
    }

    const response = await fetch(PROCORE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AppError(`Token refresh failed: ${error}`, 400);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: data.expires_in,
      created_at: Date.now(),
    };
  }

  /**
   * Make authenticated API request to Procore
   */
  private async apiRequest(endpoint: string, accessToken: string, options: RequestInit = {}): Promise<any> {
    const url = `${PROCORE_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Procore API error: ${response.status} - ${error}`);
      throw new AppError(`Procore API error: ${response.statusText}`, response.status);
    }

    return response.json();
  }

  /**
   * Get company ID from access token
   */
  async getCompanyId(accessToken: string): Promise<number> {
    const me = await this.apiRequest('/rest/v1.0/me', accessToken);
    return me.company?.id;
  }

  /**
   * Get all projects from Procore
   */
  async getProjects(accessToken: string, companyId: number): Promise<ProcoreProject[]> {
    return this.apiRequest(`/rest/v1.0/projects?company_id=${companyId}`, accessToken);
  }

  /**
   * Get a specific project
   */
  async getProject(accessToken: string, projectId: number): Promise<ProcoreProject> {
    return this.apiRequest(`/rest/v1.0/projects/${projectId}`, accessToken);
  }

  /**
   * Get documents for a project
   */
  async getDocuments(accessToken: string, projectId: number): Promise<ProcoreDocument[]> {
    return this.apiRequest(`/rest/v1.0/projects/${projectId}/documents`, accessToken);
  }

  /**
   * Upload document to Procore
   */
  async uploadDocument(accessToken: string, projectId: number, fileData: Buffer, filename: string, contentType: string): Promise<ProcoreDocument> {
    const formData = new FormData();
    formData.append('file', new Blob([fileData], { type: contentType }), filename);

    return this.apiRequest(`/rest/v1.0/projects/${projectId}/documents`, accessToken, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': undefined as any, // Let fetch set the boundary
      },
    });
  }

  /**
   * Download document from Procore
   */
  async downloadDocument(accessToken: string, projectId: number, documentId: number): Promise<Buffer> {
    const response = await fetch(`${PROCORE_API_BASE}/rest/v1.0/projects/${projectId}/documents/${documentId}/download`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new AppError('Failed to download document', response.status);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Sync projects from Procore to local database
   */
  async syncProjects(companyId: string, accessToken: string): Promise<{ synced: number; projects: any[] }> {
    const db = getDb();
    const procoreCompanyId = await this.getCompanyId(accessToken);
    const projects = await this.getProjects(accessToken, procoreCompanyId);
    
    const syncedProjects = [];
    let syncedCount = 0;

    for (const project of projects) {
      if (!project.active) continue;

      const existing = await db.get(
        'SELECT * FROM projects WHERE externalId = ? AND companyId = ?',
        [project.id.toString(), companyId]
      );

      const projectData = {
        name: project.name || project.display_name,
        description: `Imported from Procore`,
        status: 'active',
        externalId: project.id.toString(),
        externalSource: 'procore',
        companyId,
        updatedAt: new Date().toISOString(),
      };

      if (existing) {
        await db.run(
          'UPDATE projects SET name = ?, description = ?, updatedAt = ? WHERE id = ?',
          [projectData.name, projectData.description, projectData.updatedAt, existing.id]
        );
      } else {
        const id = uuidv4();
        await db.run(
          'INSERT INTO projects (id, name, description, status, externalId, externalSource, companyId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, projectData.name, projectData.description, projectData.status, projectData.externalId, projectData.externalSource, projectData.companyId, projectData.updatedAt, projectData.updatedAt]
        );
        syncedCount++;
      }

      syncedProjects.push({
        procoreId: project.id,
        name: project.name || project.display_name,
        synced: true,
      });
    }

    // Update last synced timestamp
    await db.run(
      'UPDATE integrations SET lastSyncedAt = ? WHERE companyId = ? AND type = ?',
      [new Date().toISOString(), companyId, 'procore']
    );

    logger.info(`[Procore] Synced ${syncedCount} new projects for company ${companyId}`);
    
    return { synced: syncedCount, projects: syncedProjects };
  }

  /**
   * Test connection to Procore API
   */
  async testConnection(accessToken: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const me = await this.apiRequest('/rest/v1.0/me', accessToken);
      return {
        success: true,
        user: {
          id: me.id,
          name: me.name,
          email: me.email,
          company: me.company,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle Procore webhook
   */
  async handleWebhook(payload: any, signature: string): Promise<{ processed: boolean; type?: string }> {
    // Verify webhook signature (if configured)
    const webhookSecret = process.env.PROCORE_WEBHOOK_SECRET;
    if (webhookSecret && !this.verifyWebhookSignature(payload, signature, webhookSecret)) {
      throw new AppError('Invalid webhook signature', 401);
    }

    const { resource_name, event_type, resource } = payload;
    
    logger.info(`[Procore Webhook] Received ${event_type} event for ${resource_name}`);

    // Handle different event types
    switch (`${resource_name}.${event_type}`) {
      case 'project.create':
        await this.handleProjectCreate(resource);
        break;
      case 'project.update':
        await this.handleProjectUpdate(resource);
        break;
      case 'document.create':
        await this.handleDocumentCreate(resource);
        break;
      case 'document.update':
        await this.handleDocumentUpdate(resource);
        break;
      default:
        logger.info(`[Procore Webhook] Unhandled event: ${resource_name}.${event_type}`);
    }

    return { processed: true, type: `${resource_name}.${event_type}` };
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
    // Implement HMAC signature verification
    // This is a placeholder - actual implementation depends on Procore's webhook format
    return true;
  }

  private async handleProjectCreate(resource: any): Promise<void> {
    logger.info(`[Procore Webhook] Project created: ${resource.id} - ${resource.name}`);
    // Trigger sync for the new project
  }

  private async handleProjectUpdate(resource: any): Promise<void> {
    logger.info(`[Procore Webhook] Project updated: ${resource.id} - ${resource.name}`);
    // Update local project data
  }

  private async handleDocumentCreate(resource: any): Promise<void> {
    logger.info(`[Procore Webhook] Document created: ${resource.id} - ${resource.name}`);
    // Sync the new document
  }

  private async handleDocumentUpdate(resource: any): Promise<void> {
    logger.info(`[Procore Webhook] Document updated: ${resource.id} - ${resource.name}`);
    // Update local document reference
  }
}

export const procoreService = new ProcoreService();
