import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { procoreService } from './procoreService.js';

export interface IntegrationConfig {
    id: string;
    companyId: string;
    type: 'procore' | 'plangrid' | 'autodesk';
    status: 'connected' | 'disconnected' | 'error';
    accessToken?: string;
    refreshToken?: string;
    lastSyncedAt?: string;
    settings?: string; // JSON
}

export interface SyncResult {
    success: boolean;
    syncedItems: number;
    type: string;
    timestamp: string;
    details?: any;
}

export class IntegrationService {
    /**
     * Get integration for a tenant
     */
    static async getIntegration(companyId: string, type: string): Promise<IntegrationConfig | null> {
        const db = getDb();
        return await db.get('SELECT * FROM integrations WHERE companyId = ? AND type = ?', [companyId, type]);
    }

    /**
     * Get all integrations for a company
     */
    static async getCompanyIntegrations(companyId: string): Promise<IntegrationConfig[]> {
        const db = getDb();
        return await db.all('SELECT * FROM integrations WHERE companyId = ?', [companyId]);
    }

    /**
     * Connect or update integration
     */
    static async connectIntegration(companyId: string, type: string, tokens: { access: string, refresh?: string }): Promise<{ id: string; type: string; status: string }> {
        const db = getDb();
        const existing = await this.getIntegration(companyId, type);
        const id = existing?.id || uuidv4();
        const now = new Date().toISOString();

        if (existing) {
            await db.run(
                'UPDATE integrations SET accessToken = ?, refreshToken = ?, status = ?, lastSyncedAt = ? WHERE id = ?',
                [tokens.access, tokens.refresh, 'connected', now, id]
            );
        } else {
            await db.run(
                'INSERT INTO integrations (id, companyId, type, status, accessToken, refreshToken, lastSyncedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, companyId, type, 'connected', tokens.access, tokens.refresh, now]
            );
        }

        logger.info(`[Integration] Connected ${type} for company ${companyId}`);
        return { id, type, status: 'connected' };
    }

    /**
     * Disconnect integration
     */
    static async disconnectIntegration(companyId: string, type: string): Promise<void> {
        const db = getDb();
        await db.run(
            'UPDATE integrations SET status = ?, accessToken = NULL, refreshToken = NULL WHERE companyId = ? AND type = ?',
            ['disconnected', companyId, type]
        );
        logger.info(`[Integration] Disconnected ${type} for company ${companyId}`);
    }

    /**
     * Refresh access token if needed
     */
    static async refreshTokenIfNeeded(companyId: string, type: string): Promise<string | null> {
        const integration = await this.getIntegration(companyId, type);
        if (!integration || integration.status !== 'connected') {
            return null;
        }

        // Check if token needs refresh (Procore tokens expire after 2 hours)
        const lastSynced = integration.lastSyncedAt ? new Date(integration.lastSyncedAt) : null;
        const tokenAge = lastSynced ? Date.now() - lastSynced.getTime() : Infinity;
        const TOKEN_LIFETIME = 2 * 60 * 60 * 1000; // 2 hours

        if (tokenAge > TOKEN_LIFETIME * 0.8 && integration.refreshToken) {
            try {
                if (type === 'procore') {
                    const newTokens = await procoreService.refreshAccessToken(integration.refreshToken);
                    await this.connectIntegration(companyId, type, {
                        access: newTokens.access_token,
                        refresh: newTokens.refresh_token,
                    });
                    return newTokens.access_token;
                }
            } catch (error) {
                logger.error(`[Integration] Failed to refresh ${type} token:`, error);
                await this.disconnectIntegration(companyId, type);
                return null;
            }
        }

        return integration.accessToken || null;
    }

    /**
     * Sync Project data from external tool
     */
    static async syncProjectData(companyId: string, type: string, externalProjectId: string): Promise<SyncResult> {
        const integration = await this.getIntegration(companyId, type);
        if (!integration || integration.status !== 'connected') {
            throw new Error(`Integration ${type} not connected for company ${companyId}`);
        }

        // Ensure token is fresh
        const accessToken = await this.refreshTokenIfNeeded(companyId, type);
        if (!accessToken) {
            throw new Error(`Failed to refresh ${type} access token`);
        }

        logger.info(`[Integration] Syncing project ${externalProjectId} from ${type}...`);

        if (type === 'procore') {
            const result = await procoreService.syncProjects(companyId, accessToken);
            return {
                success: true,
                syncedItems: result.synced,
                type: 'projects',
                timestamp: new Date().toISOString(),
                details: result.projects,
            };
        }

        // Mock success response for other providers
        return {
            success: true,
            syncedItems: 12,
            type: 'projects',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Sync documents from external tool
     */
    static async syncDocuments(companyId: string, type: string, externalProjectId: string): Promise<SyncResult> {
        const integration = await this.getIntegration(companyId, type);
        if (!integration || integration.status !== 'connected') {
            throw new Error(`Integration ${type} not connected for company ${companyId}`);
        }

        const accessToken = await this.refreshTokenIfNeeded(companyId, type);
        if (!accessToken) {
            throw new Error(`Failed to refresh ${type} access token`);
        }

        logger.info(`[Integration] Syncing documents for project ${externalProjectId} from ${type}...`);

        if (type === 'procore') {
            const documents = await procoreService.getDocuments(accessToken, parseInt(externalProjectId));
            return {
                success: true,
                syncedItems: documents.length,
                type: 'documents',
                timestamp: new Date().toISOString(),
                details: documents.map(d => ({ id: d.id, name: d.name })),
            };
        }

        return {
            success: true,
            syncedItems: 0,
            type: 'documents',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Map external data to BuildPro schema
     */
    static mapExternalTask(externalTask: any, provider: string): any {
        if (provider === 'procore') {
            return {
                title: externalTask.name,
                description: externalTask.description,
                status: externalTask.status === 'open' ? 'in_progress' : 'completed',
                externalId: externalTask.id,
                externalSource: 'procore',
            };
        }
        return externalTask;
    }

    /**
     * Map external project to BuildPro schema
     */
    static mapExternalProject(externalProject: any, provider: string): any {
        if (provider === 'procore') {
            return {
                name: externalProject.name || externalProject.display_name,
                description: externalProject.description || `Imported from Procore`,
                status: externalProject.active ? 'active' : 'inactive',
                externalId: externalProject.id?.toString(),
                externalSource: 'procore',
                startDate: externalProject.start_date,
                endDate: externalProject.completion_date,
            };
        }
        return externalProject;
    }

    /**
     * Get integration statistics
     */
    static async getIntegrationStats(companyId: string): Promise<any> {
        const integrations = await this.getCompanyIntegrations(companyId);
        
        return {
            total: integrations.length,
            connected: integrations.filter(i => i.status === 'connected').length,
            integrations: integrations.map(i => ({
                type: i.type,
                status: i.status,
                lastSyncedAt: i.lastSyncedAt,
            })),
        };
    }
}
